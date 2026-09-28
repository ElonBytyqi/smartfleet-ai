namespace SmartFleet.Application.DTOs;

/// <summary>Parametrat e paginimit që vijnë nga query string.</summary>
public record PageRequest
{
    private const int MaxPageSize = 200;

    public int Page { get; init; } = 1;

    private int _pageSize = 25;
    public int PageSize
    {
        get => _pageSize;
        init => _pageSize = Math.Clamp(value, 1, MaxPageSize);
    }

    public int Skip => (Math.Max(1, Page) - 1) * PageSize;
}