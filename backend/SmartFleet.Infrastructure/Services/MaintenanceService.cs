using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Domain.Entites;
using SmartFleet.Domain.Entities;
using SmartFleet.Infrastructure.Identity;
using SmartFleet.Infrastructure.Persistence;

namespace SmartFleet.Infrastructure.Services;

public class MaintenanceService : IMaintenanceService
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    private static readonly string[] ValidComponentTypes =
    {
        "Motor", "Propeller", "Camera", "GPS", "FlightController",
        "Gimbal", "Landing gear", "Antenna", "Sensor"
    };

    public MaintenanceService(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    private static DateTime ToUtc(DateTime dt) => dt.Kind switch
    {
        DateTimeKind.Utc => dt,
        DateTimeKind.Local => dt.ToUniversalTime(),
        _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
    };

    public async Task<List<MaintenanceResponse>> GetAllAsync(Guid? droneId = null, string? status = null)
    {
        var query = _db.MaintenanceRecords.AsQueryable();

        if (droneId.HasValue)
            query = query.Where(r => r.DroneId == droneId.Value);

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<MaintenanceStatus>(status, true, out var parsed))
            query = query.Where(r => r.Status == parsed);

        var records = await query
            .OrderByDescending(r => r.PerformedAt)
            .Select(r => new
            {
                r.Id,
                r.DroneId,
                r.TechnicianId,
                r.MaintenanceType,
                r.Description,
                r.ComponentId,
                r.PerformedAt,
                r.NextRecommendedDate,
                r.Cost,
                r.Status,
                DroneSerial = r.Drone.SerialNumber,
                DroneNickname = r.Drone.Nickname,
                ComponentType = r.Component != null ? r.Component.ComponentType : null
            })
            .ToListAsync();

        return await MapAsync(records);
    }

    public async Task<MaintenanceResponse?> GetByIdAsync(Guid id)
    {
        var r = await _db.MaintenanceRecords
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.DroneId,
                x.TechnicianId,
                x.MaintenanceType,
                x.Description,
                x.ComponentId,
                x.PerformedAt,
                x.NextRecommendedDate,
                x.Cost,
                x.Status,
                DroneSerial = x.Drone.SerialNumber,
                DroneNickname = x.Drone.Nickname,
                ComponentType = x.Component != null ? x.Component.ComponentType : null
            })
            .FirstOrDefaultAsync();

        if (r == null) return null;
        return (await MapAsync(new[] { r })).First();
    }

    // Mirembajtjet e rekomanduara qe po afrohen
    public async Task<List<MaintenanceResponse>> GetUpcomingAsync(int days = 30)
    {
        var limit = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(days);

        var records = await _db.MaintenanceRecords
            .Where(r => r.Status == MaintenanceStatus.Scheduled
                        || (r.NextRecommendedDate != null && r.NextRecommendedDate <= limit))
            .OrderBy(r => r.NextRecommendedDate)
            .Select(r => new
            {
                r.Id,
                r.DroneId,
                r.TechnicianId,
                r.MaintenanceType,
                r.Description,
                r.ComponentId,
                r.PerformedAt,
                r.NextRecommendedDate,
                r.Cost,
                r.Status,
                DroneSerial = r.Drone.SerialNumber,
                DroneNickname = r.Drone.Nickname,
                ComponentType = r.Component != null ? r.Component.ComponentType : null
            })
            .ToListAsync();

        return await MapAsync(records);
    }

    public async Task<(bool Success, string? Error, Guid? Id)> CreateAsync(
        CreateMaintenanceRequest request, Guid technicianId)
    {
        var drone = await _db.Drones.FindAsync(request.DroneId);
        if (drone == null) return (false, "Drone does not exist.", null);

        if (string.IsNullOrWhiteSpace(request.Description))
            return (false, "Description is required.", null);

        if (request.ComponentId.HasValue &&
            !await _db.DroneComponents.AnyAsync(c =>
                c.Id == request.ComponentId.Value && c.DroneId == request.DroneId))
            return (false, "Component does not belong to this drone.", null);

        if (request.Cost is < 0)
            return (false, "Cost cannot be negative.", null);

        // Nje dron ne fluturim nuk mund te futet ne servis
        if (drone.Status == DroneStatus.InMission)
            return (false, "Drone is currently in a mission.", null);

        var record = new MaintenanceRecord
        {
            DroneId = request.DroneId,
            TechnicianId = technicianId,
            MaintenanceType = request.MaintenanceType,
            Description = request.Description,
            ComponentId = request.ComponentId,
            PerformedAt = request.PerformedAt.HasValue
                ? ToUtc(request.PerformedAt.Value)
                : DateTime.UtcNow,
            Cost = request.Cost,
            Status = MaintenanceStatus.Scheduled
        };

        _db.MaintenanceRecords.Add(record);
        await _db.SaveChangesAsync();

        return (true, null, record.Id);
    }

    public async Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateMaintenanceRequest request)
    {
        var record = await _db.MaintenanceRecords.FindAsync(id);
        if (record == null) return (false, "Maintenance record not found.");

        if (record.Status == MaintenanceStatus.Completed)
            return (false, "Completed records cannot be edited.");

        if (string.IsNullOrWhiteSpace(request.Description))
            return (false, "Description is required.");

        if (request.Cost is < 0)
            return (false, "Cost cannot be negative.");

        record.Description = request.Description;
        record.Cost = request.Cost;
        record.NextRecommendedDate = request.NextRecommendedDate;
        record.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return (true, null);
    }

    // Fillimi i punes — droni kalon ne Maintenance
    public async Task<(bool Success, string? Error)> StartAsync(Guid id)
    {
        var record = await _db.MaintenanceRecords.FindAsync(id);
        if (record == null) return (false, "Maintenance record not found.");

        if (record.Status != MaintenanceStatus.Scheduled)
            return (false, "Only scheduled maintenance can be started.");

        var drone = await _db.Drones.FindAsync(record.DroneId);
        if (drone == null) return (false, "Drone does not exist.");

        if (drone.Status == DroneStatus.InMission)
            return (false, "Drone is currently in a mission.");

        record.Status = MaintenanceStatus.InProgress;
        record.PerformedAt = DateTime.UtcNow;
        record.UpdatedAt = DateTime.UtcNow;

        drone.Status = DroneStatus.Maintenance;
        drone.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return (true, null);
    }

    // Mbyllja — droni kthehet ne sherbim nese kerkohet
    public async Task<(bool Success, string? Error)> CompleteAsync(
        Guid id, CompleteMaintenanceRequest request)
    {
        var record = await _db.MaintenanceRecords.FindAsync(id);
        if (record == null) return (false, "Maintenance record not found.");

        if (record.Status != MaintenanceStatus.InProgress)
            return (false, "Only maintenance in progress can be completed.");

        if (request.Cost is < 0)
            return (false, "Cost cannot be negative.");

        record.Status = MaintenanceStatus.Completed;
        record.Cost = request.Cost ?? record.Cost;
        record.NextRecommendedDate = request.NextRecommendedDate;
        record.UpdatedAt = DateTime.UtcNow;

        var drone = await _db.Drones.FindAsync(record.DroneId);
        if (drone != null)
        {
            drone.Status = request.ReturnDroneToService
                ? DroneStatus.Available
                : DroneStatus.Grounded;
            drone.UpdatedAt = DateTime.UtcNow;
        }

        // Nese pjesa u nderrua, shenoje si te zevendesuar
        if (record.ComponentId.HasValue)
        {
            var component = await _db.DroneComponents.FindAsync(record.ComponentId.Value);
            if (component != null && record.MaintenanceType == MaintenanceType.Corrective)
            {
                component.Status = "Replaced";
                component.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> CancelAsync(Guid id)
    {
        var record = await _db.MaintenanceRecords.FindAsync(id);
        if (record == null) return (false, "Maintenance record not found.");

        if (record.Status == MaintenanceStatus.Completed)
            return (false, "Completed maintenance cannot be cancelled.");

        // Nese droni ishte ne servis per shkak te kesaj pune, liroje
        if (record.Status == MaintenanceStatus.InProgress)
        {
            var drone = await _db.Drones.FindAsync(record.DroneId);
            if (drone != null && drone.Status == DroneStatus.Maintenance)
            {
                drone.Status = DroneStatus.Available;
                drone.UpdatedAt = DateTime.UtcNow;
            }
        }

        _db.MaintenanceRecords.Remove(record);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    // ===== Komponentët =====

    public async Task<List<ComponentResponse>> GetComponentsAsync(Guid droneId)
        => await _db.DroneComponents
            .Where(c => c.DroneId == droneId)
            .OrderBy(c => c.ComponentType)
            .Select(c => new ComponentResponse(
                c.Id, c.DroneId, c.ComponentType, c.SerialNumber,
                c.InstalledAt, c.ExpectedLifespanHours, c.Status))
            .ToListAsync();

    public async Task<(bool Success, string? Error, Guid? Id)> AddComponentAsync(
        Guid droneId, CreateComponentRequest request)
    {
        if (!await _db.Drones.AnyAsync(d => d.Id == droneId))
            return (false, "Drone does not exist.", null);

        if (!ValidComponentTypes.Contains(request.ComponentType))
            return (false, $"Component type must be one of: {string.Join(", ", ValidComponentTypes)}.", null);

        if (request.ExpectedLifespanHours is < 0)
            return (false, "Expected lifespan cannot be negative.", null);

        var component = new DroneComponent
        {
            DroneId = droneId,
            ComponentType = request.ComponentType,
            SerialNumber = request.SerialNumber,
            InstalledAt = request.InstalledAt,
            ExpectedLifespanHours = request.ExpectedLifespanHours,
            Status = "OK"
        };

        _db.DroneComponents.Add(component);
        await _db.SaveChangesAsync();

        return (true, null, component.Id);
    }

    public async Task<(bool Success, string? Error)> UpdateComponentAsync(
        Guid droneId, Guid componentId, UpdateComponentRequest request)
    {
        var component = await _db.DroneComponents
            .FirstOrDefaultAsync(c => c.Id == componentId && c.DroneId == droneId);

        if (component == null) return (false, "Component not found for this drone.");

        if (!ValidComponentTypes.Contains(request.ComponentType))
            return (false, $"Component type must be one of: {string.Join(", ", ValidComponentTypes)}.");

        component.ComponentType = request.ComponentType;
        component.SerialNumber = request.SerialNumber;
        component.ExpectedLifespanHours = request.ExpectedLifespanHours;
        component.Status = request.Status;
        component.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return (true, null);
    }

    // Emrat e teknikeve vijne nga Identity, jo nga domain
    private async Task<List<MaintenanceResponse>> MapAsync<T>(IEnumerable<T> records)
    {
        var result = new List<MaintenanceResponse>();
        var nameCache = new Dictionary<Guid, string?>();

        foreach (dynamic r in records)
        {
            Guid techId = r.TechnicianId;

            if (!nameCache.TryGetValue(techId, out var techName))
            {
                var user = await _userManager.FindByIdAsync(techId.ToString());
                techName = user?.FullName;
                nameCache[techId] = techName;
            }

            result.Add(new MaintenanceResponse(
                r.Id, r.DroneId, r.DroneSerial, r.DroneNickname,
                techId, techName,
                r.MaintenanceType.ToString(), r.Description,
                r.ComponentId, r.ComponentType,
                r.PerformedAt, r.NextRecommendedDate, r.Cost,
                r.Status.ToString()));
        }

        return result;
    }
}