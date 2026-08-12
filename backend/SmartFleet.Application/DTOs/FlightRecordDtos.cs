using SmartFleet.Domain.Entities;

namespace SmartFleet.Application.DTOs;

public record SubmitChecklistRequest(
    bool BatteryChecked,
    bool PropellersChecked,
    bool GpsSignalOk,
    bool WeatherConditionsOk,
    bool FirmwareUpToDate,
    string? Notes);

public record ChecklistResponse(
    Guid Id,
    Guid MissionId,
    Guid CompletedByPilotId,
    string? CompletedByName,
    bool BatteryChecked,
    bool PropellersChecked,
    bool GpsSignalOk,
    bool WeatherConditionsOk,
    bool FirmwareUpToDate,
    string? Notes,
    DateTime CompletedAt,
    bool AllChecksPassed);

public record SubmitReportRequest(
    int FlightDurationMinutes,
    decimal? BatteryUsedPercentage,
    string? IssuesReported,
    string? WeatherConditions,
    string? Summary);

public record FlightReportResponse(
    Guid Id,
    Guid MissionId,
    string? MissionTitle,
    Guid SubmittedByPilotId,
    string? SubmittedByName,
    int FlightDurationMinutes,
    decimal? BatteryUsedPercentage,
    string? IssuesReported,
    string? WeatherConditions,
    string? Summary,
    string AiAnalysisStatus,
    DateTime SubmittedAt);