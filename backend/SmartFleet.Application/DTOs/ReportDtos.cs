namespace SmartFleet.Application.DTOs;

public record ReportFilter(
    DateOnly? From,
    DateOnly? To,
    Guid? DroneId,
    Guid? PilotId,
    string? Status);

public enum ReportType
{
    Missions = 0,
    Drones = 1,
    Batteries = 2,
    Maintenance = 3,
    Costs = 4,
    FlightHours = 5
}

/// <summary>Rezultat i përgjithshëm: kolona + rreshta, që eksportuesit të jenë gjenerikë.</summary>
public record ReportResult(
    string Title,
    string Subtitle,
    List<string> Columns,
    List<List<string>> Rows,
    List<ReportSummaryItem> Summary);

public record ReportSummaryItem(string Label, string Value);