using SmartFleet.Application.DTOs;

namespace SmartFleet.Application.Services;

public interface IFlightRecordService
{
    Task<ChecklistResponse?> GetChecklistAsync(Guid missionId);
    Task<(bool Success, string? Error, Guid? Id)> SubmitChecklistAsync(
        Guid missionId, SubmitChecklistRequest request, Guid userId);

    Task<FlightReportResponse?> GetReportAsync(Guid missionId);
    Task<List<FlightReportResponse>> GetReportsAsync(Guid? droneId = null, string? aiStatus = null);
    Task<(bool Success, string? Error, Guid? Id)> SubmitReportAsync(
        Guid missionId, SubmitReportRequest request, Guid userId);
}