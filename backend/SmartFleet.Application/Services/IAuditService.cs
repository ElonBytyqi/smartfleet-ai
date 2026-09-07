using SmartFleet.Application.DTOs;

namespace SmartFleet.Application.Services;

public interface IAuditService
{
    Task<PagedResult<AuditLogResponse>> GetAsync(AuditLogFilter filter);
    Task<List<string>> GetEntityTypesAsync();
}