using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;

namespace SmartFleet.Api.Controllers
{
    [ApiController]
    [Route("api/v1/drone-models")]
    [Authorize]
    public class DroneModelsController : ControllerBase
    {
        private readonly IDroneModelService _service;

        public DroneModelsController(IDroneModelService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
            => Ok(await _service.GetAllAsync());

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var model = await _service.GetByIdAsync(id);
            return model == null ? NotFound(new { error = "Drone model not found." }) : Ok(model);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(CreateDroneModelRequest request)
        {
            var (success, error, id) = await _service.CreateAsync(request);
            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id })
                : Conflict(new { error });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, UpdateDroneModelRequest request)
        {
            var (success, error) = await _service.UpdateAsync(id, request);
            return success ? NoContent() : NotFound(new { error });
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
