using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Domain.Entities;
using SmartFleet.Infrastructure.Identity;
using SmartFleet.Infrastructure.Persistence;

namespace SmartFleet.Infrastructure.Services;

public class AlertService : IAlertService
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    // Nese i njejti alarm perseritet brenda kesaj kohe, vetem rritet numeruesi
    private static readonly TimeSpan DeduplicationWindow = TimeSpan.FromMinutes(15);

    public AlertService(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task<PagedResult<AlertResponse>> GetAsync(AlertFilter filter, PageRequest paging)
    {
        var query = _db.Alerts.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Status) &&
            Enum.TryParse<AlertStatus>(filter.Status, true, out var status))
            query = query.Where(a => a.Status == status);

        if (!string.IsNullOrWhiteSpace(filter.Severity) &&
            Enum.TryParse<AlertSeverity>(filter.Severity, true, out var severity))
            query = query.Where(a => a.Severity == severity);

        if (!string.IsNullOrWhiteSpace(filter.AlertType))
            query = query.Where(a => a.AlertType == filter.AlertType);

        if (filter.DroneId.HasValue)
            query = query.Where(a => a.DroneId == filter.DroneId.Value);

        if (filter.From.HasValue)
            query = query.Where(a => a.CreatedAt >= filter.From.Value.ToUniversalTime());

        if (filter.To.HasValue)
            query = query.Where(a => a.CreatedAt <= filter.To.Value.ToUniversalTime());

        var total = await query.CountAsync();

        var rows = await query
            .OrderByDescending(a => a.Severity)
            .ThenByDescending(a => a.LastSeenAt)
            .Skip(paging.Skip)
            .Take(paging.PageSize)
            .Select(a => new
            {
                a.Id,
                a.AlertType,
                a.Severity,
                a.Status,
                a.Message,
                a.Details,
                a.DroneId,
                DroneSerial = a.Drone != null ? a.Drone.SerialNumber : null,
                a.MissionId,
                MissionTitle = a.Mission != null ? a.Mission.Title : null,
                a.BatteryId,
                BatterySerial = a.Battery != null ? a.Battery.SerialNumber : null,
                a.PilotId,
                PilotLicense = a.Pilot != null ? a.Pilot.LicenseNumber : null,
                a.AcknowledgedByUserId,
                a.AcknowledgedAt,
                a.ResolvedAt,
                a.ResolutionNote,
                a.LastSeenAt,
                a.OccurrenceCount,
                a.CreatedAt
            })
            .ToListAsync();

        // Emrat e userave vijne nga Identity
        var userIds = rows.Where(r => r.AcknowledgedByUserId.HasValue)
            .Select(r => r.AcknowledgedByUserId!.Value).Distinct().ToList();

        var emails = new Dictionary<Guid, string?>();
        foreach (var uid in userIds)
        {
            var user = await _userManager.FindByIdAsync(uid.ToString());
            emails[uid] = user?.Email;
        }

        var items = rows.Select(r => new AlertResponse(
            r.Id, r.AlertType, r.Severity.ToString(), r.Status.ToString(),
            r.Message, r.Details,
            r.DroneId, r.DroneSerial,
            r.MissionId, r.MissionTitle,
            r.BatteryId, r.BatterySerial,
            r.PilotId, r.PilotLicense,
            r.AcknowledgedByUserId,
            r.AcknowledgedByUserId.HasValue ? emails.GetValueOrDefault(r.AcknowledgedByUserId.Value) : null,
            r.AcknowledgedAt, r.ResolvedAt, r.ResolutionNote,
            r.LastSeenAt, r.OccurrenceCount, r.CreatedAt)).ToList();

        var page = Math.Max(1, paging.Page);

        return new PagedResult<AlertResponse>(
            items, page, paging.PageSize, total,
            (int)Math.Ceiling(total / (double)paging.PageSize));
    }

    public async Task<AlertSummary> GetSummaryAsync()
    {
        var active = _db.Alerts.Where(a => a.Status != AlertStatus.Resolved);

        return new AlertSummary(
            await active.CountAsync(),
            await active.CountAsync(a => a.Severity == AlertSeverity.Critical),
            await active.CountAsync(a => a.Severity == AlertSeverity.Warning),
            await active.CountAsync(a => a.Status == AlertStatus.Active));
    }

    public async Task<List<AlertResponse>> GetActiveAsync(int limit = 20)
    {
        var result = await GetAsync(
            new AlertFilter(Status: nameof(AlertStatus.Active)),
            new PageRequest { Page = 1, PageSize = limit });

        return result.Items;
    }

    public async Task<(bool Success, string? Error, Guid? Id)> RaiseAsync(RaiseAlertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return (false, "Message is required.", null);

        if (!Enum.IsDefined(typeof(AlertSeverity), request.Severity))
            return (false, "Invalid severity.", null);

        // Celesi i dedublikimit: tipi + burimi
        var key = BuildKey(request);
        var cutoff = DateTime.UtcNow - DeduplicationWindow;

        var existing = await _db.Alerts
            .Where(a => a.DeduplicationKey == key
                        && a.Status != AlertStatus.Resolved
                        && a.LastSeenAt >= cutoff)
            .OrderByDescending(a => a.LastSeenAt)
            .FirstOrDefaultAsync();

        if (existing != null)
        {
            // I njejti problem vazhdon — rrit numeruesin, mos krijo te ri
            existing.LastSeenAt = DateTime.UtcNow;
            existing.OccurrenceCount++;
            existing.Message = request.Message;   // mesazhi mund te kete numra te rinj
            existing.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return (true, null, existing.Id);
        }

        var alert = new Alert
        {
            AlertType = request.AlertType,
            Severity = (AlertSeverity)request.Severity,
            Status = AlertStatus.Active,
            Message = request.Message,
            Details = request.Details,
            DroneId = request.DroneId,
            MissionId = request.MissionId,
            BatteryId = request.BatteryId,
            PilotId = request.PilotId,
            DeduplicationKey = key,
            LastSeenAt = DateTime.UtcNow,
        };

        _db.Alerts.Add(alert);
        await _db.SaveChangesAsync();

        return (true, null, alert.Id);
    }

    public async Task<(bool Success, string? Error)> AcknowledgeAsync(
        Guid id, Guid userId, string? note)
    {
        var alert = await _db.Alerts.FindAsync(id);
        if (alert == null) return (false, "Alert not found.");

        if (alert.Status == AlertStatus.Resolved)
            return (false, "Alert is already resolved.");

        alert.Status = AlertStatus.Acknowledged;
        alert.AcknowledgedByUserId = userId;
        alert.AcknowledgedAt = DateTime.UtcNow;
        alert.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(note))
            alert.ResolutionNote = note;

        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> ResolveAsync(
        Guid id, Guid userId, string? note)
    {
        var alert = await _db.Alerts.FindAsync(id);
        if (alert == null) return (false, "Alert not found.");

        if (alert.Status == AlertStatus.Resolved)
            return (false, "Alert is already resolved.");

        alert.Status = AlertStatus.Resolved;
        alert.ResolvedAt = DateTime.UtcNow;
        alert.ResolutionNote = note;
        alert.UpdatedAt = DateTime.UtcNow;

        // Nese s'ishte konfirmuar, konfirmohet tani
        alert.AcknowledgedByUserId ??= userId;
        alert.AcknowledgedAt ??= DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<int> AutoResolveStaleAsync(TimeSpan olderThan)
    {
        var cutoff = DateTime.UtcNow - olderThan;

        var stale = await _db.Alerts
            .Where(a => a.Status != AlertStatus.Resolved && a.LastSeenAt < cutoff)
            .ToListAsync();

        foreach (var alert in stale)
        {
            alert.Status = AlertStatus.Resolved;
            alert.ResolvedAt = DateTime.UtcNow;
            alert.ResolutionNote = "Mbyllur automatikisht — problemi s'u vërejt më.";
            alert.UpdatedAt = DateTime.UtcNow;
        }

        if (stale.Count > 0) await _db.SaveChangesAsync();
        return stale.Count;
    }

    private static string BuildKey(RaiseAlertRequest r)
        => $"{r.AlertType}:{r.DroneId}:{r.MissionId}:{r.BatteryId}:{r.PilotId}";
}