using SmartFleet.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Application.Services
{
    public interface IMissionService
    {
        Task<List<MissionResponse>> GetAllAsync(string? status = null, Guid? droneId = null, Guid? pilotId = null);
        Task<MissionResponse?> GetByIdAsync(Guid id);

        Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreateMissionRequest request, Guid createdByUserId);
        Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateMissionRequest request);

        Task<(bool Success, string? Error)> AssignResourcesAsync(Guid id, AssignResourcesRequest request);
        Task<ConflictResponse> CheckConflictsAsync(Guid id);

        Task<(bool Success, string? Error)> ApproveAsync(Guid id, Guid approvedByUserId);
        Task<(bool Success, string? Error)> CancelAsync(Guid id);
        Task<(bool Success, string? Error)> StartAsync(Guid id);
        Task<(bool Success, string? Error)> CompleteAsync(Guid id);
        Task<(bool Success, string? Error)> AbortAsync(Guid id);

        Task<List<WaypointResponse>> GetWaypointsAsync(Guid id);
        Task<(bool Success, string? Error)> ReplaceWaypointsAsync(Guid id, List<WaypointRequest> waypoints);
    }
}
