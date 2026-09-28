using SmartFleet.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Application.Services
{

    public interface IDroneService
    {
        Task<PagedResult<DroneResponse>> GetAllAsync(
          string? status = null,
          string? search = null,
          PageRequest? paging = null);
        Task<DroneResponse?> GetByIdAsync(Guid id);
        Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreateDroneRequest request);
        Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateDroneRequest request);
        Task<(bool Success, string? Error)> DeleteAsync(Guid id);
    }
}
