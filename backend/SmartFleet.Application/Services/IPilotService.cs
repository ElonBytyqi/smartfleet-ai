using SmartFleet.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Application.Services
{
    public interface IPilotService
    {

        Task<List<PilotResponse>> GetAllAsync();
        Task<PilotResponse?> GetByIdAsync(Guid id);
        Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreatePilotRequest request);
        Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdatePilotRequest request);

        Task<List<CertificationResponse>> GetCertificationsAsync(Guid pilotId);
        Task<List<CertificationResponse>> GetExpiringCertificationsAsync(int days = 30);
        Task<(bool Success, string? Error, Guid? Id)> AddCertificationAsync(Guid pilotId, CreateCertificationRequest request);
        Task<(bool Success, string? Error)> UpdateCertificationAsync(Guid pilotId, Guid certId, UpdateCertificationRequest request);
        Task<(bool Success, string? Error)> DeleteCertificationAsync(Guid pilotId, Guid certId);
    }
}
