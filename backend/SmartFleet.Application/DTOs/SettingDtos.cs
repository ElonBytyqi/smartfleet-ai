namespace SmartFleet.Application.DTOs;

public record SettingResponse(
    Guid Id,
    string Key,
    string Value,
    string DefaultValue,
    string ValueType,
    string Category,
    string Label,
    string? Description,
    string? Unit,
    decimal? MinValue,
    decimal? MaxValue,
    bool IsModified,
    DateTime? UpdatedAt);

public record SettingGroup(string Category, List<SettingResponse> Settings);

public record UpdateSettingRequest(string Value);

public record UpdateSettingsRequest(Dictionary<string, string> Values);