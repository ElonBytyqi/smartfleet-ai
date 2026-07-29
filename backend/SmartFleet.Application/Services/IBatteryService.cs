using System;
using System.Collections.Generic;
using System.Text;
using static SmartFleet.Application.DTOs.BatteryDtos;

namespace SmartFleet.Application.Services
{
    public interface IBatteryService
    {

        Task<List<BatteryResponse>> GetAllAsync(Guid? droneId = null);
        Task<BatteryResponse?> GetByIdAsync(Guid id);
        Task<List<BatteryResponse>> GetNeedingInspectionAsync(decimal healthThreshold = 80);
        Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreateBatteryRequest request);
        Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateBatteryRequest request);
        Task<(bool Success, string? Error)> UpdateStatusAsync(Guid id, UpdateBatteryStatusRequest request);
        Task<(bool Success, string? Error)> AssignToDroneAsync(Guid id, AssignBatteryRequest request);
    }
}
