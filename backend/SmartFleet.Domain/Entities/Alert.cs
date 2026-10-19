using SmartFleet.Domain.Entites;

namespace SmartFleet.Domain.Entities;

public enum AlertSeverity
{
    Info = 0,
    Warning = 1,
    Critical = 2
}

public enum AlertStatus
{
    Active = 0,
    Acknowledged = 1,
    Resolved = 2
}

public class Alert : BaseEntity
{
    /// <summary>Tipi teknik: LowBattery, GeofenceViolation, ProximityWarning...</summary>
    public string AlertType { get; set; } = string.Empty;

    public AlertSeverity Severity { get; set; }
    public AlertStatus Status { get; set; } = AlertStatus.Active;

    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }

    // Burimi i alarmit
    public Guid? DroneId { get; set; }
    public Drone? Drone { get; set; }

    public Guid? MissionId { get; set; }
    public Mission? Mission { get; set; }

    public Guid? BatteryId { get; set; }
    public Battery? Battery { get; set; }

    public Guid? PilotId { get; set; }
    public Pilot? Pilot { get; set; }

    // Kush e konfirmoi dhe kur
    public Guid? AcknowledgedByUserId { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolutionNote { get; set; }

    /// <summary>
    /// Çelës unik për të shmangur dublikatat: i njëjti problem
    /// për të njëjtin dron s'duhet të krijojë alarm çdo sekondë.
    /// </summary>
    public string DeduplicationKey { get; set; } = string.Empty;

    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
    public int OccurrenceCount { get; set; } = 1;
}