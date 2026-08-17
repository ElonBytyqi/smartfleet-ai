using SmartFleet.Application.DTOs;

namespace SmartFleet.Application.Services;

public interface ITelemetryService
{
    Task<(bool Success, string? Error)> IngestAsync(IngestTelemetryRequest request);

    Task<List<LiveDroneResponse>> GetLiveFleetAsync();
    Task<LiveDroneResponse?> GetLiveDroneAsync(Guid droneId);

    Task<List<TelemetryPointResponse>> GetMissionTrackAsync(Guid missionId, int maxPoints = 500);
    Task<List<TelemetryPointResponse>> GetDroneHistoryAsync(Guid droneId, DateTime from, DateTime to);
}