using Microsoft.AspNetCore.SignalR;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;

namespace SmartFleet.Api.Hubs;

public class TelemetryBroadcaster : ITelemetryBroadcaster
{
    private readonly IHubContext<TelemetryHub> _hub;

    public TelemetryBroadcaster(IHubContext<TelemetryHub> hub)
    {
        _hub = hub;
    }

    public async Task BroadcastAsync(LiveDroneResponse telemetry)
    {
        // Te gjithe qe shohin harten
        await _hub.Clients.Group("fleet")
            .SendAsync("TelemetryUpdate", telemetry);

        // Te ata qe ndjekin kete dron specifik
        await _hub.Clients.Group($"drone:{telemetry.DroneId}")
            .SendAsync("TelemetryUpdate", telemetry);
    }
}