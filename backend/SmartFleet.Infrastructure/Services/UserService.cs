using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Domain.Entities;
using SmartFleet.Infrastructure.Identity;
using SmartFleet.Infrastructure.Persistence;

namespace SmartFleet.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly ApplicationDbContext _db;

    public UserService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        ApplicationDbContext db)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _db = db;
    }

    public async Task<List<string>> GetRolesAsync()
        => await _roleManager.Roles
            .Where(r => r.Name != null)
            .Select(r => r.Name!)
            .OrderBy(n => n)
            .ToListAsync();

    public async Task<List<UserResponse>> GetAllAsync(string? role = null)
    {
        var users = await _userManager.Users.OrderBy(u => u.FullName).ToListAsync();
        var pilotUserIds = await _db.Pilots.Select(p => p.UserId).ToListAsync();

        var result = new List<UserResponse>();

        foreach (var u in users)
        {
            var roles = (await _userManager.GetRolesAsync(u)).ToList();

            if (!string.IsNullOrWhiteSpace(role) && !roles.Contains(role))
                continue;

            result.Add(new UserResponse(
                u.Id, u.FullName, u.Email ?? "", u.PhoneNumber,
                u.IsActive, roles, pilotUserIds.Contains(u.Id), u.CreatedAt));
        }

        return result;
    }

    public async Task<UserResponse?> GetByIdAsync(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return null;

        var roles = (await _userManager.GetRolesAsync(user)).ToList();
        var hasPilot = await _db.Pilots.AnyAsync(p => p.UserId == id);

        return new UserResponse(
            user.Id, user.FullName, user.Email ?? "", user.PhoneNumber,
            user.IsActive, roles, hasPilot, user.CreatedAt);
    }

    public async Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreateUserRequest request)
    {
        if (await _userManager.FindByEmailAsync(request.Email) != null)
            return (false, "This email is already registered.", null);

        if (!await _roleManager.RoleExistsAsync(request.Role))
            return (false, "Role does not exist.", null);

        if (string.IsNullOrWhiteSpace(request.FullName))
            return (false, "Full name is required.", null);

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return (false, string.Join(" ", result.Errors.Select(e => e.Description)), null);

        await _userManager.AddToRoleAsync(user, request.Role);

        // Roli Pilot merr automatikisht profilin profesional
        if (request.Role == "Pilot")
        {
            _db.Pilots.Add(new Pilot { UserId = user.Id });
            await _db.SaveChangesAsync();
        }

        return (true, null, user.Id);
    }

    public async Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return (false, "User not found.");

        if (string.IsNullOrWhiteSpace(request.FullName))
            return (false, "Full name is required.");

        user.FullName = request.FullName;
        user.PhoneNumber = request.PhoneNumber;
        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded
            ? (true, null)
            : (false, string.Join(" ", result.Errors.Select(e => e.Description)));
    }

    public async Task<(bool Success, string? Error)> UpdateRolesAsync(
        Guid id, UpdateUserRolesRequest request)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return (false, "User not found.");

        if (request.Roles.Count == 0)
            return (false, "At least one role is required.");

        foreach (var r in request.Roles)
            if (!await _roleManager.RoleExistsAsync(r))
                return (false, $"Role '{r}' does not exist.");

        var current = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, current);
        await _userManager.AddToRolesAsync(user, request.Roles);

        // Krijo profilin e pilotit nese roli sapo u shtua
        if (request.Roles.Contains("Pilot") && !await _db.Pilots.AnyAsync(p => p.UserId == id))
        {
            _db.Pilots.Add(new Pilot { UserId = id });
            await _db.SaveChangesAsync();
        }

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> SetActiveAsync(
        Guid id, bool isActive, Guid currentUserId)
    {
        if (id == currentUserId && !isActive)
            return (false, "You cannot deactivate your own account.");

        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return (false, "User not found.");

        // Nuk lejohet te mbetet sistemi pa asnje admin aktiv
        if (!isActive && await _userManager.IsInRoleAsync(user, "Admin"))
        {
            var admins = await _userManager.GetUsersInRoleAsync("Admin");
            if (admins.Count(a => a.IsActive) <= 1)
                return (false, "At least one active administrator must remain.");
        }

        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return (true, null);
    }
}