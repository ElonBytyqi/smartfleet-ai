using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;

namespace SmartFleet.Api.Controllers
{
    [Route("api/v1/pilots")]
    [ApiController]
    public class PilotsController : ControllerBase
    {
        private readonly IPilotService _service;

        public PilotsController(IPilotService service)
        {
            _service = service;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,FleetManager,Operator")]
        public async Task<IActionResult> GetAll()
            => Ok(await _service.GetAllAsync());

        // Duhet PARA {id:guid} që route-i të mos ngatërrohet
        [HttpGet("certifications/expiring")]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> GetExpiring([FromQuery] int days = 30)
            => Ok(await _service.GetExpiringCertificationsAsync(days));

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var pilot = await _service.GetByIdAsync(id);
            return pilot == null ? NotFound(new { error = "Pilot not found." }) : Ok(pilot);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create(CreatePilotRequest request)
        {
            var (success, error, id) = await _service.CreateAsync(request);
            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id })
                : BadRequest(new { error });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> Update(Guid id, UpdatePilotRequest request)
        {
            var (success, error) = await _service.UpdateAsync(id, request);
            return success ? NoContent() : BadRequest(new { error });
        }

        // ===== Certifications (nested nën pilot) =====

        [HttpGet("{id:guid}/certifications")]
        public async Task<IActionResult> GetCertifications(Guid id)
            => Ok(await _service.GetCertificationsAsync(id));

        [HttpPost("{id:guid}/certifications")]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> AddCertification(Guid id, CreateCertificationRequest request)
        {
            var (success, error, certId) = await _service.AddCertificationAsync(id, request);
            return success ? Ok(new { id = certId }) : BadRequest(new { error });
        }

        [HttpPut("{id:guid}/certifications/{certId:guid}")]
        [Authorize(Roles = "Admin,FleetManager")]
        public async Task<IActionResult> UpdateCertification(Guid id, Guid certId, UpdateCertificationRequest request)
        {
            var (success, error) = await _service.UpdateCertificationAsync(id, certId, request);
            return success ? NoContent() : BadRequest(new { error });
        }

        [HttpDelete("{id:guid}/certifications/{certId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCertification(Guid id, Guid certId)
        {
            var (success, error) = await _service.DeleteCertificationAsync(id, certId);
            return success ? NoContent() : NotFound(new { error });
        }
    
    }
}
