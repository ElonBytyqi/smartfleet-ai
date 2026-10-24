using Microsoft.EntityFrameworkCore;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Domain.Entities;
using SmartFleet.Infrastructure.Persistence;

namespace SmartFleet.Infrastructure.Services;

public partial class ReportService : IReportService
{
    private readonly ApplicationDbContext _db;

    public ReportService(ApplicationDbContext db) => _db = db;

    public Task<ReportResult> BuildAsync(ReportType type, ReportFilter filter) => type switch
    {
        ReportType.Missions => MissionsAsync(filter),
        ReportType.Drones => DronesAsync(filter),
        ReportType.Batteries => BatteriesAsync(filter),
        ReportType.Maintenance => MaintenanceAsync(filter),
        ReportType.Costs => CostsAsync(filter),
        ReportType.FlightHours => FlightHoursAsync(filter),
        _ => throw new ArgumentOutOfRangeException(nameof(type))
    };

    private static string Period(ReportFilter f) =>
        (f.From, f.To) switch
        {
            (null, null) => "Të gjitha të dhënat",
            (not null, null) => $"Nga {f.From}",
            (null, not null) => $"Deri më {f.To}",
            _ => $"{f.From} – {f.To}"
        };

    private async Task<ReportResult> MissionsAsync(ReportFilter f)
    {
        var q = _db.Missions.AsQueryable();

        if (f.From is not null)
            q = q.Where(m => m.ScheduledStart >= f.From.Value.ToDateTime(TimeOnly.MinValue));
        if (f.To is not null)
            q = q.Where(m => m.ScheduledStart <= f.To.Value.ToDateTime(TimeOnly.MaxValue));
        if (f.DroneId is not null) q = q.Where(m => m.DroneId == f.DroneId);
        if (f.PilotId is not null) q = q.Where(m => m.PilotId == f.PilotId);
        if (!string.IsNullOrWhiteSpace(f.Status) &&
            Enum.TryParse<MissionStatus>(f.Status, true, out var st))
            q = q.Where(m => m.Status == st);

        var rows = await q
            .OrderByDescending(m => m.ScheduledStart)
            .Select(m => new
            {
                m.Title,
                m.MissionType,
                Zone = m.FlightZone.Name,
                Drone = m.Drone != null ? m.Drone.SerialNumber : "—",
                m.Status,
                m.ScheduledStart,
                m.ActualStart,
                m.ActualEnd,
                Points = m.Waypoints.Count
            })
            .ToListAsync();

        var completed = rows.Count(r => r.Status == MissionStatus.Completed);
        var aborted = rows.Count(r => r.Status == MissionStatus.Aborted);

        var hours = rows
            .Where(r => r.ActualStart != null && r.ActualEnd != null)
            .Sum(r => (r.ActualEnd!.Value - r.ActualStart!.Value).TotalHours);

        return new ReportResult(
            "Raporti i misioneve",
            Period(f),
            new() { "Titulli", "Lloji", "Zona", "Droni", "Statusi", "Fillimi", "Pika" },
            rows.Select(r => new List<string>
            {
                r.Title,
                r.MissionType,
                r.Zone,
                r.Drone,
                r.Status.ToString(),
                r.ScheduledStart.ToString("dd.MM.yyyy HH:mm") + "Z",
                r.Points.ToString()
            }).ToList(),
            new()
            {
                new("Gjithsej misione", rows.Count.ToString()),
                new("Të përfunduara", completed.ToString()),
                new("Të ndërprera", aborted.ToString()),
                new("Shkalla e suksesit",
                    rows.Count > 0 ? $"{100.0 * completed / rows.Count:F1}%" : "—"),
                new("Orë fluturimi", $"{hours:F1} h")
            });
    }
}