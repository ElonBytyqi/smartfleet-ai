using Microsoft.EntityFrameworkCore;
using SmartFleet.Application.DTOs;

namespace SmartFleet.Infrastructure.Persistence;

public static class QueryExtensions
{
    /// <summary>
    /// Ekzekuton query-n me paginim dhe kthen rezultatin bashkë me numërimin total.
    /// </summary>
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query,
        PageRequest paging,
        CancellationToken token = default)
    {
        var total = await query.CountAsync(token);

        var items = await query
            .Skip(paging.Skip)
            .Take(paging.PageSize)
            .ToListAsync(token);

        var page = Math.Max(1, paging.Page);

        return new PagedResult<T>(
            items,
            page,
            paging.PageSize,
            total,
            (int)Math.Ceiling(total / (double)paging.PageSize));
    }
}