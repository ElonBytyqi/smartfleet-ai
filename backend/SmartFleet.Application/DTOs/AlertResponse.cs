using SmartFleet.Domain.Entities;

namespace SmartFleet.Application.DTOs;

public record AlertResponse(
    Guid Id,
    string AlertType,
    string Severity,
    string Status,
    string Message,
    string? Details,
    Guid? DroneId,
    string? DroneSerialNumber,
    Guid? MissionId,
    string? MissionTitle,
    Guid? BatteryId,
    string? BatterySerialNumber,
    Guid? PilotId,
    string? PilotName,
    Guid? AcknowledgedByUserId,
    string? AcknowledgedByEmail,
    DateTime? AcknowledgedAt,
    DateTime? ResolvedAt,
    string? ResolutionNote,
    DateTime LastSeenAt,
    int OccurrenceCount,
    DateTime CreatedAt);

public record RaiseAlertRequest(
    string AlertType, AlertSeverity Severity, string Message,
    string DeduplicationKey, string? Details,
    Guid? DroneId, Guid? MissionId, Guid? BatteryId, Guid? PilotId);

public record AcknowledgeAlertRequest(string? Note);
public record ResolveAlertRequest(string? Note);

public record AlertFilter(
    string? Status = null,
    string? Severity = null,
    string? AlertType = null,
    Guid? DroneId = null,
    DateTime? From = null,
    DateTime? To = null);

public record AlertSummary(
    int ActiveCount,
    int CriticalCount,
    int WarningCount,
    int UnacknowledgedCount);