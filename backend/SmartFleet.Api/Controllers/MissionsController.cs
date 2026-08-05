using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using System.Security.Claims;

namespace SmartFleet.Api.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class MissionsController : ControllerBase
    {
        private readonly IMissionService _service;

        public MissionsController(IMissionService service)
        {
            _service = service;
        }

        // Merr Id-ne e userit te loguar nga claims e JWT-se
        private Guid CurrentUserId =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? status, [FromQuery] Guid? droneId, [FromQuery] Guid? pilotId)
            => Ok(await _service.GetAllAsync(status, droneId, pilotId));

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var mission = await _service.GetByIdAsync(id);
            return mission == null ? NotFound(new { error = "Mission not found." }) : Ok(mission);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,FleetManager,Operator")]
        public async Task<IActionResult> Create(CreateMissionRequest request)
        {
            var (success, error, id) = await _service.CreateAsync(request, CurrentUserId);
            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id })
                : BadRequest(new { error });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin,FleetManager,Operator")]
        public async Task<IActionResult> Update(Guid id, UpdateMissionRequest request)
        {
            var (success, error) = await _service.UpdateAsync(id, request);
            return success ? NoContent() : BadRequest(new { error });
        }

        [HttpPost("{id:guid}/assign")]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> Assign(Guid id, AssignResourcesRequest request)
        {
            var (success, error) = await _service.AssignResourcesAsync(id, request);
            return success ? NoContent() : BadRequest(new { error });
        }

        [HttpGet("{id:guid}/conflicts")]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> Conflicts(Guid id)
            => Ok(await _service.CheckConflictsAsync(id));

        [HttpPost("{id:guid}/approve")]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> Approve(Guid id)
        {
            var (success, error) = await _service.ApproveAsync(id, CurrentUserId);
            return success ? NoContent() : BadRequest(new { error });
        }

        [HttpPost("{id:guid}/cancel")]
        [Authorize(Roles = "Admin,FleetManager,Operator")]
        public async Task<IActionResult> Cancel(Guid id)
        {
            var (success, error) = await _service.CancelAsync(id);
            return success ? NoContent() : BadRequest(new { error });
        }

        [HttpPost("{id:guid}/start")]
        [Authorize(Roles = "Admin,FleetManager,Pilot")]
        public async Task<IActionResult> Start(Guid id)
        {
            var (success, error) = await _service.StartAsync(id);
            return success ? NoContent() : BadRequest(new { error });
        }

        [HttpPost("{id:guid}/complete")]
        [Authorize(Roles = "Admin,FleetManager,Pilot")]
        public async Task<IActionResult> Complete(Guid id)
        {
            var (success, error) = await _service.CompleteAsync(id);
            return success ? NoContent() : BadRequest(new { error });
        }

        [HttpPost("{id:guid}/abort")]
        [Authorize(Roles = "Admin,FleetManager,Pilot")]
        public async Task<IActionResult> Abort(Guid id)
        {
            var (success, error) = await _service.AbortAsync(id);
            return success ? NoContent() : BadRequest(new { error });
        }

        [HttpGet("{id:guid}/waypoints")]
        public async Task<IActionResult> GetWaypoints(Guid id)
            => Ok(await _service.GetWaypointsAsync(id));

        [HttpPut("{id:guid}/waypoints")]
        [Authorize(Roles = "Admin,FleetManager,Operator")]
        public async Task<IActionResult> ReplaceWaypoints(Guid id, List<WaypointRequest> waypoints)
        {
            var (success, error) = await _service.ReplaceWaypointsAsync(id, waypoints);
            return success ? NoContent() : BadRequest(new { error });
        }
    }
}
