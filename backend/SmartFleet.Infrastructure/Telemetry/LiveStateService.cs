using System.Text.Json;
using Microsoft.Extensions.Configuration;
using StackExchange.Redis;

namespace SmartFleet.Infrastructure.Telemetry;

public interface ILiveStateService
{
    Task SetLastPositionAsync(Guid droneId, TelemetryPoint point);
    Task<TelemetryPoint?> GetLastPositionAsync(Guid droneId);
    Task<List<TelemetryPoint>> GetAllLastPositionsAsync();
    Task RemoveAsync(Guid droneId);
}

public class LiveStateService : ILiveStateService
{
    private readonly IDatabase _redis;
    private readonly IServer _server;

    private const string KeyPrefix = "drone:live:";
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(10);

    public LiveStateService(IConnectionMultiplexer connection)
    {
        _redis = connection.GetDatabase();
        _server = connection.GetServer(connection.GetEndPoints().First());
    }

    public async Task SetLastPositionAsync(Guid droneId, TelemetryPoint point)
    {
        // TTL: nese droni hesht 10 minuta, konsiderohet offline
        await _redis.StringSetAsync(
            $"{KeyPrefix}{droneId}",
            JsonSerializer.Serialize(point),
            Ttl);
    }

    public async Task<TelemetryPoint?> GetLastPositionAsync(Guid droneId)
    {
        var value = await _redis.StringGetAsync($"{KeyPrefix}{droneId}");
        return value.HasValue
            ? JsonSerializer.Deserialize<TelemetryPoint>(value.ToString())
            : null;
    }

    public async Task<List<TelemetryPoint>> GetAllLastPositionsAsync()
    {
        var result = new List<TelemetryPoint>();

        foreach (var key in _server.Keys(pattern: $"{KeyPrefix}*"))
        {
            var value = await _redis.StringGetAsync(key);
            if (!value.HasValue) continue;

            var point = JsonSerializer.Deserialize<TelemetryPoint>(value.ToString());
            if (point != null) result.Add(point);
        }

        return result;
    }

    public async Task RemoveAsync(Guid droneId)
        => await _redis.KeyDeleteAsync($"{KeyPrefix}{droneId}");
}