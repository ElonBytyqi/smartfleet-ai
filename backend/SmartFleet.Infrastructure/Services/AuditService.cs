using Microsoft.EntityFrameworkCore;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Infrastructure.Persistence;

namespace SmartFleet.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _db;

    public AuditService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<AuditLogResponse>> GetAsync(AuditLogFilter filter)
    {
        var query = _db.AuditLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.EntityType))
            query = query.Where(l => l.EntityType == filter.EntityType);

        if (!string.IsNullOrWhiteSpace(filter.Action))
            query = query.Where(l => l.Action == filter.Action);

        if (filter.UserId.HasValue)
            query = query.Where(l => l.UserId == filter.UserId.Value);

        if (filter.From.HasValue)
            query = query.Where(l => l.CreatedAt >= filter.From.Value.ToUniversalTime());

        if (filter.To.HasValue)
            query = query.Where(l => l.CreatedAt <= filter.To.Value.ToUniversalTime());

        var total = await query.CountAsync();

        var page = Math.Max(1, filter.Page);
        var size = Math.Clamp(filter.PageSize, 1, 200);

        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * size)
            .Take(size)
            .Select(l => new AuditLogResponse(
                l.Id, l.UserId, l.UserEmail, l.Action, l.EntityType,
                l.EntityId, l.EntityLabel, l.Changes, l.IpAddress, l.CreatedAt))
            .ToListAsync();

        return new PagedResult<AuditLogResponse>(
            items, page, size, total, (int)Math.Ceiling(total / (double)size));
    }

    public async Task<List<string>> GetEntityTypesAsync()
        => await _db.AuditLogs
            .Select(l => l.EntityType)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync();
}