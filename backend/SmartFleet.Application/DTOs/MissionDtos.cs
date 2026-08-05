using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Application.DTOs
{

    public record CreateMissionRequest(
        string Title,
        string MissionType,
        Guid FlightZoneId,
        DateTime ScheduledStart,
        DateTime? ScheduledEnd,
            bool IsAutonomous);

    public record UpdateMissionRequest(
        string Title,
        string MissionType,
        Guid FlightZoneId,
        DateTime ScheduledStart,
        DateTime? ScheduledEnd,
            bool IsAutonomous);

    public record AssignResourcesRequest(
        Guid DroneId,
        Guid? PilotId,
        Guid BatteryId);

    public record WaypointRequest(
        int SequenceNumber,
        decimal Latitude,
        decimal Longitude,
        decimal? AltitudeMeters,
        string? ActionType);

    public record WaypointResponse(
        Guid Id,
        int SequenceNumber,
        decimal Latitude,
        decimal Longitude,
        decimal? AltitudeMeters,
        string? ActionType);

    public record MissionResponse(
        Guid Id,
        string Title,
        string MissionType,
        string Status,
          bool IsAutonomous,
        Guid FlightZoneId,
        string? FlightZoneName,
        Guid? DroneId,
        string? DroneSerialNumber,
        Guid? PilotId,
        string? PilotLicense,
        Guid? BatteryId,
        string? BatterySerialNumber,
        DateTime ScheduledStart,
        DateTime? ScheduledEnd,
        DateTime? ActualStart,
        DateTime? ActualEnd,
        int WaypointCount);

    public record ConflictResponse(
        bool HasConflicts,
        List<string> Conflicts);
}
