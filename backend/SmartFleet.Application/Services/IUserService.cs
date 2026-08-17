using SmartFleet.Application.DTOs;

namespace SmartFleet.Application.Services;

public interface IUserService
{
    Task<List<UserResponse>> GetAllAsync(string? role = null);
    Task<UserResponse?> GetByIdAsync(Guid id);
    Task<List<string>> GetRolesAsync();

    Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreateUserRequest request);
    Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateUserRequest request);
    Task<(bool Success, string? Error)> UpdateRolesAsync(Guid id, UpdateUserRolesRequest request);
    Task<(bool Success, string? Error)> SetActiveAsync(Guid id, bool isActive, Guid currentUserId);
}