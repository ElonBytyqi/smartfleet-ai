namespace SmartFleet.Application.DTOs;

public record CreateUserRequest(
    string FullName,
    string Email,
    string Password,
    string Role,
    string? PhoneNumber);

public record UpdateUserRequest(
    string FullName,
    string? PhoneNumber);

public record UpdateUserRolesRequest(List<string> Roles);

public record UserResponse(
    Guid Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    bool IsActive,
    List<string> Roles,
    bool HasPilotProfile,
    DateTime CreatedAt);