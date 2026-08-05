using Microsoft.EntityFrameworkCore;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Domain.Entites;
using SmartFleet.Domain.Entities;
using SmartFleet.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SmartFleet.Infrastructure.Services
{
    public class MissionService : IMissionService
    {
        private readonly ApplicationDbContext _dbContext;

        private static readonly string[] ValidTypes =
        {
            "Agriculture", "Infrastructure", "Energy", "Environmental", "Mapping"
        };

        public MissionService(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        // PostgreSQL timestamptz pranon vetem UTC — normalizojme cdo date qe vjen nga jashte
        private static DateTime ToUtc(DateTime dt) => dt.Kind switch
        {
            DateTimeKind.Utc => dt,
            DateTimeKind.Local => dt.ToUniversalTime(),
            _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
        };

        // Nese s'ka fund te planifikuar, supozojme 1 ore
        private static DateTime EffectiveEnd(DateTime start, DateTime? end) => end ?? start.AddHours(1);

        public async Task<List<MissionResponse>> GetAllAsync(
            string? status = null, Guid? droneId = null, Guid? pilotId = null)
        {
            var query = _dbContext.Missions.AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) &&
                Enum.TryParse<MissionStatus>(status, true, out var parsed))
                query = query.Where(m => m.Status == parsed);

            if (droneId.HasValue) query = query.Where(m => m.DroneId == droneId.Value);
            if (pilotId.HasValue) query = query.Where(m => m.PilotId == pilotId.Value);

            return await query
                .OrderByDescending(m => m.ScheduledStart)
                .Select(m => new MissionResponse(
                    m.Id,
                    m.Title,
                    m.MissionType,
                    m.Status.ToString(),
                    m.IsAutonomous,
                    m.FlightZoneId,
                    m.FlightZone.Name,
                    m.DroneId,
                    m.Drone != null ? m.Drone.SerialNumber : null,
                    m.PilotId,
                    m.Pilot != null ? m.Pilot.LicenseNumber : null,
                    m.BatteryId,
                    m.Battery != null ? m.Battery.SerialNumber : null,
                    m.ScheduledStart,
                    m.ScheduledEnd,
                    m.ActualStart,
                    m.ActualEnd,
                    m.Waypoints.Count))
                .ToListAsync();
        }

        public async Task<MissionResponse?> GetByIdAsync(Guid id)
        {
            return await _dbContext.Missions
                .Where(m => m.Id == id)
                .Select(m => new MissionResponse(
                    m.Id,
                    m.Title,
                    m.MissionType,
                    m.Status.ToString(),
                    m.IsAutonomous,
                    m.FlightZoneId,
                    m.FlightZone.Name,
                    m.DroneId,
                    m.Drone != null ? m.Drone.SerialNumber : null,
                    m.PilotId,
                    m.Pilot != null ? m.Pilot.LicenseNumber : null,
                    m.BatteryId,
                    m.Battery != null ? m.Battery.SerialNumber : null,
                    m.ScheduledStart,
                    m.ScheduledEnd,
                    m.ActualStart,
                    m.ActualEnd,
                    m.Waypoints.Count))
                .FirstOrDefaultAsync();
        }

        public async Task<(bool Success, string? Error, Guid? Id)> CreateAsync(
            CreateMissionRequest request, Guid createdByUserId)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return (false, "Title is required.", null);

            if (!ValidTypes.Contains(request.MissionType))
                return (false, $"Mission type must be one of: {string.Join(", ", ValidTypes)}.", null);

            if (!await _dbContext.FlightZones.AnyAsync(z => z.Id == request.FlightZoneId))
                return (false, "Flight zone does not exist.", null);

            var start = ToUtc(request.ScheduledStart);
            var end = request.ScheduledEnd.HasValue ? ToUtc(request.ScheduledEnd.Value) : (DateTime?)null;

            if (end.HasValue && end <= start)
                return (false, "Scheduled end must be after scheduled start.", null);

            var mission = new Mission
            {
                Title = request.Title,
                MissionType = request.MissionType,
                FlightZoneId = request.FlightZoneId,
                ScheduledStart = start,
                ScheduledEnd = end,
                IsAutonomous = request.IsAutonomous,
                CreatedByUserId = createdByUserId
            };

            _dbContext.Missions.Add(mission);
            await _dbContext.SaveChangesAsync();

            return (true, null, mission.Id);
        }

        public async Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateMissionRequest request)
        {
            var mission = await _dbContext.Missions.FindAsync(id);
            if (mission == null) return (false, "Mission not found.");

            if (mission.Status != MissionStatus.Planned)
                return (false, "Only missions in 'Planned' status can be edited.");

            if (!ValidTypes.Contains(request.MissionType))
                return (false, $"Mission type must be one of: {string.Join(", ", ValidTypes)}.");

            if (!await _dbContext.FlightZones.AnyAsync(z => z.Id == request.FlightZoneId))
                return (false, "Flight zone does not exist.");

            var start = ToUtc(request.ScheduledStart);
            var end = request.ScheduledEnd.HasValue ? ToUtc(request.ScheduledEnd.Value) : (DateTime?)null;

            if (end.HasValue && end <= start)
                return (false, "Scheduled end must be after scheduled start.");

            mission.Title = request.Title;
            mission.MissionType = request.MissionType;
            mission.FlightZoneId = request.FlightZoneId;
            mission.ScheduledStart = start;
            mission.ScheduledEnd = end;
            mission.IsAutonomous = request.IsAutonomous;
            mission.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return (true, null);
        }

        public async Task<(bool Success, string? Error)> AssignResourcesAsync(Guid id, AssignResourcesRequest request)
        {
            var mission = await _dbContext.Missions.FindAsync(id);
            if (mission == null) return (false, "Mission not found.");

            if (mission.Status != MissionStatus.Planned)
                return (false, "Resources can only be assigned to missions in 'Planned' status.");

            var drone = await _dbContext.Drones.FindAsync(request.DroneId);
            if (drone == null) return (false, "Drone does not exist.");
            if (drone.Status == DroneStatus.Grounded || drone.Status == DroneStatus.Maintenance)
                return (false, $"Drone is currently {drone.Status} and cannot be assigned.");

            var battery = await _dbContext.Batteries.FindAsync(request.BatteryId);
            if (battery == null) return (false, "Battery does not exist.");
            if (battery.Status == BatteryStatus.NeedsReplacement)
                return (false, "Battery needs replacement and cannot be assigned.");

            // Zonat e kufizuara kerkojne gjithmone pilot mbikeqyres
            var zone = await _dbContext.FlightZones.FindAsync(mission.FlightZoneId);
            var pilotRequired = !mission.IsAutonomous || (zone?.IsRestricted ?? false);

            if (pilotRequired && request.PilotId == null)
                return (false, zone?.IsRestricted == true
                    ? "This flight zone is restricted — a supervising pilot is required."
                    : "A pilot is required for non-autonomous missions.");

            if (request.PilotId.HasValue)
            {
                var pilot = await _dbContext.Pilots.FindAsync(request.PilotId.Value);
                if (pilot == null) return (false, "Pilot does not exist.");
                if (pilot.Status != PilotStatus.Active)
                    return (false, $"Pilot is {pilot.Status} and cannot be assigned.");
            }

            mission.DroneId = request.DroneId;
            mission.PilotId = request.PilotId;
            mission.BatteryId = request.BatteryId;
            mission.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return (true, null);
        }

        // Kontrollon nese droni/piloti/bateria jane te zene ne nje mision tjeter qe mbivendoset kohorisht
        public async Task<ConflictResponse> CheckConflictsAsync(Guid id)
        {
            var conflicts = new List<string>();

            var mission = await _dbContext.Missions.FindAsync(id);
            if (mission == null)
                return new ConflictResponse(true, new List<string> { "Mission not found." });

            if (mission.DroneId == null || mission.BatteryId == null)
            {
                conflicts.Add("Drone and battery must be assigned before approval.");
                return new ConflictResponse(true, conflicts);
            }

            var zone = await _dbContext.FlightZones.FindAsync(mission.FlightZoneId);
            var pilotRequired = !mission.IsAutonomous || (zone?.IsRestricted ?? false);

            if (pilotRequired && mission.PilotId == null)
            {
                conflicts.Add("A pilot is required for this mission.");
                return new ConflictResponse(true, conflicts);
            }

            var start = mission.ScheduledStart;
            var end = EffectiveEnd(start, mission.ScheduledEnd);

            // Marrim misionet aktive qe mund te perplasen, pastaj krahasojme ne memorje
            var others = await _dbContext.Missions
                .Where(m => m.Id != id
                            && (m.Status == MissionStatus.Planned
                                || m.Status == MissionStatus.Approved
                                || m.Status == MissionStatus.InProgress)
                            && (m.DroneId == mission.DroneId
                                || (mission.PilotId != null && m.PilotId == mission.PilotId)
                                || m.BatteryId == mission.BatteryId))
                .Select(m => new { m.Title, m.DroneId, m.PilotId, m.BatteryId, m.ScheduledStart, m.ScheduledEnd })
                .ToListAsync();

            foreach (var o in others)
            {
                var oEnd = EffectiveEnd(o.ScheduledStart, o.ScheduledEnd);
                var overlaps = start < oEnd && o.ScheduledStart < end;
                if (!overlaps) continue;

                if (o.DroneId == mission.DroneId)
                    conflicts.Add($"Drone is already booked for mission '{o.Title}'.");
                if (mission.PilotId != null && o.PilotId == mission.PilotId)
                    conflicts.Add($"Pilot is already booked for mission '{o.Title}'.");
                if (o.BatteryId == mission.BatteryId)
                    conflicts.Add($"Battery is already booked for mission '{o.Title}'.");
            }

            // Certifikata kontrollohet vetem nese ka pilot te caktuar
            if (mission.PilotId != null)
            {
                var missionDate = DateOnly.FromDateTime(start);
                var hasValidCert = await _dbContext.Certifications
                    .AnyAsync(c => c.PilotId == mission.PilotId && c.ExpiryDate >= missionDate);

                if (!hasValidCert)
                    conflicts.Add("Pilot has no valid certification for the mission date.");
            }

            return new ConflictResponse(conflicts.Count > 0, conflicts);
        }

        public async Task<(bool Success, string? Error)> ApproveAsync(Guid id, Guid approvedByUserId)
        {
            var mission = await _dbContext.Missions.FindAsync(id);
            if (mission == null) return (false, "Mission not found.");

            if (mission.Status != MissionStatus.Planned)
                return (false, "Only missions in 'Planned' status can be approved.");

            var check = await CheckConflictsAsync(id);
            if (check.HasConflicts)
                return (false, string.Join(" ", check.Conflicts));

            mission.Status = MissionStatus.Approved;
            mission.ApprovedByUserId = approvedByUserId;
            mission.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return (true, null);
        }

        public async Task<(bool Success, string? Error)> CancelAsync(Guid id)
        {
            var mission = await _dbContext.Missions.FindAsync(id);
            if (mission == null) return (false, "Mission not found.");

            if (mission.Status != MissionStatus.Planned && mission.Status != MissionStatus.Approved)
                return (false, "Only planned or approved missions can be cancelled.");

            mission.Status = MissionStatus.Cancelled;
            mission.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return (true, null);
        }

        public async Task<(bool Success, string? Error)> StartAsync(Guid id)
        {
            var mission = await _dbContext.Missions.FindAsync(id);
            if (mission == null) return (false, "Mission not found.");

            if (mission.Status != MissionStatus.Approved)
                return (false, "Only approved missions can be started.");

            if (!await _dbContext.MissionWaypoints.AnyAsync(w => w.MissionId == id))
                return (false, "Mission has no waypoints defined.");

            mission.Status = MissionStatus.InProgress;
            mission.ActualStart = DateTime.UtcNow;
            mission.UpdatedAt = DateTime.UtcNow;

            // Burimet kalojne ne perdorim
            var drone = await _dbContext.Drones.FindAsync(mission.DroneId);
            if (drone != null) drone.Status = DroneStatus.InMission;

            var battery = await _dbContext.Batteries.FindAsync(mission.BatteryId);
            if (battery != null) battery.Status = BatteryStatus.InUse;

            await _dbContext.SaveChangesAsync();
            return (true, null);
        }

        public async Task<(bool Success, string? Error)> CompleteAsync(Guid id)
            => await FinishAsync(id, MissionStatus.Completed);

        public async Task<(bool Success, string? Error)> AbortAsync(Guid id)
            => await FinishAsync(id, MissionStatus.Aborted);

        // Logjika e perbashket per Complete dhe Abort
        private async Task<(bool Success, string? Error)> FinishAsync(Guid id, MissionStatus finalStatus)
        {
            var mission = await _dbContext.Missions.FindAsync(id);
            if (mission == null) return (false, "Mission not found.");

            if (mission.Status != MissionStatus.InProgress)
                return (false, "Only missions in progress can be completed or aborted.");

            var now = DateTime.UtcNow;
            mission.Status = finalStatus;
            mission.ActualEnd = now;
            mission.UpdatedAt = now;

            var flightHours = mission.ActualStart.HasValue
                ? (decimal)(now - mission.ActualStart.Value).TotalHours
                : 0m;

            var drone = await _dbContext.Drones.FindAsync(mission.DroneId);
            if (drone != null)
            {
                drone.Status = DroneStatus.Available;
                drone.TotalFlightHours += Math.Round(flightHours, 2);
            }

            // Orët e pilotit rriten vetem nese misioni kishte pilot
            if (mission.PilotId.HasValue)
            {
                var pilot = await _dbContext.Pilots.FindAsync(mission.PilotId.Value);
                if (pilot != null)
                    pilot.TotalFlightHours += Math.Round(flightHours, 2);
            }

            var battery = await _dbContext.Batteries.FindAsync(mission.BatteryId);
            if (battery != null)
            {
                battery.Status = BatteryStatus.Charging;
                battery.CycleCount += 1;
            }

            await _dbContext.SaveChangesAsync();
            return (true, null);
        }

        public async Task<List<WaypointResponse>> GetWaypointsAsync(Guid id)
            => await _dbContext.MissionWaypoints
                .Where(w => w.MissionId == id)
                .OrderBy(w => w.SequenceNumber)
                .Select(w => new WaypointResponse(
                    w.Id, w.SequenceNumber, w.Latitude, w.Longitude, w.AltitudeMeters, w.ActionType))
                .ToListAsync();

        // Zevendeson tere listen — me e thjeshte se menaxhimi individual i pikave
        public async Task<(bool Success, string? Error)> ReplaceWaypointsAsync(Guid id, List<WaypointRequest> waypoints)
        {
            var mission = await _dbContext.Missions.FindAsync(id);
            if (mission == null) return (false, "Mission not found.");

            if (mission.Status != MissionStatus.Planned && mission.Status != MissionStatus.Approved)
                return (false, "Waypoints can only be modified before the mission starts.");

            if (waypoints.Count < 2)
                return (false, "A mission needs at least two waypoints.");

            foreach (var w in waypoints)
            {
                if (w.Latitude < -90 || w.Latitude > 90)
                    return (false, "Latitude must be between -90 and 90.");
                if (w.Longitude < -180 || w.Longitude > 180)
                    return (false, "Longitude must be between -180 and 180.");
                if (w.AltitudeMeters is < 0 or > 500)
                    return (false, "Altitude must be between 0 and 500 meters.");
            }

            var existing = await _dbContext.MissionWaypoints.Where(w => w.MissionId == id).ToListAsync();
            _dbContext.MissionWaypoints.RemoveRange(existing);

            var index = 1;
            foreach (var w in waypoints.OrderBy(w => w.SequenceNumber))
            {
                _dbContext.MissionWaypoints.Add(new MissionWaypoint
                {
                    MissionId = id,
                    SequenceNumber = index++,
                    Latitude = w.Latitude,
                    Longitude = w.Longitude,
                    AltitudeMeters = w.AltitudeMeters,
                    ActionType = w.ActionType
                });
            }

            await _dbContext.SaveChangesAsync();
            return (true, null);
        }
    }
}