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


    [HttpGet("anomalies/missions/{missionId:guid}")]
    public async Task<IActionResult> MissionAnomalies(Guid missionId, [FromQuery] bool refresh = false)
    {
        var (success, error, data) = await _ai.GetMissionAnalysisAsync(missionId, refresh);
        return success ? Ok(data) : StatusCode(503, new { error });
    }

    [HttpGet("anomalies/recent")]
    [Authorize(Roles = "Admin,FleetManager,MaintenanceTechnician")]
    public async Task<IActionResult> RecentAnomalies([FromQuery] int days = 14)
    {
        var (success, error, data) = await _ai.GetRecentAnomaliesAsync(days);
        return success ? Ok(data) : StatusCode(503, new { error });
    }


    [HttpGet("reports/{reportId:guid}/analysis")]
    public async Task<IActionResult> ReportAnalysis(Guid reportId)
    {
        var (success, error, data) = await _ai.GetReportAnalysisAsync(reportId);
        return success ? Ok(data) : StatusCode(503, new { error });
    }

    [HttpPost("reports/analyze-pending")]
    [Authorize(Roles = "Admin,FleetManager")]
    public async Task<IActionResult> AnalyzePending()
    {
        var (success, error, data) = await _ai.AnalyzePendingReportsAsync();
        return success ? Ok(data) : StatusCode(503, new { error });
    }

}