using SmartFleet.Application.DTOs;

namespace SmartFleet.Application.Services;

public interface IAiService
{
    Task<(bool Success, string? Error, List<DroneRiskAssessment>? Data)> GetFleetRiskAsync(bool refresh = false);
    Task<(bool Success, string? Error, DroneRiskAssessment? Data)> GetDroneRiskAsync(Guid droneId, bool refresh = false);
    Task<bool> IsHealthyAsync();
}