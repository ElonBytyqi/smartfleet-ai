using SmartFleet.Domain.Entites;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Application.DTOs
{
    public record CreateDroneRequest(
       string SerialNumber,
       string? Nickname,
       Guid DroneModelId,
       DateOnly? PurchaseDate);

    public record UpdateDroneRequest(
        string? Nickname,
        DroneStatus Status);

    public record DroneResponse(
        Guid Id,
        string SerialNumber,
        string? Nickname,
        string Status,
        decimal TotalFlightHours,
        DateOnly? PurchaseDate,
        Guid DroneModelId,
        string? ModelName);
}
