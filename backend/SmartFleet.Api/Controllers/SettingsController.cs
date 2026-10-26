using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;

namespace SmartFleet.Api.Controllers;

[ApiController]
[Route("api/v1/settings")]
[Authorize(Roles = "Admin,FleetManager")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settings;

    public SettingsController(ISettingsService settings) => _settings = settings;

    [HttpGet]
    public async Task<ActionResult<List<SettingGroup>>> Get()
        => Ok(await _settings.GetAllAsync());

    [HttpPut("{key}")]
    public async Task<IActionResult> Update(string key, UpdateSettingRequest request)
    {
        var (ok, error) = await _settings.UpdateAsync(key, request.Value);
        return ok ? NoContent() : BadRequest(new { error });
    }

    [HttpPut]
    public async Task<IActionResult> UpdateMany(UpdateSettingsRequest request)
    {
        var (ok, error) = await _settings.UpdateManyAsync(request.Values);
        return ok ? NoContent() : BadRequest(new { error });
    }

    [HttpPost("{key}/reset")]
    public async Task<IActionResult> Reset(string key)
    {
        var (ok, error) = await _settings.ResetAsync(key);
        return ok ? NoContent() : BadRequest(new { error });
    }
}