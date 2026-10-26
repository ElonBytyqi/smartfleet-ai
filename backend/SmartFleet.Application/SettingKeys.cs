namespace SmartFleet.Application;

public static class SettingKeys
{
    public const string BatteryLow = "Battery.LowPercentage";
    public const string BatteryCritical = "Battery.CriticalPercentage";
    public const string BatteryHealthWarning = "Battery.HealthWarningPercentage";

    public const string GpsMinSatellites = "Gps.MinSatellites";

    public const string MaxAltitude = "Flight.MaxAltitudeMeters";
    public const string HighVibration = "Flight.HighVibrationLevel";
    public const string MaxTemperature = "Flight.MaxTemperatureCelsius";
    public const string SignalLostSeconds = "Flight.SignalLostSeconds";

    public const string SeparationHorizontal = "Separation.HorizontalMeters";
    public const string SeparationVertical = "Separation.VerticalMeters";

    public const string ConflictRadius = "Mission.ConflictRadiusMeters";

    public const string CertExpiryWarningDays = "Certification.ExpiryWarningDays";

    public const string AlertAutoResolveMinutes = "Alert.AutoResolveMinutes";
    public const string AuditRetentionDays = "Audit.RetentionDays";
}