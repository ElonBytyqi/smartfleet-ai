using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Infrastructure.Persistence;
using SmartFleet.Infrastructure.Telemetry;

namespace SmartFleet.Infrastructure.Services;

public class TelemetryService : ITelemetryService
{
    private readonly TelemetryDbContext _mongo;
    private readonly ILiveStateService _live;
    private readonly ApplicationDbContext _db;

    // Pragjet per alarmet
    private const double LowBattery = 25;
    private const double CriticalBattery = 15;
    private const int MinSatellites = 6;
    private const double MaxAltitude = 500;
    private const double HighVibration = 60;

    public TelemetryService(
        TelemetryDbContext mongo,
        ILiveStateService live,
        ApplicationDbContext db)
    {
        _mongo = mongo;
        _live = live;
        _db = db;
    }

    public async Task<(bool Success, string? Error)> IngestAsync(IngestTelemetryRequest request)
    {
        // Validime baze — te dhena te pavlefshme s'duhet te hyjne ne histori
        if (request.Latitude is < -90 or > 90)
            return (false, "Latitude out of range.");
        if (request.Longitude is < -180 or > 180)
            return (false, "Longitude out of range.");
        if (request.BatteryPercentage is < 0 or > 100)
            return (false, "Battery percentage out of range.");

        if (!await _db.Drones.AnyAsync(d => d.Id == request.DroneId))
            return (false, "Drone does not exist.");

        var point = new TelemetryPoint
        {
            DroneId = request.DroneId,
            MissionId = request.MissionId,
            Timestamp = request.Timestamp?.ToUniversalTime() ?? DateTime.UtcNow,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            AltitudeMeters = request.AltitudeMeters,
            GroundSpeedMs = request.GroundSpeedMs,
            VerticalSpeedMs = request.VerticalSpeedMs,
            HeadingDegrees = request.HeadingDegrees,
            BatteryPercentage = request.BatteryPercentage,
            BatteryVoltage = request.BatteryVoltage,
            SatelliteCount = request.SatelliteCount,
            SignalStrength = request.SignalStrength,
            TemperatureCelsius = request.TemperatureCelsius,
            VibrationLevel = request.VibrationLevel,
            FlightMode = request.FlightMode ?? "Unknown",
            IsArmed = request.IsArmed
        };

        // Historia ne Mongo, gjendja e fundit ne Redis
        await _mongo.TelemetryPoints.InsertOneAsync(point);
        await _live.SetLastPositionAsync(request.DroneId, point);

        return (true, null);
    }

    public async Task<List<LiveDroneResponse>> GetLiveFleetAsync()
    {
        var points = await _live.GetAllLastPositionsAsync();
        if (points.Count == 0) return new List<LiveDroneResponse>();

        var droneIds = points.Select(p => p.DroneId).ToList();

        // Nje query e vetme per te gjithe dronet
        var drones = await _db.Drones
            .Where(d => droneIds.Contains(d.Id))
            .Select(d => new { d.Id, d.SerialNumber, d.Nickname, d.Status })
            .ToListAsync();

        var missionIds = points.Where(p => p.MissionId.HasValue)
            .Select(p => p.MissionId!.Value).Distinct().ToList();

        var missions = await _db.Missions
            .Where(m => missionIds.Contains(m.Id))
            .Select(m => new { m.Id, m.Title })
            .ToListAsync();

        var result = new List<LiveDroneResponse>();

        foreach (var p in points.OrderByDescending(x => x.Timestamp))
        {
            var drone = drones.FirstOrDefault(d => d.Id == p.DroneId);
            if (drone == null) continue;

            var mission = p.MissionId.HasValue
                ? missions.FirstOrDefault(m => m.Id == p.MissionId.Value)
                : null;

            result.Add(new LiveDroneResponse(
                p.DroneId, drone.SerialNumber, drone.Nickname, drone.Status.ToString(),
                p.MissionId, mission?.Title,
                p.Timestamp,
                (int)(DateTime.UtcNow - p.Timestamp).TotalSeconds,
                p.Latitude, p.Longitude, p.AltitudeMeters,
                p.GroundSpeedMs, p.HeadingDegrees,
                p.BatteryPercentage, p.SatelliteCount,
                p.FlightMode, p.IsArmed,
                BuildWarnings(p)));
        }

        return result;
    }

    public async Task<LiveDroneResponse?> GetLiveDroneAsync(Guid droneId)
    {
        var p = await _live.GetLastPositionAsync(droneId);
        if (p == null) return null;

        var drone = await _db.Drones
            .Where(d => d.Id == droneId)
            .Select(d => new { d.SerialNumber, d.Nickname, d.Status })
            .FirstOrDefaultAsync();

        if (drone == null) return null;

        string? missionTitle = null;
        if (p.MissionId.HasValue)
            missionTitle = await _db.Missions
                .Where(m => m.Id == p.MissionId.Value)
                .Select(m => m.Title)
                .FirstOrDefaultAsync();

        return new LiveDroneResponse(
            droneId, drone.SerialNumber, drone.Nickname, drone.Status.ToString(),
            p.MissionId, missionTitle,
            p.Timestamp,
            (int)(DateTime.UtcNow - p.Timestamp).TotalSeconds,
            p.Latitude, p.Longitude, p.AltitudeMeters,
            p.GroundSpeedMs, p.HeadingDegrees,
            p.BatteryPercentage, p.SatelliteCount,
            p.FlightMode, p.IsArmed,
            BuildWarnings(p));
    }

    // Rruga e fluturuar realisht — e holluar per te mos ngarkuar harten
    public async Task<List<TelemetryPointResponse>> GetMissionTrackAsync(
        Guid missionId, int maxPoints = 500)
    {
        var filter = Builders<TelemetryPoint>.Filter.Eq(t => t.MissionId, missionId);

        var total = await _mongo.TelemetryPoints.CountDocumentsAsync(filter);
        var step = total > maxPoints ? (int)(total / maxPoints) : 1;

        var points = await _mongo.TelemetryPoints
            .Find(filter)
            .SortBy(t => t.Timestamp)
            .ToListAsync();

        return points
            .Where((_, index) => index % step == 0)
            .Select(Map)
            .ToList();
    }

    public async Task<List<TelemetryPointResponse>> GetDroneHistoryAsync(
        Guid droneId, DateTime from, DateTime to)
    {
        var builder = Builders<TelemetryPoint>.Filter;
        var filter = builder.Eq(t => t.DroneId, droneId)
                   & builder.Gte(t => t.Timestamp, from.ToUniversalTime())
                   & builder.Lte(t => t.Timestamp, to.ToUniversalTime());

        var points = await _mongo.TelemetryPoints
            .Find(filter)
            .SortBy(t => t.Timestamp)
            .Limit(5000)
            .ToListAsync();

        return points.Select(Map).ToList();
    }

    // Alarmet llogariten ne çast, jo ruhen
    private static List<string> BuildWarnings(TelemetryPoint p)
    {
        var warnings = new List<string>();

        if (p.BatteryPercentage <= CriticalBattery)
            warnings.Add($"Bateri kritike: {p.BatteryPercentage:F0}%");
        else if (p.BatteryPercentage <= LowBattery)
            warnings.Add($"Bateri e ulët: {p.BatteryPercentage:F0}%");

        if (p.SatelliteCount < MinSatellites && p.IsArmed)
            warnings.Add($"Sinjal GPS i dobët: {p.SatelliteCount} satelitë");

        if (p.AltitudeMeters > MaxAltitude)
            warnings.Add($"Lartësi mbi kufi: {p.AltitudeMeters:F0} m");

        if (p.VibrationLevel is > HighVibration)
            warnings.Add("Dridhje të larta");

        if ((DateTime.UtcNow - p.Timestamp).TotalSeconds > 30)
            warnings.Add("Sinjali i humbur");

        return warnings;
    }

    private static TelemetryPointResponse Map(TelemetryPoint p) => new(
        p.DroneId, p.MissionId, p.Timestamp,
        p.Latitude, p.Longitude, p.AltitudeMeters,
        p.GroundSpeedMs, p.VerticalSpeedMs, p.HeadingDegrees,
        p.BatteryPercentage, p.BatteryVoltage,
        p.SatelliteCount, p.SignalStrength,
        p.TemperatureCelsius, p.VibrationLevel,
        p.FlightMode, p.IsArmed);
}