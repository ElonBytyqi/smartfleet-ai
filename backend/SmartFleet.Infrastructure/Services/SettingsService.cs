using System.Collections.Concurrent;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Domain.Entities;
using SmartFleet.Infrastructure.Persistence;

namespace SmartFleet.Infrastructure.Services;

public class SettingsService : ISettingsService
{
    private readonly ApplicationDbContext _db;

    // Cache i përbashkët — Scoped service, por cache-i jeton sa aplikacioni
    private static readonly ConcurrentDictionary<string, string> Cache = new();

    public SettingsService(ApplicationDbContext db) => _db = db;

    public async Task WarmUpAsync()
    {
        var all = await _db.Settings
            .Select(s => new { s.Key, s.Value })
            .ToListAsync();

        Cache.Clear();
        foreach (var s in all) Cache[s.Key] = s.Value;
    }

    public double GetNumber(string key, double fallback) =>
        Cache.TryGetValue(key, out var v) &&
        double.TryParse(v, NumberStyles.Any, CultureInfo.InvariantCulture, out var d)
            ? d : fallback;

    public int GetInt(string key, int fallback) =>
        Cache.TryGetValue(key, out var v) && int.TryParse(v, out var i)
            ? i : fallback;

    public bool GetBool(string key, bool fallback) =>
        Cache.TryGetValue(key, out var v) && bool.TryParse(v, out var b)
            ? b : fallback;

    public async Task<List<SettingGroup>> GetAllAsync()
    {
        var all = await _db.Settings
            .OrderBy(s => s.Category).ThenBy(s => s.SortOrder)
            .ToListAsync();

        return all
            .GroupBy(s => s.Category)
            .Select(g => new SettingGroup(
                g.Key,
                g.Select(Map).ToList()))
            .ToList();
    }

    public async Task<(bool Success, string? Error)> UpdateAsync(string key, string value)
    {
        var setting = await _db.Settings.FirstOrDefaultAsync(s => s.Key == key);
        if (setting == null) return (false, "Cilësimi nuk ekziston.");

        var error = Validate(setting, value);
        if (error != null) return (false, error);

        setting.Value = value;
        setting.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        Cache[key] = value;
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> UpdateManyAsync(
        Dictionary<string, string> values)
    {
        var keys = values.Keys.ToList();
        var settings = await _db.Settings
            .Where(s => keys.Contains(s.Key))
            .ToListAsync();

        // Validojmë të gjitha para se të ruajmë ndonjë
        foreach (var s in settings)
        {
            var error = Validate(s, values[s.Key]);
            if (error != null) return (false, $"{s.Label}: {error}");
        }

        foreach (var s in settings)
        {
            s.Value = values[s.Key];
            s.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        foreach (var s in settings) Cache[s.Key] = s.Value;
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> ResetAsync(string key)
    {
        var setting = await _db.Settings.FirstOrDefaultAsync(s => s.Key == key);
        if (setting == null) return (false, "Cilësimi nuk ekziston.");

        setting.Value = setting.DefaultValue;
        setting.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        Cache[key] = setting.DefaultValue;
        return (true, null);
    }

    private static string? Validate(Setting s, string value)
    {
        switch (s.ValueType)
        {
            case SettingValueType.Integer:
                if (!int.TryParse(value, out var i))
                    return "Duhet numër i plotë.";
                return RangeError(s, i);

            case SettingValueType.Decimal:
                if (!decimal.TryParse(value, NumberStyles.Any,
                        CultureInfo.InvariantCulture, out var d))
                    return "Duhet numër.";
                return RangeError(s, d);

            case SettingValueType.Boolean:
                return bool.TryParse(value, out _) ? null : "Duhet true ose false.";

            default:
                return string.IsNullOrWhiteSpace(value) ? "Nuk mund të jetë bosh." : null;
        }
    }

    private static string? RangeError(Setting s, decimal v)
    {
        if (s.MinValue.HasValue && v < s.MinValue)
            return $"Nuk mund të jetë nën {s.MinValue}.";
        if (s.MaxValue.HasValue && v > s.MaxValue)
            return $"Nuk mund të jetë mbi {s.MaxValue}.";
        return null;
    }

    private static SettingResponse Map(Setting s) => new(
        s.Id, s.Key, s.Value, s.DefaultValue,
        s.ValueType.ToString(), s.Category, s.Label, s.Description, s.Unit,
        s.MinValue, s.MaxValue,
        s.Value != s.DefaultValue,
        s.UpdatedAt);
}