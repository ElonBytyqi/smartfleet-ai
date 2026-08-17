using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;

namespace SmartFleet.Api.Controllers;

[ApiController]
[Route("api/v1/telemetry")]
[Authorize]
public class TelemetryController : ControllerBase
{
    private readonly ITelemetryService _service;

    public TelemetryController(ITelemetryService service)
    {
        _service = service;
    }

    // Pika hyrese — ketu shkruan ura Python
    [HttpPost("ingest")]
    [AllowAnonymous]   // do te mbrohet me API key ne hapin 5.3
    public async Task<IActionResult> Ingest(IngestTelemetryRequest request)
    {
        var (success, error) = await _service.IngestAsync(request);
        return success ? Accepted() : BadRequest(new { error });
    }

    [HttpGet("live")]
    public async Task<IActionResult> GetLiveFleet()
        => Ok(await _service.GetLiveFleetAsync());

    [HttpGet("live/{droneId:guid}")]
    public async Task<IActionResult> GetLiveDrone(Guid droneId)
    {
        var drone = await _service.GetLiveDroneAsync(droneId);
        return drone == null
            ? NotFound(new { error = "No live telemetry for this drone." })
            : Ok(drone);
    }

    [HttpGet("missions/{missionId:guid}/track")]
    public async Task<IActionResult> GetMissionTrack(
        Guid missionId, [FromQuery] int maxPoints = 500)
        => Ok(await _service.GetMissionTrackAsync(missionId, maxPoints));

    [HttpGet("drones/{droneId:guid}/history")]
    public async Task<IActionResult> GetDroneHistory(
        Guid droneId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(await _service.GetDroneHistoryAsync(
            droneId,
            from ?? DateTime.UtcNow.AddHours(-24),
            to ?? DateTime.UtcNow));
}