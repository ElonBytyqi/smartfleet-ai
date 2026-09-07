namespace SmartFleet.Application.DTOs;

public record AuditLogResponse(
    Guid Id,
    Guid? UserId,
    string? UserEmail,
    string Action,
    string EntityType,
    Guid? EntityId,
    string? EntityLabel,
    string? Changes,
    string? IpAddress,
    DateTime CreatedAt);

public record AuditLogFilter(
    string? EntityType = null,
    string? Action = null,
    Guid? UserId = null,
    DateTime? From = null,
    DateTime? To = null,
    int Page = 1,
    int PageSize = 50);

public record PagedResult<T>(
    List<T> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);