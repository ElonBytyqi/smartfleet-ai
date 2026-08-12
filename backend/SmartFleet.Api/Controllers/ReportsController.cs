using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.Services;

namespace SmartFleet.Api.Controllers;

[ApiController]
[Route("api/v1/flight-reports")]
[Authorize]
public class FlightReportsController : ControllerBase
{
    private readonly IFlightRecordService _service;

    public FlightReportsController(IFlightRecordService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? droneId, [FromQuery] string? aiStatus)
        => Ok(await _service.GetReportsAsync(droneId, aiStatus));
}