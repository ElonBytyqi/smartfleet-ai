using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SmartFleet.Application;
using SmartFleet.Application.Services;

namespace SmartFleet.Infrastructure.Services;

public class AlertCleanupService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<AlertCleanupService> _logger;

    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(2);
   

    public AlertCleanupService(IServiceProvider services, ILogger<AlertCleanupService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken token)
    {
        while (!token.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var alerts = scope.ServiceProvider.GetRequiredService<IAlertService>();
                var settings = scope.ServiceProvider.GetRequiredService<ISettingsService>();

                var minutes = settings.GetInt(SettingKeys.AlertAutoResolveMinutes, 5);
                var closed = await alerts.AutoResolveStaleAsync(TimeSpan.FromMinutes(minutes));

                if (closed > 0)
                    _logger.LogInformation("U mbyllën {Count} alarme të vjetruara.", closed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Pastrimi i alarmeve dështoi.");
            }

            await Task.Delay(Interval, token);
        }
    }
}