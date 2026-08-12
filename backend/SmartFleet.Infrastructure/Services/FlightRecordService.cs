using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Domain.Entities;
using SmartFleet.Infrastructure.Identity;
using SmartFleet.Infrastructure.Persistence;

namespace SmartFleet.Infrastructure.Services;

public class FlightRecordService : IFlightRecordService
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public FlightRecordService(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    // Kthen profilin e pilotit per userin e loguar (nese ka)
    private async Task<Pilot?> GetPilotForUserAsync(Guid userId)
        => await _db.Pilots.FirstOrDefaultAsync(p => p.UserId == userId);

    private async Task<string?> GetPilotNameAsync(Guid pilotId)
    {
        var pilot = await _db.Pilots.FindAsync(pilotId);
        if (pilot == null) return null;
        var user = await _userManager.FindByIdAsync(pilot.UserId.ToString());
        return user?.FullName;
    }

    // ===== Checklist =====

    public async Task<ChecklistResponse?> GetChecklistAsync(Guid missionId)
    {
        var c = await _db.PreFlightChecklists
            .FirstOrDefaultAsync(x => x.MissionId == missionId);

        if (c == null) return null;

        return new ChecklistResponse(
            c.Id, c.MissionId, c.CompletedByPilotId,
            await GetPilotNameAsync(c.CompletedByPilotId),
            c.BatteryChecked, c.PropellersChecked, c.GpsSignalOk,
            c.WeatherConditionsOk, c.FirmwareUpToDate, c.Notes, c.CompletedAt,
            c.BatteryChecked && c.PropellersChecked && c.GpsSignalOk
                && c.WeatherConditionsOk && c.FirmwareUpToDate);
    }

    public async Task<(bool Success, string? Error, Guid? Id)> SubmitChecklistAsync(
        Guid missionId, SubmitChecklistRequest request, Guid userId)
    {
        var mission = await _db.Missions.FindAsync(missionId);
        if (mission == null) return (false, "Mission not found.", null);

        if (mission.Status != MissionStatus.Planned && mission.Status != MissionStatus.Approved)
            return (false, "Checklist can only be submitted before the mission starts.", null);

        if (await _db.PreFlightChecklists.AnyAsync(c => c.MissionId == missionId))
            return (false, "A checklist has already been submitted for this mission.", null);

        // Kush e plotëson: piloti i caktuar, ose useri aktual nëse ka profil piloti
        var pilotId = mission.PilotId;
        if (pilotId == null)
        {
            var pilot = await GetPilotForUserAsync(userId);
            pilotId = pilot?.Id;
        }

        if (pilotId == null)
            return (false, "No pilot is assigned and the current user has no pilot profile.", null);

        var checklist = new PreFlightChecklist
        {
            MissionId = missionId,
            CompletedByPilotId = pilotId.Value,
            BatteryChecked = request.BatteryChecked,
            PropellersChecked = request.PropellersChecked,
            GpsSignalOk = request.GpsSignalOk,
            WeatherConditionsOk = request.WeatherConditionsOk,
            FirmwareUpToDate = request.FirmwareUpToDate,
            Notes = request.Notes,
            CompletedAt = DateTime.UtcNow
        };

        _db.PreFlightChecklists.Add(checklist);
        await _db.SaveChangesAsync();

        return (true, null, checklist.Id);
    }

    // ===== Raporti =====

    public async Task<FlightReportResponse?> GetReportAsync(Guid missionId)
    {
        var r = await _db.PostFlightReports
            .Where(x => x.MissionId == missionId)
            .Select(x => new
            {
                x.Id,
                x.MissionId,
                x.SubmittedByPilotId,
                x.FlightDurationMinutes,
                x.BatteryUsedPercentage,
                x.IssuesReported,
                x.WeatherConditions,
                x.Summary,
                x.AiAnalysisStatus,
                x.SubmittedAt,
                MissionTitle = x.Mission.Title
            })
            .FirstOrDefaultAsync();

        if (r == null) return null;

        return new FlightReportResponse(
            r.Id, r.MissionId, r.MissionTitle, r.SubmittedByPilotId,
            await GetPilotNameAsync(r.SubmittedByPilotId),
            r.FlightDurationMinutes, r.BatteryUsedPercentage, r.IssuesReported,
            r.WeatherConditions, r.Summary, r.AiAnalysisStatus.ToString(), r.SubmittedAt);
    }

    public async Task<List<FlightReportResponse>> GetReportsAsync(
        Guid? droneId = null, string? aiStatus = null)
    {
        var query = _db.PostFlightReports.AsQueryable();

        if (droneId.HasValue)
            query = query.Where(r => r.Mission.DroneId == droneId.Value);

        if (!string.IsNullOrWhiteSpace(aiStatus) &&
            Enum.TryParse<AiAnalysisStatus>(aiStatus, true, out var parsed))
            query = query.Where(r => r.AiAnalysisStatus == parsed);

        var reports = await query
            .OrderByDescending(r => r.SubmittedAt)
            .Select(r => new
            {
                r.Id,
                r.MissionId,
                r.SubmittedByPilotId,
                r.FlightDurationMinutes,
                r.BatteryUsedPercentage,
                r.IssuesReported,
                r.WeatherConditions,
                r.Summary,
                r.AiAnalysisStatus,
                r.SubmittedAt,
                MissionTitle = r.Mission.Title
            })
            .ToListAsync();

        var result = new List<FlightReportResponse>();
        foreach (var r in reports)
        {
            result.Add(new FlightReportResponse(
                r.Id, r.MissionId, r.MissionTitle, r.SubmittedByPilotId,
                await GetPilotNameAsync(r.SubmittedByPilotId),
                r.FlightDurationMinutes, r.BatteryUsedPercentage, r.IssuesReported,
                r.WeatherConditions, r.Summary, r.AiAnalysisStatus.ToString(), r.SubmittedAt));
        }

        return result;
    }

    public async Task<(bool Success, string? Error, Guid? Id)> SubmitReportAsync(
        Guid missionId, SubmitReportRequest request, Guid userId)
    {
        var mission = await _db.Missions.FindAsync(missionId);
        if (mission == null) return (false, "Mission not found.", null);

        if (mission.Status != MissionStatus.Completed && mission.Status != MissionStatus.Aborted)
            return (false, "Reports can only be submitted for finished missions.", null);

        if (await _db.PostFlightReports.AnyAsync(r => r.MissionId == missionId))
            return (false, "A report has already been submitted for this mission.", null);

        if (request.FlightDurationMinutes < 0)
            return (false, "Flight duration cannot be negative.", null);

        if (request.BatteryUsedPercentage is < 0 or > 100)
            return (false, "Battery usage must be between 0 and 100.", null);

        var pilotId = mission.PilotId;
        if (pilotId == null)
        {
            var pilot = await GetPilotForUserAsync(userId);
            pilotId = pilot?.Id;
        }

        if (pilotId == null)
            return (false, "No pilot is assigned and the current user has no pilot profile.", null);

        var report = new PostFlightReport
        {
            MissionId = missionId,
            SubmittedByPilotId = pilotId.Value,
            FlightDurationMinutes = request.FlightDurationMinutes,
            BatteryUsedPercentage = request.BatteryUsedPercentage,
            IssuesReported = request.IssuesReported,
            WeatherConditions = request.WeatherConditions,
            Summary = request.Summary,
            AiAnalysisStatus = AiAnalysisStatus.Pending,   // pret analizën e Fazës 4
            SubmittedAt = DateTime.UtcNow
        };

        _db.PostFlightReports.Add(report);

        // Nëse piloti raporton probleme, hapet automatikisht një punë mirëmbajtjeje
        if (!string.IsNullOrWhiteSpace(request.IssuesReported) && mission.DroneId.HasValue)
        {
            _db.MaintenanceRecords.Add(new MaintenanceRecord
            {
                DroneId = mission.DroneId.Value,
                TechnicianId = userId,
                MaintenanceType = MaintenanceType.Corrective,
                Description = $"Nga raporti i fluturimit: {request.IssuesReported}",
                PerformedAt = DateTime.UtcNow,
                Status = MaintenanceStatus.Scheduled
            });
        }

        await _db.SaveChangesAsync();
        return (true, null, report.Id);
    }
}