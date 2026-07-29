using SmartFleet.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Application.Services
{
    public interface IDroneModelService
    {
        Task<List<DroneModelResponse>> GetAllAsync();
        Task<DroneModelResponse?> GetByIdAsync(Guid id);
        Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreateDroneModelRequest request);
        Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateDroneModelRequest request);
        Task<(bool Success, string? Error)> DeleteAsync(Guid id);
    }
}
