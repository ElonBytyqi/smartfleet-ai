using SmartFleet.Application.DTOs;

namespace SmartFleet.Application.Services;

public interface IMaintenanceService
{
    Task<List<MaintenanceResponse>> GetAllAsync(Guid? droneId = null, string? status = null);
    Task<MaintenanceResponse?> GetByIdAsync(Guid id);
    Task<List<MaintenanceResponse>> GetUpcomingAsync(int days = 30);

    Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreateMaintenanceRequest request, Guid technicianId);
    Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateMaintenanceRequest request);
    Task<(bool Success, string? Error)> StartAsync(Guid id);
    Task<(bool Success, string? Error)> CompleteAsync(Guid id, CompleteMaintenanceRequest request);
    Task<(bool Success, string? Error)> CancelAsync(Guid id);

    Task<List<ComponentResponse>> GetComponentsAsync(Guid droneId);
    Task<(bool Success, string? Error, Guid? Id)> AddComponentAsync(Guid droneId, CreateComponentRequest request);
    Task<(bool Success, string? Error)> UpdateComponentAsync(Guid droneId, Guid componentId, UpdateComponentRequest request);
}