using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SmartFleet.Domain.Entities;

namespace SmartFleet.Infrastructure.Persistence;

/// <summary>
/// Kap çdo ndryshim në databazë dhe e shkruan në AuditLogs automatikisht.
/// Asnjë service s'ka nevojë të shkruajë kod audit-i.
/// </summary>
public class AuditInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _http;

    // Entitetet qe nuk gjurmohen — audit-i vete, dhe gjerat teknike
    private static readonly HashSet<string> Ignored = new()
    {
        nameof(AuditLog),
        "RefreshToken",
        "IdentityUserClaim`1",
        "IdentityUserToken`1",
        "IdentityUserLogin`1",
        "IdentityRoleClaim`1",
    };

    // Fusha qe nuk ruhen kurre ne log
    private static readonly HashSet<string> Sensitive = new()
    {
        "PasswordHash",
        "SecurityStamp",
        "ConcurrencyStamp",
        "Token",
    };

    public AuditInterceptor(IHttpContextAccessor http)
    {
        _http = http;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var context = eventData.Context;
        if (context == null) return base.SavingChangesAsync(eventData, result, cancellationToken);

        var logs = BuildLogs(context);

        if (logs.Count > 0)
            context.Set<AuditLog>().AddRange(logs);

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private List<AuditLog> BuildLogs(DbContext context)
    {
        var logs = new List<AuditLog>();

        var user = _http.HttpContext?.User;
        var userIdClaim = user?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = user?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var ip = _http.HttpContext?.Connection.RemoteIpAddress?.ToString();

        Guid? userId = Guid.TryParse(userIdClaim, out var parsed) ? parsed : null;

        foreach (var entry in context.ChangeTracker.Entries())
        {
            var typeName = entry.Entity.GetType().Name;

            if (Ignored.Contains(typeName)) continue;
            if (entry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted))
                continue;

            var action = entry.State switch
            {
                EntityState.Added => "Created",
                EntityState.Modified => "Updated",
                _ => "Deleted",
            };

            var changes = BuildChanges(entry);

            // Nese vetem fushat teknike ndryshuan, mos e regjistro
            if (action == "Updated" && changes.Count == 0) continue;

            logs.Add(new AuditLog
            {
                UserId = userId,
                UserEmail = email,
                Action = action,
                EntityType = typeName,
                EntityId = ExtractId(entry),
                EntityLabel = ExtractLabel(entry),
                Changes = changes.Count > 0 ? JsonSerializer.Serialize(changes) : null,
                IpAddress = ip,
            });
        }

        return logs;
    }

    private static Dictionary<string, object?> BuildChanges(EntityEntry entry)
    {
        var changes = new Dictionary<string, object?>();

        foreach (var prop in entry.Properties)
        {
            var name = prop.Metadata.Name;

            if (Sensitive.Contains(name)) continue;
            if (name is "CreatedAt" or "UpdatedAt") continue;

            if (entry.State == EntityState.Added)
            {
                if (prop.CurrentValue != null)
                    changes[name] = Stringify(prop.CurrentValue);
            }
            else if (entry.State == EntityState.Modified && prop.IsModified)
            {
                var before = Stringify(prop.OriginalValue);
                var after = Stringify(prop.CurrentValue);

                if (before != after)
                    changes[name] = new { from = before, to = after };
            }
            else if (entry.State == EntityState.Deleted)
            {
                if (prop.OriginalValue != null)
                    changes[name] = Stringify(prop.OriginalValue);
            }
        }

        return changes;
    }

    private static string? Stringify(object? value) => value switch
    {
        null => null,
        DateTime dt => dt.ToString("yyyy-MM-dd HH:mm:ss"),
        DateOnly d => d.ToString("yyyy-MM-dd"),
        decimal dec => dec.ToString("0.##"),
        _ => value.ToString(),
    };

    private static Guid? ExtractId(EntityEntry entry)
    {
        var idProp = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "Id");
        return idProp?.CurrentValue is Guid g ? g : null;
    }

    /// <summary>Emri i lexueshëm i entitetit — që logu të mos jetë vetëm GUID.</summary>
    private static string? ExtractLabel(EntityEntry entry)
    {
        string[] candidates = { "SerialNumber", "Title", "Name", "Email", "FullName", "Description" };

        foreach (var candidate in candidates)
        {
            var prop = entry.Properties.FirstOrDefault(p => p.Metadata.Name == candidate);
            var value = prop?.CurrentValue ?? prop?.OriginalValue;
            if (value is string s && !string.IsNullOrWhiteSpace(s)) return s;
        }

        return null;
    }
}