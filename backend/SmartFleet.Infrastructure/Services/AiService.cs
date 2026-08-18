using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using StackExchange.Redis;

namespace SmartFleet.Infrastructure.Services;

public class AiService : IAiService
{
    private readonly HttpClient _http;
    private readonly IDatabase _cache;
    private readonly ILogger<AiService> _logger;
    private readonly TimeSpan _cacheTtl;
 

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private const string FleetCacheKey = "ai:risk:fleet";
    private const string DroneCacheKeyPrefix = "ai:risk:drone:";
    private const string AnomalyCacheKeyPrefix = "ai:anomaly:mission:";
    private const string RecentAnomaliesCacheKey = "ai:anomaly:recent";
    public AiService(
        HttpClient http,
        IConnectionMultiplexer redis,
        IConfiguration config,
        ILogger<AiService> logger)
    {
        _http = http;
        _cache = redis.GetDatabase();
        _logger = logger;

        _http.BaseAddress = new Uri(config["AiService:BaseUrl"]!);
        _http.DefaultRequestHeaders.Add("x-api-key", config["AiService:ApiKey"]);
        _http.Timeout = TimeSpan.FromSeconds(60);   // vleresimi i flotes merr kohe

        _cacheTtl = TimeSpan.FromMinutes(
            double.TryParse(config["AiService:CacheMinutes"], out var m) ? m : 15);
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            var response = await _http.GetAsync("/health");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<(bool, string?, List<DroneRiskAssessment>?)> GetFleetRiskAsync(bool refresh = false)
    {
        if (!refresh)
        {
            var cached = await _cache.StringGetAsync(FleetCacheKey);
            if (cached.HasValue)
            {
                var data = JsonSerializer.Deserialize<List<DroneRiskAssessment>>(
                    cached.ToString(), JsonOptions);
                if (data != null) return (true, null, data);
            }
        }

        try
        {
            var response = await _http.GetAsync("/predictive/fleet");

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("AI service returned {Status}: {Body}",
                    response.StatusCode, body);
                return (false, "Shërbimi AI nuk u përgjigj.", null);
            }

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<List<DroneRiskAssessment>>(json, JsonOptions);

            if (result == null)
                return (false, "Përgjigje e pavlefshme nga shërbimi AI.", null);

            await _cache.StringSetAsync(FleetCacheKey, json, _cacheTtl);
            return (true, null, result);
        }
        catch (TaskCanceledException)
        {
            return (false, "Shërbimi AI po merr shumë kohë.", null);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Cannot reach AI service");
            return (false, "Shërbimi AI nuk është i disponueshëm.", null);
        }
    }

    public async Task<(bool, string?, DroneRiskAssessment?)> GetDroneRiskAsync(
        Guid droneId, bool refresh = false)
    {
        var key = $"{DroneCacheKeyPrefix}{droneId}";

        if (!refresh)
        {
            var cached = await _cache.StringGetAsync(key);
            if (cached.HasValue)
            {
                var data = JsonSerializer.Deserialize<DroneRiskAssessment>(
                    cached.ToString(), JsonOptions);
                if (data != null) return (true, null, data);
            }
        }

        try
        {
            var response = await _http.GetAsync($"/predictive/drones/{droneId}");

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                return (false, "Droni nuk u gjet.", null);

            if (!response.IsSuccessStatusCode)
                return (false, "Shërbimi AI nuk u përgjigj.", null);

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<DroneRiskAssessment>(json, JsonOptions);

            if (result == null)
                return (false, "Përgjigje e pavlefshme nga shërbimi AI.", null);

            await _cache.StringSetAsync(key, json, _cacheTtl);
            return (true, null, result);
        }
        catch (TaskCanceledException)
        {
            return (false, "Shërbimi AI po merr shumë kohë.", null);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Cannot reach AI service");
            return (false, "Shërbimi AI nuk është i disponueshëm.", null);
        }
    }
    public async Task<(bool, string?, MissionAnalysis?)> GetMissionAnalysisAsync(
    Guid missionId, bool refresh = false)
    {
        var key = $"{AnomalyCacheKeyPrefix}{missionId}";

        if (!refresh)
        {
            var cached = await _cache.StringGetAsync(key);
            if (cached.HasValue)
            {
                var data = JsonSerializer.Deserialize<MissionAnalysis>(
                    cached.ToString(), JsonOptions);
                if (data != null) return (true, null, data);
            }
        }

        try
        {
            var response = await _http.GetAsync($"/anomalies/missions/{missionId}");

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                return (false, "Misioni nuk u gjet.", null);

            if (!response.IsSuccessStatusCode)
                return (false, "Shërbimi AI nuk u përgjigj.", null);

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<MissionAnalysis>(json, JsonOptions);

            if (result == null)
                return (false, "Përgjigje e pavlefshme nga shërbimi AI.", null);

            await _cache.StringSetAsync(key, json, _cacheTtl);
            return (true, null, result);
        }
        catch (TaskCanceledException)
        {
            return (false, "Analiza po merr shumë kohë.", null);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Cannot reach AI service");
            return (false, "Shërbimi AI nuk është i disponueshëm.", null);
        }
    }

    public async Task<(bool, string?, List<MissionAnalysis>?)> GetRecentAnomaliesAsync(int days = 14)
    {
        var cached = await _cache.StringGetAsync(RecentAnomaliesCacheKey);
        if (cached.HasValue)
        {
            var data = JsonSerializer.Deserialize<List<MissionAnalysis>>(
                cached.ToString(), JsonOptions);
            if (data != null) return (true, null, data);
        }

        try
        {
            var response = await _http.GetAsync($"/anomalies/recent?days={days}");

            if (!response.IsSuccessStatusCode)
                return (false, "Shërbimi AI nuk u përgjigj.", null);

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<List<MissionAnalysis>>(json, JsonOptions);

            if (result == null)
                return (false, "Përgjigje e pavlefshme nga shërbimi AI.", null);

            await _cache.StringSetAsync(RecentAnomaliesCacheKey, json, _cacheTtl);
            return (true, null, result);
        }
        catch (TaskCanceledException)
        {
            return (false, "Analiza po merr shumë kohë.", null);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Cannot reach AI service");
            return (false, "Shërbimi AI nuk është i disponueshëm.", null);
        }
    }
}