using SmartFleet.Application.DTOs;

namespace SmartFleet.Application.Services;

public interface ITelemetryBroadcaster
{
    Task BroadcastAsync(LiveDroneResponse telemetry);
}