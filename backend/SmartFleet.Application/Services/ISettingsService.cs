using SmartFleet.Application.DTOs;

namespace SmartFleet.Application.Services;

public interface ISettingsService
{
    Task<List<SettingGroup>> GetAllAsync();

    /// <summary>Lexim i shpejtë nga cache — përdoret në rrugën e telemetrisë.</summary>
    double GetNumber(string key, double fallback);
    int GetInt(string key, int fallback);
    bool GetBool(string key, bool fallback);

    Task<(bool Success, string? Error)> UpdateAsync(string key, string value);
    Task<(bool Success, string? Error)> UpdateManyAsync(Dictionary<string, string> values);
    Task<(bool Success, string? Error)> ResetAsync(string key);

    /// <summary>Mbush cache-in në nisje.</summary>
    Task WarmUpAsync();
}