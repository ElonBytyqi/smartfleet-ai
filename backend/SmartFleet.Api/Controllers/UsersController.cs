using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;

namespace SmartFleet.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;

    public UsersController(IUserService service)
    {
        _service = service;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? role)
        => Ok(await _service.GetAllAsync(role));

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
        => Ok(await _service.GetRolesAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var user = await _service.GetByIdAsync(id);
        return user == null ? NotFound(new { error = "User not found." }) : Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserRequest request)
    {
        var (success, error, id) = await _service.CreateAsync(request);
        return success
            ? CreatedAtAction(nameof(GetById), new { id }, new { id })
            : BadRequest(new { error });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateUserRequest request)
    {
        var (success, error) = await _service.UpdateAsync(id, request);
        return success ? NoContent() : BadRequest(new { error });
    }

    [HttpPut("{id:guid}/roles")]
    public async Task<IActionResult> UpdateRoles(Guid id, UpdateUserRolesRequest request)
    {
        var (success, error) = await _service.UpdateRolesAsync(id, request);
        return success ? NoContent() : BadRequest(new { error });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] bool isActive)
    {
        var (success, error) = await _service.SetActiveAsync(id, isActive, CurrentUserId);
        return success ? NoContent() : BadRequest(new { error });
    }
}