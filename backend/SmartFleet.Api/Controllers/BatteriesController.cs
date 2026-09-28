using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using static SmartFleet.Application.DTOs.BatteryDtos;

namespace SmartFleet.Api.Controllers
{

    [ApiController]
    [Route("api/v1/batteries")]
    [Authorize]
    public class BatteriesController : ControllerBase
    {
        private readonly IBatteryService _service;

        public BatteriesController(IBatteryService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
       [FromQuery] Guid? droneId,
       [FromQuery] string? status,
       [FromQuery] string? search,
       [FromQuery] PageRequest paging)
       => Ok(await _service.GetAllAsync(droneId, status, search, paging));

        /// <summary>Listë e plotë pa paginim — për dropdown-e.</summary>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllSimple([FromQuery] Guid? droneId)
        {
            var result = await _service.GetAllAsync(
                droneId: droneId,
                paging: new PageRequest { PageSize = 200 });
            return Ok(result.Items);
        }

        [HttpGet("needing-inspection")]
        [Authorize(Roles = "Admin,FleetManager,MaintenanceTechnician")]
        public async Task<IActionResult> GetNeedingInspection([FromQuery] decimal healthThreshold = 80)
            => Ok(await _service.GetNeedingInspectionAsync(healthThreshold));

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var battery = await _service.GetByIdAsync(id);
            return battery == null ? NotFound(new { error = "Battery not found." }) : Ok(battery);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> Create(CreateBatteryRequest request)
        {
            var (success, error, id) = await _service.CreateAsync(request);
            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id })
                : BadRequest(new { error });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin,FleetManager,MaintenanceTechnician")]
        public async Task<IActionResult> Update(Guid id, UpdateBatteryRequest request)
        {
            var (success, error) = await _service.UpdateAsync(id, request);
            return success ? NoContent() : BadRequest(new { error });
        }

        [HttpPatch("{id:guid}/status")]
        [Authorize(Roles = "Admin,FleetManager,MaintenanceTechnician")]
        public async Task<IActionResult> UpdateStatus(Guid id, UpdateBatteryStatusRequest request)
        {
            var (success, error) = await _service.UpdateStatusAsync(id, request);
            return success ? NoContent() : NotFound(new { error });
        }

        [HttpPost("{id:guid}/assign")]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> Assign(Guid id, AssignBatteryRequest request)
        {
            var (success, error) = await _service.AssignToDroneAsync(id, request);
            return success ? NoContent() : BadRequest(new { error });
        }
    }

}
