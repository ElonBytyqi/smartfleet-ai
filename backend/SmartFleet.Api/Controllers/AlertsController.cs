using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;

namespace SmartFleet.Api.Controllers;

[ApiController]
[Route("api/v1/alerts")]
[Authorize]
public class AlertsController : ControllerBase
{
    private readonly IAlertService _service;

    public AlertsController(IAlertService service)
    {
        _service = service;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] AlertFilter filter,
        [FromQuery] PageRequest paging)
        => Ok(await _service.GetAsync(filter, paging));

    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
        => Ok(await _service.GetSummaryAsync());

    [HttpGet("active")]
    public async Task<IActionResult> Active([FromQuery] int limit = 20)
        => Ok(await _service.GetActiveAsync(limit));

    [HttpPost]
    [Authorize(Roles = "Admin,FleetManager,Operator")]
    public async Task<IActionResult> Raise(RaiseAlertRequest request)
    {
        var (success, error, id) = await _service.RaiseAsync(request);
        return success ? Ok(new { id }) : BadRequest(new { error });
    }

    [HttpPost("{id:guid}/acknowledge")]
    public async Task<IActionResult> Acknowledge(Guid id, AcknowledgeAlertRequest request)
    {
        var (success, error) = await _service.AcknowledgeAsync(id, CurrentUserId, request.Note);
        return success ? NoContent() : BadRequest(new { error });
    }

    [HttpPost("{id:guid}/resolve")]
    public async Task<IActionResult> Resolve(Guid id, ResolveAlertRequest request)
    {
        var (success, error) = await _service.ResolveAsync(id, CurrentUserId, request.Note);
        return success ? NoContent() : BadRequest(new { error });
    }
}