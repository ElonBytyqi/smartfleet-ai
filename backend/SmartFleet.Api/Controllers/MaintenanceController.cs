using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;

namespace SmartFleet.Api.Controllers;

[ApiController]
[Route("api/v1/maintenance")]
[Authorize]
public class MaintenanceController : ControllerBase
{
    private readonly IMaintenanceService _service;

    public MaintenanceController(IMaintenanceService service)
    {
        _service = service;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? droneId, [FromQuery] string? status)
        => Ok(await _service.GetAllAsync(droneId, status));

    [HttpGet("upcoming")]
    [Authorize(Roles = "Admin,FleetManager,MaintenanceTechnician")]
    public async Task<IActionResult> GetUpcoming([FromQuery] int days = 30)
        => Ok(await _service.GetUpcomingAsync(days));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var record = await _service.GetByIdAsync(id);
        return record == null
            ? NotFound(new { error = "Maintenance record not found." })
            : Ok(record);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,FleetManager,MaintenanceTechnician")]
    public async Task<IActionResult> Create(CreateMaintenanceRequest request)
    {
        var (success, error, id) = await _service.CreateAsync(request, CurrentUserId);
        return success
            ? CreatedAtAction(nameof(GetById), new { id }, new { id })
            : BadRequest(new { error });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,FleetManager,MaintenanceTechnician")]
    public async Task<IActionResult> Update(Guid id, UpdateMaintenanceRequest request)
    {
        var (success, error) = await _service.UpdateAsync(id, request);
        return success ? NoContent() : BadRequest(new { error });
    }

    [HttpPost("{id:guid}/start")]
    [Authorize(Roles = "Admin,FleetManager,MaintenanceTechnician")]
    public async Task<IActionResult> Start(Guid id)
    {
        var (success, error) = await _service.StartAsync(id);
        return success ? NoContent() : BadRequest(new { error });
    }

    [HttpPost("{id:guid}/complete")]
    [Authorize(Roles = "Admin,FleetManager,MaintenanceTechnician")]
    public async Task<IActionResult> Complete(Guid id, CompleteMaintenanceRequest request)
    {
        var (success, error) = await _service.CompleteAsync(id, request);
        return success ? NoContent() : BadRequest(new { error });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,FleetManager")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var (success, error) = await _service.CancelAsync(id);
        return success ? NoContent() : BadRequest(new { error });
    }

    // ===== Komponentët =====

    [HttpGet("/api/v1/drones/{droneId:guid}/components")]
    public async Task<IActionResult> GetComponents(Guid droneId)
        => Ok(await _service.GetComponentsAsync(droneId));

    [HttpPost("/api/v1/drones/{droneId:guid}/components")]
    [Authorize(Roles = "Admin,FleetManager,MaintenanceTechnician")]
    public async Task<IActionResult> AddComponent(Guid droneId, CreateComponentRequest request)
    {
        var (success, error, id) = await _service.AddComponentAsync(droneId, request);
        return success ? Ok(new { id }) : BadRequest(new { error });
    }

    [HttpPut("/api/v1/drones/{droneId:guid}/components/{componentId:guid}")]
    [Authorize(Roles = "Admin,FleetManager,MaintenanceTechnician")]
    public async Task<IActionResult> UpdateComponent(
        Guid droneId, Guid componentId, UpdateComponentRequest request)
    {
        var (success, error) = await _service.UpdateComponentAsync(droneId, componentId, request);
        return success ? NoContent() : BadRequest(new { error });
    }
}