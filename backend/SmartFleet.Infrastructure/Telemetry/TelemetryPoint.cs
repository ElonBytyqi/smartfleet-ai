using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartFleet.Infrastructure.Telemetry;

public class TelemetryPoint
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonRepresentation(BsonType.String)]
    public Guid DroneId { get; set; }

    [BsonRepresentation(BsonType.String)]
    public Guid? MissionId { get; set; }

    public DateTime Timestamp { get; set; }

    // Pozicioni
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double AltitudeMeters { get; set; }

    // Lëvizja
    public double GroundSpeedMs { get; set; }
    public double VerticalSpeedMs { get; set; }
    public double HeadingDegrees { get; set; }

    // Gjendja
    public double BatteryPercentage { get; set; }
    public double BatteryVoltage { get; set; }
    public int SatelliteCount { get; set; }
    public double SignalStrength { get; set; }

    // Sensorë
    public double? TemperatureCelsius { get; set; }
    public double? VibrationLevel { get; set; }

    public string FlightMode { get; set; } = "Unknown";
    public bool IsArmed { get; set; }
}