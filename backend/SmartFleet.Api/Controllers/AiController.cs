using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.Services;

namespace SmartFleet.Api.Controllers;

[ApiController]
[Route("api/v1/ai")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly IAiService _ai;

    public AiController(IAiService ai)
    {
        _ai = ai;
    }

    [HttpGet("health")]
    public async Task<IActionResult> Health()
        => Ok(new { available = await _ai.IsHealthyAsync() });

    [HttpGet("predictive/fleet")]
    [Authorize(Roles = "Admin,FleetManager,MaintenanceTechnician")]
    public async Task<IActionResult> FleetRisk([FromQuery] bool refresh = false)
    {
        var (success, error, data) = await _ai.GetFleetRiskAsync(refresh);
        return success ? Ok(data) : StatusCode(503, new { error });
    }

    [HttpGet("predictive/drones/{droneId:guid}")]
    [Authorize(Roles = "Admin,FleetManager,MaintenanceTechnician")]
    public async Task<IActionResult> DroneRisk(Guid droneId, [FromQuery] bool refresh = false)
    {
        var (success, error, data) = await _ai.GetDroneRiskAsync(droneId, refresh);
        return success ? Ok(data) : StatusCode(503, new { error });
    }
}