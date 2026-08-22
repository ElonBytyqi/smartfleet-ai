using SmartFleet.Application.DTOs;

namespace SmartFleet.Application.Services;

public interface IAiService
{
    Task<(bool Success, string? Error, List<DroneRiskAssessment>? Data)> GetFleetRiskAsync(bool refresh = false);
    Task<(bool Success, string? Error, DroneRiskAssessment? Data)> GetDroneRiskAsync(Guid droneId, bool refresh = false);
    Task<bool> IsHealthyAsync();

    Task<(bool Success, string? Error, MissionAnalysis? Data)> GetMissionAnalysisAsync(Guid missionId, bool refresh = false);
    Task<(bool Success, string? Error, List<MissionAnalysis>? Data)> GetRecentAnomaliesAsync(int days = 14);

    Task<(bool Success, string? Error, ReportAnalysis? Data)> GetReportAnalysisAsync(Guid reportId);
    Task<(bool Success, string? Error, PendingAnalysisResult? Data)> AnalyzePendingReportsAsync();

}