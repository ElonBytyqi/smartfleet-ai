using SmartFleet.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Application.Services
{

    public interface IDroneService
    {
        Task<List<DroneResponse>> GetAllAsync();
        Task<DroneResponse?> GetByIdAsync(Guid id);
        Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreateDroneRequest request);
        Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateDroneRequest request);
        Task<(bool Success, string? Error)> DeleteAsync(Guid id);
    }
}
