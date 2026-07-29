using SmartFleet.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Application.DTOs
{
    public record CreatePilotRequest(
    Guid UserId,
    string? LicenseNumber);

    public record UpdatePilotRequest(
        string? LicenseNumber,
        PilotStatus Status);

    public record PilotResponse(
        Guid Id,
        Guid UserId,
        string? FullName,
        string? Email,
        string? LicenseNumber,
        decimal TotalFlightHours,
        string Status,
        int CertificationCount,
        int ExpiringCertificationCount);

    public record CreateCertificationRequest(
        string CertificationType,
        string IssuedBy,
        DateOnly IssueDate,
        DateOnly ExpiryDate,
        string? DocumentUrl);

    public record UpdateCertificationRequest(
        string CertificationType,
        string IssuedBy,
        DateOnly IssueDate,
        DateOnly ExpiryDate,
        string? DocumentUrl);

    public record CertificationResponse(
        Guid Id,
        Guid PilotId,
        string? PilotName,
        string CertificationType,
        string IssuedBy,
        DateOnly IssueDate,
        DateOnly ExpiryDate,
        string? DocumentUrl,
        bool IsExpired,
        int DaysUntilExpiry);
}
