using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;

namespace SmartFleet.Api.Controllers
{
    [Route("api/v1/flight-zones")]
    [ApiController]
    public class FlightZonesController : ControllerBase
    {
        private readonly IFlightZoneService _service;

        public FlightZonesController(IFlightZoneService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? zoneType)
            => Ok(await _service.GetAllAsync(zoneType));

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var zone = await _service.GetByIdAsync(id);
            return zone == null ? NotFound(new { error = "Flight zone not found." }) : Ok(zone);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> Create(CreateFlightZoneRequest request)
        {
            var (success, error, id) = await _service.CreateAsync(request);
            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id })
                : BadRequest(new { error });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> Update(Guid id, UpdateFlightZoneRequest request)
        {
            var (success, error) = await _service.UpdateAsync(id, request);
            return success ? NoContent() : BadRequest(new { error });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var (success, error) = await _service.DeleteAsync(id);
            return success ? NoContent() : BadRequest(new { error });
        }
    }
}
