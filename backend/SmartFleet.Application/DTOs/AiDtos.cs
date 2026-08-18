namespace SmartFleet.Application.DTOs;

public record RiskFactor(
    string Name,
    string Value,
    int Score,
    int Weight);

public record DroneRiskAssessment(
    Guid DroneId,
    string SerialNumber,
    string? Nickname,
    string? ModelName,
    double RiskScore,
    string RiskLevel,
    string RecommendedAction,
    int RecommendedInspectionDays,
    string? LikelyComponent,
    List<RiskFactor> Factors,
    int TelemetryPoints,
    DateTime AssessedAt);


public record Anomaly(
    string Type,
    string Severity,
    string Title,
    string Detail,
    string Recommendation,
    int? FlightIndex,
    string? FlightTime,
    int? Occurrences);

public record MissionAnalysis(
    Guid MissionId,
    string? MissionTitle,
    Guid? DroneId,
    string? DroneSerialNumber,
    string? DroneNickname,
    string? ZoneName,
    int TelemetryPoints,
    int FlightCount,
    double? DurationMinutes,
    double? BatteryUsed,
    double? MaxDeviationMeters,
    int? HealthScore,
    List<Anomaly> Anomalies,
    string Summary,
    DateTime AnalyzedAt);