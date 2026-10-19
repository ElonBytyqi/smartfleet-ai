using SmartFleet.Application.DTOs;

namespace SmartFleet.Application.Services;

public interface IAlertService
{
    Task<PagedResult<AlertResponse>> GetAsync(AlertFilter filter, PageRequest paging);
    Task<AlertSummary> GetSummaryAsync();
    Task<List<AlertResponse>> GetActiveAsync(int limit = 20);

    /// <summary>Krijon ose përditëson një alarm ekzistues me të njëjtin çelës.</summary>
    Task<(bool Success, string? Error, Guid? Id)> RaiseAsync(RaiseAlertRequest request);

    Task<(bool Success, string? Error)> AcknowledgeAsync(Guid id, Guid userId, string? note);
    Task<(bool Success, string? Error)> ResolveAsync(Guid id, Guid userId, string? note);

    /// <summary>Mbyll automatikisht alarmet që s'janë parë më prej një kohe.</summary>
    Task<int> AutoResolveStaleAsync(TimeSpan olderThan);
}