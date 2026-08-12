using SmartFleet.Domain.Entities;

namespace SmartFleet.Application.DTOs;

public record CreateMaintenanceRequest(
    Guid DroneId,
    MaintenanceType MaintenanceType,
    string Description,
    Guid? ComponentId,
    DateTime? PerformedAt,
    decimal? Cost);

public record UpdateMaintenanceRequest(
    string Description,
    decimal? Cost,
    DateOnly? NextRecommendedDate);

public record CompleteMaintenanceRequest(
    decimal? Cost,
    DateOnly? NextRecommendedDate,
    bool ReturnDroneToService);

public record MaintenanceResponse(
    Guid Id,
    Guid DroneId,
    string? DroneSerialNumber,
    string? DroneNickname,
    Guid TechnicianId,
    string? TechnicianName,
    string MaintenanceType,
    string Description,
    Guid? ComponentId,
    string? ComponentType,
    DateTime PerformedAt,
    DateOnly? NextRecommendedDate,
    decimal? Cost,
    string Status);

// Komponentët
public record CreateComponentRequest(
    string ComponentType,
    string? SerialNumber,
    DateOnly InstalledAt,
    int? ExpectedLifespanHours);

public record UpdateComponentRequest(
    string ComponentType,
    string? SerialNumber,
    int? ExpectedLifespanHours,
    string Status);

public record ComponentResponse(
    Guid Id,
    Guid DroneId,
    string ComponentType,
    string? SerialNumber,
    DateOnly InstalledAt,
    int? ExpectedLifespanHours,
    string Status);