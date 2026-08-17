using Microsoft.Extensions.Configuration;
using MongoDB.Driver;

namespace SmartFleet.Infrastructure.Telemetry;

public class TelemetryDbContext
{
    public IMongoCollection<TelemetryPoint> TelemetryPoints { get; }

    public TelemetryDbContext(IConfiguration configuration)
    {
        var client = new MongoClient(configuration["MongoDb:ConnectionString"]);
        var database = client.GetDatabase(configuration["MongoDb:DatabaseName"]);

        TelemetryPoints = database.GetCollection<TelemetryPoint>("telemetry");

        EnsureIndexes();
    }

    // Indekset e bejne query-n sipas dronit dhe kohes te shpejte
    private void EnsureIndexes()
    {
        var byDroneAndTime = Builders<TelemetryPoint>.IndexKeys
            .Ascending(t => t.DroneId)
            .Descending(t => t.Timestamp);

        var byMission = Builders<TelemetryPoint>.IndexKeys
            .Ascending(t => t.MissionId)
            .Ascending(t => t.Timestamp);

        TelemetryPoints.Indexes.CreateMany(new[]
        {
            new CreateIndexModel<TelemetryPoint>(byDroneAndTime),
            new CreateIndexModel<TelemetryPoint>(byMission)
        });
    }
}