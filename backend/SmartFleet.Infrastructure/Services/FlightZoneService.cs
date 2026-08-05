using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Domain.Entities;
using SmartFleet.Infrastructure.Persistence;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace SmartFleet.Infrastructure.Services
{

    public class FlightZoneService : IFlightZoneService
    {
        private readonly ApplicationDbContext _dbContext;

        // Tipet e lejuara — te njejtat si te MissionType
        private static readonly string[] ValidZoneTypes =
        {
        "Agriculture", "Infrastructure", "Energy", "Environmental", "Mapping"
    };

        public FlightZoneService(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<FlightZoneResponse>> GetAllAsync(string? zoneType = null)
        {
            var query = _dbContext.FlightZones.AsQueryable();

            if (!string.IsNullOrWhiteSpace(zoneType))
                query = query.Where(z => z.ZoneType == zoneType);

            return await query
                .OrderBy(z => z.Name)
                .Select(z => new FlightZoneResponse(
                    z.Id, z.Name, z.ZoneType, z.PolygonGeoJson,
                    z.IsRestricted, z.MaxAltitudeMeters,
                    z.Missions.Count))
                .ToListAsync();
        }

        public async Task<FlightZoneResponse?> GetByIdAsync(Guid id)
        {
            return await _dbContext.FlightZones
                .Where(z => z.Id == id)
                .Select(z => new FlightZoneResponse(
                    z.Id, z.Name, z.ZoneType, z.PolygonGeoJson,
                    z.IsRestricted, z.MaxAltitudeMeters,
                    z.Missions.Count))
                .FirstOrDefaultAsync();
        }

        public async Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreateFlightZoneRequest request)
        {
            var validation = Validate(request.Name, request.ZoneType, request.PolygonGeoJson, request.MaxAltitudeMeters);
            if (validation != null) return (false, validation, null);

            if (await _dbContext.FlightZones.AnyAsync(z => z.Name == request.Name))
                return (false, "A flight zone with this name already exists.", null);

            var zone = new FlightZone
            {
                Name = request.Name,
                ZoneType = request.ZoneType,
                PolygonGeoJson = request.PolygonGeoJson,
                IsRestricted = request.IsRestricted,
                MaxAltitudeMeters = request.MaxAltitudeMeters
            };

            _dbContext.FlightZones.Add(zone);
            await _dbContext.SaveChangesAsync();

            return (true, null, zone.Id);
        }

        public async Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateFlightZoneRequest request)
        {
            var zone = await _dbContext.FlightZones.FindAsync(id);
            if (zone == null) return (false, "Flight zone not found.");

            var validation = Validate(request.Name, request.ZoneType, request.PolygonGeoJson, request.MaxAltitudeMeters);
            if (validation != null) return (false, validation);

            if (await _dbContext.FlightZones.AnyAsync(z => z.Name == request.Name && z.Id != id))
                return (false, "Another flight zone already uses this name.");

            zone.Name = request.Name;
            zone.ZoneType = request.ZoneType;
            zone.PolygonGeoJson = request.PolygonGeoJson;
            zone.IsRestricted = request.IsRestricted;
            zone.MaxAltitudeMeters = request.MaxAltitudeMeters;
            zone.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return (true, null);
        }

        public async Task<(bool Success, string? Error)> DeleteAsync(Guid id)
        {
            var zone = await _dbContext.FlightZones.FindAsync(id);
            if (zone == null) return (false, "Flight zone not found.");

            if (await _dbContext.Missions.AnyAsync(m => m.FlightZoneId == id))
                return (false, "Cannot delete a zone that has missions.");

            _dbContext.FlightZones.Remove(zone);
            await _dbContext.SaveChangesAsync();
            return (true, null);
        }

        // Validime te perbashketa per Create dhe Update
        private static string? Validate(string name, string zoneType, string geoJson, int? maxAltitude)
        {
            if (string.IsNullOrWhiteSpace(name))
                return "Name is required.";

            if (!ValidZoneTypes.Contains(zoneType))
                return $"Zone type must be one of: {string.Join(", ", ValidZoneTypes)}.";

            if (string.IsNullOrWhiteSpace(geoJson))
                return "Polygon GeoJSON is required.";

            // Kontroll baze: a eshte JSON i vlefshem?
            try { JsonDocument.Parse(geoJson); }
            catch (JsonException) { return "Polygon must be valid JSON."; }

            if (maxAltitude is < 0 or > 500)
                return "Max altitude must be between 0 and 500 meters.";

            return null;
        }
    }
}
