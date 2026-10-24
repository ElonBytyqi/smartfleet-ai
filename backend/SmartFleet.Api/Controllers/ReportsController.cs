using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;

namespace SmartFleet.Api.Controllers;

[ApiController]
[Route("api/v1/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reports;

    public ReportsController(IReportService reports) => _reports = reports;

    [HttpGet("{type}")]
    public async Task<ActionResult<ReportResult>> Get(
        ReportType type, [FromQuery] ReportFilter filter)
        => Ok(await _reports.BuildAsync(type, filter));

    [HttpGet("{type}/excel")]
    public async Task<IActionResult> Excel(ReportType type, [FromQuery] ReportFilter filter)
    {
        var bytes = await _reports.ToExcelAsync(type, filter);
        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"smartfleet-{type.ToString().ToLower()}-{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }

    [HttpGet("{type}/pdf")]
    public async Task<IActionResult> Pdf(ReportType type, [FromQuery] ReportFilter filter)
    {
        var bytes = await _reports.ToPdfAsync(type, filter);
        return File(bytes, "application/pdf",
            $"smartfleet-{type.ToString().ToLower()}-{DateTime.UtcNow:yyyyMMdd}.pdf");
    }
}