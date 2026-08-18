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