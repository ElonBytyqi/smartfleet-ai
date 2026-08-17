namespace SmartFleet.Application.DTOs;

// Ajo qe dergon droni (ose ura Python)
public record IngestTelemetryRequest(
    Guid DroneId,
    Guid? MissionId,
    DateTime? Timestamp,
    double Latitude,
    double Longitude,
    double AltitudeMeters,
    double GroundSpeedMs,
    double VerticalSpeedMs,
    double HeadingDegrees,
    double BatteryPercentage,
    double BatteryVoltage,
    int SatelliteCount,
    double SignalStrength,
    double? TemperatureCelsius,
    double? VibrationLevel,
    string? FlightMode,
    bool IsArmed);

public record TelemetryPointResponse(
    Guid DroneId,
    Guid? MissionId,
    DateTime Timestamp,
    double Latitude,
    double Longitude,
    double AltitudeMeters,
    double GroundSpeedMs,
    double VerticalSpeedMs,
    double HeadingDegrees,
    double BatteryPercentage,
    double BatteryVoltage,
    int SatelliteCount,
    double SignalStrength,
    double? TemperatureCelsius,
    double? VibrationLevel,
    string FlightMode,
    bool IsArmed);

// Gjendja live e nje droni, e pasuruar me te dhena nga PostgreSQL
public record LiveDroneResponse(
    Guid DroneId,
    string SerialNumber,
    string? Nickname,
    string DroneStatus,
    Guid? MissionId,
    string? MissionTitle,
    DateTime Timestamp,
    int SecondsSinceUpdate,
    double Latitude,
    double Longitude,
    double AltitudeMeters,
    double GroundSpeedMs,
    double HeadingDegrees,
    double BatteryPercentage,
    int SatelliteCount,
    string FlightMode,
    bool IsArmed,
    List<string> Warnings);