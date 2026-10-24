using Microsoft.EntityFrameworkCore;
using SmartFleet.Application.DTOs;
using SmartFleet.Domain.Entites;
using SmartFleet.Domain.Entities;

namespace SmartFleet.Infrastructure.Services;

public partial class ReportService
{
    // ===== Dronët =====
    private async Task<ReportResult> DronesAsync(ReportFilter f)
    {
        var q = _db.Drones.AsQueryable();
        if (f.DroneId is not null) q = q.Where(d => d.Id == f.DroneId);

        var rows = await q
            .OrderByDescending(d => d.TotalFlightHours)
            .Select(d => new
            {
                d.Id,
                d.SerialNumber,
                d.Nickname,
                Model = d.DroneModel.ModelName,
                d.Status,
                d.TotalFlightHours,
                Missions = _db.Missions
                    .Count(m => m.DroneId == d.Id && m.Status == MissionStatus.Completed),
                LastService = _db.MaintenanceRecords
                    .Where(m => m.DroneId == d.Id && m.Status == MaintenanceStatus.Completed)
                    .Max(m => (DateTime?)m.PerformedAt)
            })
            .ToListAsync();

        return new ReportResult(
            "Raporti i flotës",
            Period(f),
            new() { "Numri serik", "Nofka", "Modeli", "Statusi", "Orë", "Misione", "Servisi i fundit" },
            rows.Select(r => new List<string>
            {
            r.SerialNumber,
            r.Nickname ?? "—",
            r.Model,
            r.Status.ToString(),
            r.TotalFlightHours.ToString("F1"),
            r.Missions.ToString(),
            r.LastService?.ToString("dd.MM.yyyy") ?? "—"
            }).ToList(),
            new()
            {
            new("Gjithsej dronë", rows.Count.ToString()),
            new("Të lirë", rows.Count(r => r.Status == DroneStatus.Available).ToString()),
            new("Në mirëmbajtje", rows.Count(r => r.Status == DroneStatus.Maintenance).ToString()),
            new("Jashtë shërbimi", rows.Count(r => r.Status == DroneStatus.Grounded).ToString()),
            new("Orë gjithsej", $"{rows.Sum(r => r.TotalFlightHours):F1} h"),
            new("Mesatarja për dron",
                rows.Count > 0 ? $"{rows.Average(r => r.TotalFlightHours):F1} h" : "—")
            });
    }

    // ===== Bateritë =====
    private async Task<ReportResult> BatteriesAsync(ReportFilter f)
    {
        var q = _db.Batteries.AsQueryable();
        if (f.DroneId is not null) q = q.Where(b => b.DroneId == f.DroneId);

        var rows = await q
            .OrderBy(b => b.HealthPercentage)
            .Select(b => new
            {
                b.SerialNumber,
                b.CapacityMah,
                b.CycleCount,
                b.HealthPercentage,
                b.Status,
                Drone = b.Drone != null ? b.Drone.SerialNumber : "—",
                b.LastInspectionDate
            })
            .ToListAsync();

        var weak = rows.Count(r => r.HealthPercentage < 80);

        return new ReportResult(
            "Raporti i baterive",
            Period(f),
            new() { "Numri serik", "Kapaciteti", "Cikle", "Shëndeti", "Statusi", "Droni", "Inspektimi i fundit" },
            rows.Select(r => new List<string>
            {
                r.SerialNumber,
                $"{r.CapacityMah} mAh",
                r.CycleCount.ToString(),
                $"{r.HealthPercentage:F0}%",
                r.Status.ToString(),
                r.Drone,
                r.LastInspectionDate?.ToString("dd.MM.yyyy") ?? "—"
            }).ToList(),
            new()
            {
                new("Gjithsej bateri", rows.Count.ToString()),
                new("Nën 80% shëndet", weak.ToString()),
                new("Për zëvendësim",
                    rows.Count(r => r.Status == BatteryStatus.NeedsReplacement).ToString()),
                new("Shëndeti mesatar",
                    rows.Count > 0 ? $"{rows.Average(r => r.HealthPercentage):F1}%" : "—"),
                new("Cikle gjithsej", rows.Sum(r => r.CycleCount).ToString())
            });
    }

    // ===== Mirëmbajtja =====
    private async Task<ReportResult> MaintenanceAsync(ReportFilter f)
    {
        var q = _db.MaintenanceRecords.AsQueryable();

        if (f.From is not null)
            q = q.Where(m => m.PerformedAt >= f.From.Value.ToDateTime(TimeOnly.MinValue));
        if (f.To is not null)
            q = q.Where(m => m.PerformedAt <= f.To.Value.ToDateTime(TimeOnly.MaxValue));
        if (f.DroneId is not null) q = q.Where(m => m.DroneId == f.DroneId);

        var rows = await q
            .OrderByDescending(m => m.PerformedAt)
            .Select(m => new
            {
                Drone = m.Drone.SerialNumber,
                m.MaintenanceType,
                m.Description,
                m.PerformedAt,
                m.NextRecommendedDate,
                m.Cost,
                m.Status
            })
            .ToListAsync();

        return new ReportResult(
            "Raporti i mirëmbajtjes",
            Period(f),
            new() { "Droni", "Lloji", "Përshkrimi", "Data", "Kostoja", "Statusi", "Servisi i ardhshëm" },
            rows.Select(r => new List<string>
            {
                r.Drone,
                r.MaintenanceType.ToString(),
                r.Description,
                r.PerformedAt.ToString("dd.MM.yyyy"),
                r.Cost?.ToString("F2") + " €" ?? "—",
                r.Status.ToString(),
                r.NextRecommendedDate?.ToString("dd.MM.yyyy") ?? "—"
            }).ToList(),
            new()
            {
                new("Gjithsej punë", rows.Count.ToString()),
                new("Të përfunduara",
                    rows.Count(r => r.Status == MaintenanceStatus.Completed).ToString()),
                new("Në progres",
                    rows.Count(r => r.Status == MaintenanceStatus.InProgress).ToString()),
                new("Kosto gjithsej", $"{rows.Sum(r => r.Cost ?? 0):F2} €"),
                new("Kosto mesatare",
                    rows.Count > 0 ? $"{rows.Average(r => r.Cost ?? 0):F2} €" : "—")
            });
    }

    // ===== Kostot sipas dronit =====
    private async Task<ReportResult> CostsAsync(ReportFilter f)
    {
        var q = _db.MaintenanceRecords.Where(m => m.Cost != null);

        if (f.From is not null)
            q = q.Where(m => m.PerformedAt >= f.From.Value.ToDateTime(TimeOnly.MinValue));
        if (f.To is not null)
            q = q.Where(m => m.PerformedAt <= f.To.Value.ToDateTime(TimeOnly.MaxValue));

        var grouped = await q
            .GroupBy(m => new { m.DroneId, m.Drone.SerialNumber, m.Drone.TotalFlightHours })
            .Select(g => new
            {
                g.Key.SerialNumber,
                g.Key.TotalFlightHours,
                Jobs = g.Count(),
                Total = g.Sum(m => m.Cost!.Value),
                Corrective = g.Where(m => m.MaintenanceType == MaintenanceType.Corrective)
                              .Sum(m => m.Cost!.Value)
            })
            .OrderByDescending(x => x.Total)
            .ToListAsync();

        var total = grouped.Sum(g => g.Total);

        return new ReportResult(
            "Raporti i kostove",
            Period(f),
            new() { "Droni", "Punë", "Kosto totale", "Riparime", "Kosto për orë", "Pjesa" },
            grouped.Select(g => new List<string>
            {
                g.SerialNumber,
                g.Jobs.ToString(),
                $"{g.Total:F2} €",
                $"{g.Corrective:F2} €",
                g.TotalFlightHours > 0 ? $"{g.Total / g.TotalFlightHours:F2} €/h" : "—",
                total > 0 ? $"{100 * g.Total / total:F1}%" : "—"
            }).ToList(),
            new()
            {
                new("Kosto gjithsej", $"{total:F2} €"),
                new("Dronë me kosto", grouped.Count.ToString()),
                new("Mesatarja për dron",
                    grouped.Count > 0 ? $"{total / grouped.Count:F2} €" : "—"),
                new("Më i shtrenjti",
                    grouped.FirstOrDefault()?.SerialNumber ?? "—")
            });
    }

    // ===== Orët e fluturimit sipas pilotit =====
    private async Task<ReportResult> FlightHoursAsync(ReportFilter f)
    {
        var q = _db.Missions.Where(m =>
            m.ActualStart != null && m.ActualEnd != null && m.PilotId != null);

        if (f.From is not null)
            q = q.Where(m => m.ActualStart >= f.From.Value.ToDateTime(TimeOnly.MinValue));
        if (f.To is not null)
            q = q.Where(m => m.ActualStart <= f.To.Value.ToDateTime(TimeOnly.MaxValue));
        if (f.PilotId is not null) q = q.Where(m => m.PilotId == f.PilotId);

        var raw = await q
            .Select(m => new
            {
                m.PilotId,
                License = m.Pilot!.LicenseNumber,
                m.ActualStart,
                m.ActualEnd,
                m.Status
            })
            .ToListAsync();

        var grouped = raw
            .GroupBy(r => new { r.PilotId, r.License })
            .Select(g => new
            {
                g.Key.License,
                Flights = g.Count(),
                Hours = g.Sum(r => (r.ActualEnd!.Value - r.ActualStart!.Value).TotalHours),
                Completed = g.Count(r => r.Status == MissionStatus.Completed)
            })
            .OrderByDescending(g => g.Hours)
            .ToList();

        return new ReportResult(
            "Raporti i orëve të fluturimit",
            Period(f),
            new() { "Licenca", "Fluturime", "Orë", "Mesatarja", "Të përfunduara", "Suksesi" },
            grouped.Select(g => new List<string>
            {
                g.License ?? "—",
                g.Flights.ToString(),
                $"{g.Hours:F1} h",
                $"{g.Hours / g.Flights:F2} h",
                g.Completed.ToString(),
                $"{100.0 * g.Completed / g.Flights:F0}%"
            }).ToList(),
            new()
            {
                new("Pilotë aktivë", grouped.Count.ToString()),
                new("Fluturime gjithsej", grouped.Sum(g => g.Flights).ToString()),
                new("Orë gjithsej", $"{grouped.Sum(g => g.Hours):F1} h"),
                new("Më aktivi", grouped.FirstOrDefault()?.License ?? "—")
            });
    }
}