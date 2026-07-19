using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;

namespace SmartFleet.Api.Controllers
{
    [ApiController]
    [Route("api/v1/drones")]
    [Authorize]
    public class DronesController : Controller
    {



        private readonly IDroneService _droneService;

        public DronesController(IDroneService droneService)
        {
            _droneService = droneService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
            => Ok(await _droneService.GetAllAsync());

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var drone = await _droneService.GetByIdAsync(id);
            return drone == null ? NotFound(new { error = "Drone not found." }) : Ok(drone);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> Create(CreateDroneRequest request)
        {
            var (success, error, id) = await _droneService.CreateAsync(request);
            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id })
                : BadRequest(new { error });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> Update(Guid id, UpdateDroneRequest request)
        {
            var (success, error) = await _droneService.UpdateAsync(id, request);
            return success ? NoContent() : NotFound(new { error });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var (success, error) = await _droneService.DeleteAsync(id);
            return success ? NoContent() : NotFound(new { error });
        }
    }
}
