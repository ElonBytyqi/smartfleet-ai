using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SmartFleet.Api.Hubs;

[Authorize]
public class TelemetryHub : Hub
{
    // Klienti mund te degjoje vetem nje dron te caktuar
    public async Task SubscribeToDrone(string droneId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"drone:{droneId}");

    public async Task UnsubscribeFromDrone(string droneId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"drone:{droneId}");

    // Ose tere floten — perdoret nga faqja e live tracking
    public async Task SubscribeToFleet()
        => await Groups.AddToGroupAsync(Context.ConnectionId, "fleet");

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "fleet");
        await base.OnConnectedAsync();
    }
}