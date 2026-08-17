using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using SmartFleet.Infrastructure.Telemetry;

namespace SmartFleet.Api.Controllers;

[ApiController]
[Route("api/v1/health")]
[AllowAnonymous]
public class HealthController : ControllerBase
{
    private readonly TelemetryDbContext _mongo;
    private readonly ILiveStateService _live;

    public HealthController(TelemetryDbContext mongo, ILiveStateService live)
    {
        _mongo = mongo;
        _live = live;
    }

    [HttpGet]
    public async Task<IActionResult> Check()
    {
        var mongoOk = false;
        var redisOk = false;
        string? error = null;

        try
        {
            await _mongo.TelemetryPoints.CountDocumentsAsync(FilterDefinition<TelemetryPoint>.Empty);
            mongoOk = true;
        }
        catch (Exception ex) { error = ex.Message; }

        try
        {
            await _live.GetAllLastPositionsAsync();
            redisOk = true;
        }
        catch (Exception ex) { error ??= ex.Message; }

        return Ok(new { mongo = mongoOk, redis = redisOk, error });
    }
}