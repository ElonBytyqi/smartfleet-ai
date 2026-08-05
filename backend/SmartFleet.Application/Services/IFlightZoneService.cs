using SmartFleet.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Application.Services
{

    public interface IFlightZoneService
    {
        Task<List<FlightZoneResponse>> GetAllAsync(string? zoneType = null);
        Task<FlightZoneResponse?> GetByIdAsync(Guid id);
        Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreateFlightZoneRequest request);
        Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateFlightZoneRequest request);
        Task<(bool Success, string? Error)> DeleteAsync(Guid id);
    }
}
