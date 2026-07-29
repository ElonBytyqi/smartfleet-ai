using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Application.DTOs
{
    public record CreateDroneModelRequest(
     string ManufacturerName,
     string ModelName,
     int MaxFlightTimeMinutes,
     decimal MaxPayloadKg,
     decimal MaxSpeedKmh,
     string? CameraSpecs);

    public record UpdateDroneModelRequest(
        string ManufacturerName,
        string ModelName,
        int MaxFlightTimeMinutes,
        decimal MaxPayloadKg,
        decimal MaxSpeedKmh,
        string? CameraSpecs);

    public record DroneModelResponse(
        Guid Id,
        string ManufacturerName,
        string ModelName,
        int MaxFlightTimeMinutes,
        decimal MaxPayloadKg,
        decimal MaxSpeedKmh,
        string? CameraSpecs,
        int DroneCount);
}
