using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartFleet.Domain.Entites;
using SmartFleet.Domain.Entities;
using SmartFleet.Infrastructure.Identity;
using SmartFleet.Infrastructure.Persistence;

namespace SmartFleet.Infrastructure.Seed;

public static class DataSeeder
{
    private static readonly string[] Roles =
    {
        "Admin", "FleetManager", "Pilot", "MaintenanceTechnician", "Operator"
    };

    // Fara fikse — te njejtat te dhena sa here qe rigjenerohet
    private static readonly Random Rng = new(42);

    public static async Task SeedRolesAsync(RoleManager<IdentityRole<Guid>> roleManager)
    {
        foreach (var roleName in Roles)
            if (!await roleManager.RoleExistsAsync(roleName))
                await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
    }

    public static async Task SeedAdminUserAsync(UserManager<ApplicationUser> userManager)
    {
        await CreateUserAsync(userManager, "admin@smartfleet.com", "System Administrator", "Admin");
        await CreateUserAsync(userManager, "manager@smartfleet.com", "Arben Krasniqi", "FleetManager");
        await CreateUserAsync(userManager, "operator@smartfleet.com", "Vlora Berisha", "Operator");
        await CreateUserAsync(userManager, "tech@smartfleet.com", "Fatmir Gashi", "MaintenanceTechnician");
    }

    private static async Task<ApplicationUser> CreateUserAsync(
        UserManager<ApplicationUser> userManager, string email, string fullName, string role)
    {
        var existing = await userManager.FindByEmailAsync(email);
        if (existing != null) return existing;

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, "Admin1234!");
        if (result.Succeeded)
            await userManager.AddToRoleAsync(user, role);

        return user;
    }

    public static async Task SeedFleetAsync(
        ApplicationDbContext db, UserManager<ApplicationUser> userManager)
    {
        if (await db.Drones.AnyAsync()) return;   // vetem nje here

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var admin = await userManager.FindByEmailAsync("admin@smartfleet.com");
        var adminId = admin?.Id ?? Guid.Empty;

        // ---------- Modelet ----------
        var models = new List<DroneModel>
        {
            new() { ManufacturerName = "DJI", ModelName = "Matrice 350 RTK",
                    MaxFlightTimeMinutes = 55, MaxPayloadKg = 2.7m, MaxSpeedKmh = 82m,
                    CameraSpecs = "Zenmuse H20 compatible" },
            new() { ManufacturerName = "DJI", ModelName = "Mavic 3 Enterprise",
                    MaxFlightTimeMinutes = 45, MaxPayloadKg = 0.5m, MaxSpeedKmh = 68m,
                    CameraSpecs = "4/3 CMOS, 20MP" },
            new() { ManufacturerName = "Autel", ModelName = "EVO Max 4T",
                    MaxFlightTimeMinutes = 42, MaxPayloadKg = 0.8m, MaxSpeedKmh = 65m,
                    CameraSpecs = "Thermal + wide + tele" },
            new() { ManufacturerName = "Parrot", ModelName = "Anafi USA",
                    MaxFlightTimeMinutes = 32, MaxPayloadKg = 0.3m, MaxSpeedKmh = 55m,
                    CameraSpecs = "32x zoom, thermal" },
        };
        db.DroneModels.AddRange(models);

        // ---------- Droneët ----------
        var nicknames = new[]
        {
            "Falcon", "Hawk", "Eagle", "Kestrel", "Osprey", "Harrier", "Merlin",
            "Condor", "Raven", "Swift", "Kite", "Buzzard", "Sparrow", "Heron",
            "Ibis", "Crane", "Egret", "Petrel", "Skua", "Tern"
        };

        var drones = new List<Drone>();
        for (var i = 0; i < 20; i++)
        {
            var model = models[i % models.Count];
            var status = i switch
            {
                < 12 => DroneStatus.Available,
                < 15 => DroneStatus.InMission,
                < 18 => DroneStatus.Maintenance,
                _ => DroneStatus.Grounded
            };

            drones.Add(new Drone
            {
                SerialNumber = $"{model.ManufacturerName.ToUpper()}-{2024 + i % 3}-{1000 + i:D4}",
                Nickname = nicknames[i],
                DroneModelId = model.Id,
                Status = status,
                TotalFlightHours = Math.Round((decimal)(Rng.NextDouble() * 480 + 12), 2),
                PurchaseDate = today.AddDays(-Rng.Next(120, 900))
            });
        }
        db.Drones.AddRange(drones);

        // ---------- Bateritë ----------
        var batteries = new List<Battery>();
        for (var i = 0; i < 24; i++)
        {
            var health = i switch
            {
                < 3 => Rng.Next(52, 68),     // per zevendesim
                < 8 => Rng.Next(70, 84),     // kujdes
                _ => Rng.Next(86, 100)       // ne rregull
            };

            var status = health < 65
                ? BatteryStatus.NeedsReplacement
                : i % 5 == 0 ? BatteryStatus.Charging : BatteryStatus.Available;

            batteries.Add(new Battery
            {
                SerialNumber = $"BAT-{2000 + i:D4}",
                DroneId = i < drones.Count ? drones[i].Id : null,
                CapacityMah = new[] { 5880, 5000, 4280, 3500 }[i % 4],
                CycleCount = Rng.Next(8, 340),
                HealthPercentage = health,
                Status = status,
                PurchaseDate = today.AddDays(-Rng.Next(60, 700)),
                LastInspectionDate = today.AddDays(-Rng.Next(5, 90))
            });
        }
        db.Batteries.AddRange(batteries);

        // ---------- Pilotët ----------
        var pilotNames = new[]
        {
            ("ardit@smartfleet.com", "Ardit Hoxha"),
            ("besa@smartfleet.com", "Besa Morina"),
            ("dritan@smartfleet.com", "Dritan Shala"),
            ("erza@smartfleet.com", "Erza Rexhepi"),
            ("gent@smartfleet.com", "Gent Bytyqi"),
            ("liridona@smartfleet.com", "Liridona Ahmeti"),
        };

        var pilots = new List<Pilot>();
        for (var i = 0; i < pilotNames.Length; i++)
        {
            var (email, name) = pilotNames[i];
            var user = await CreateUserAsync(userManager, email, name, "Pilot");

            pilots.Add(new Pilot
            {
                UserId = user.Id,
                LicenseNumber = $"XK-UAS-{2024}-{100 + i:D3}",
                TotalFlightHours = Math.Round((decimal)(Rng.NextDouble() * 700 + 40), 2),
                Status = i == 5 ? PilotStatus.Suspended : PilotStatus.Active
            });
        }
        db.Pilots.AddRange(pilots);

        // ---------- Certifikatat ----------
        var certTypes = new[]
        {
            ("EASA A2", "AAC Kosova"),
            ("EASA STS-01", "AAC Kosova"),
            ("Thermography Level 1", "ITC Europe"),
            ("BVLOS Operations", "EASA"),
        };

        var certs = new List<Certification>();
        for (var i = 0; i < pilots.Count; i++)
        {
            var count = Rng.Next(1, 4);
            for (var j = 0; j < count; j++)
            {
                var (type, issuer) = certTypes[(i + j) % certTypes.Length];

                // Disa skadojne se shpejti, nje ka skaduar
                var expiry = (i * 3 + j) switch
                {
                    0 => today.AddDays(-14),
                    1 => today.AddDays(11),
                    3 => today.AddDays(26),
                    6 => today.AddDays(41),
                    _ => today.AddDays(Rng.Next(120, 900))
                };

                certs.Add(new Certification
                {
                    PilotId = pilots[i].Id,
                    CertificationType = type,
                    IssuedBy = issuer,
                    IssueDate = expiry.AddYears(-2),
                    ExpiryDate = expiry
                });
            }
        }
        db.Certifications.AddRange(certs);

        // ---------- Zonat ----------
        var zones = new List<FlightZone>
        {
            Zone("Ferma Lipjan - Parcela A", "Agriculture", 21.12, 42.52, 0.02, false, 120),
            Zone("Ferma Lipjan - Parcela B", "Agriculture", 21.15, 42.50, 0.025, false, 120),
            Zone("Ura Prishtine - Ferizaj", "Infrastructure", 21.16, 42.62, 0.02, true, 80),
            Zone("Aeroporti Prishtine - Perimetri", "Infrastructure", 21.03, 42.57, 0.03, true, 50),
            Zone("Parku Solar Kacanik", "Energy", 21.24, 42.22, 0.03, false, 100),
            Zone("Turbinat Budakove", "Energy", 20.98, 42.33, 0.035, false, 150),
            Zone("Pylli i Gerrmise", "Environmental", 21.21, 42.63, 0.03, false, 120),
            Zone("Liqeni i Batllaves", "Environmental", 21.30, 42.75, 0.04, false, 120),
        };
        db.FlightZones.AddRange(zones);

        await db.SaveChangesAsync();

        // ---------- Misionet ----------
        var titles = new[]
        {
            "Skanim multispektral i parceles",
            "Inspektim i strukturës së urës",
            "Termografi e paneleve solare",
            "Monitorim i mbulesës pyjore",
            "Hartografi topografike",
            "Kontroll i sistemit të ujitjes",
            "Inspektim i turbinave me erë",
            "Vlerësim i cilësisë së ujit",
            "Fotografim periodik i parcelës",
            "Inspektim i antenave",
        };

        var missions = new List<Mission>();
        var activePilots = pilots.Where(p => p.Status == PilotStatus.Active).ToList();
        var okBatteries = batteries.Where(b => b.Status != BatteryStatus.NeedsReplacement).ToList();
        var flyable = drones.Where(d => d.Status != DroneStatus.Grounded).ToList();

        for (var i = 0; i < 28; i++)
        {
            var zone = zones[i % zones.Count];
            var drone = flyable[i % flyable.Count];
            var battery = okBatteries[i % okBatteries.Count];
            var needsPilot = zone.IsRestricted || i % 4 == 0;
            var pilot = needsPilot ? activePilots[i % activePilots.Count] : null;

            // Shperndarje kohore: te kaluara, sot, te ardhme
            var dayOffset = i < 16 ? -Rng.Next(1, 14) : i < 22 ? 0 : Rng.Next(1, 12);
            var start = DateTime.UtcNow.Date.AddDays(dayOffset).AddHours(Rng.Next(7, 17));
            var end = start.AddMinutes(Rng.Next(35, 95));

            var status = i switch
            {
                < 14 => MissionStatus.Completed,
                < 16 => MissionStatus.Aborted,
                < 18 => MissionStatus.InProgress,
                < 22 => MissionStatus.Approved,
                < 26 => MissionStatus.Planned,
                _ => MissionStatus.Cancelled
            };

            var finished = status is MissionStatus.Completed or MissionStatus.Aborted;

            missions.Add(new Mission
            {
                Title = titles[i % titles.Length],
                MissionType = zone.ZoneType,
                FlightZoneId = zone.Id,
                DroneId = drone.Id,
                BatteryId = battery.Id,
                PilotId = pilot?.Id,
                IsAutonomous = !needsPilot,
                Status = status,
                ScheduledStart = start,
                ScheduledEnd = end,
                ActualStart = finished || status == MissionStatus.InProgress ? start : null,
                ActualEnd = finished ? end : null,
                CreatedByUserId = adminId,
                ApprovedByUserId = status is MissionStatus.Planned or MissionStatus.Cancelled
                    ? null : adminId
            });
        }
        db.Missions.AddRange(missions);
        await db.SaveChangesAsync();

        // ---------- Waypoints ----------
        var waypoints = new List<MissionWaypoint>();
        foreach (var m in missions)
        {
            var zone = zones.First(z => z.Id == m.FlightZoneId);
            var (baseLng, baseLat) = ZoneCenter(zone);
            var count = Rng.Next(4, 8);

            for (var k = 0; k < count; k++)
            {
                waypoints.Add(new MissionWaypoint
                {
                    MissionId = m.Id,
                    SequenceNumber = k + 1,
                    Latitude = Math.Round((decimal)(baseLat + (Rng.NextDouble() - 0.5) * 0.02), 6),
                    Longitude = Math.Round((decimal)(baseLng + (Rng.NextDouble() - 0.5) * 0.02), 6),
                    AltitudeMeters = zone.MaxAltitudeMeters.HasValue
                        ? Rng.Next(40, zone.MaxAltitudeMeters.Value)
                        : 100,
                    ActionType = k == 0 ? "Waypoint" : k == count - 1 ? "Land" : "Photo"
                });
            }
        }
        db.MissionWaypoints.AddRange(waypoints);

        // ---------- Mirëmbajtja ----------
        var tech = await userManager.FindByEmailAsync("tech@smartfleet.com");
        var records = new List<MaintenanceRecord>();
        var descriptions = new[]
        {
            "Zëvendësim i helikave të përparme",
            "Kalibrim i gimbal-it dhe kamerës",
            "Kontroll periodik 100 orësh",
            "Ndërrim i motorit të pasëm të djathtë",
            "Përditësim firmware dhe kalibrim IMU",
            "Inspektim i strukturës pas uljes së fortë",
        };

        for (var i = 0; i < 14; i++)
        {
            var drone = drones[i % drones.Count];
            records.Add(new MaintenanceRecord
            {
                DroneId = drone.Id,
                TechnicianId = tech?.Id ?? adminId,
                MaintenanceType = (MaintenanceType)(i % 3),
                Description = descriptions[i % descriptions.Length],
                PerformedAt = DateTime.UtcNow.AddDays(-Rng.Next(3, 120)),
                NextRecommendedDate = today.AddDays(Rng.Next(20, 180)),
                Cost = Math.Round((decimal)(Rng.NextDouble() * 420 + 35), 2),
                Status = i < 10 ? MaintenanceStatus.Completed
                    : i < 12 ? MaintenanceStatus.InProgress
                    : MaintenanceStatus.Scheduled
            });
        }
        db.MaintenanceRecords.AddRange(records);

        await db.SaveChangesAsync();
        Console.WriteLine($">>> SEEDER: {drones.Count} dronë, {batteries.Count} bateri, " +
                          $"{pilots.Count} pilotë, {zones.Count} zona, {missions.Count} misione.");
    }

    // Ndihmes: krijon nje zone katrore rreth nje pike
    private static FlightZone Zone(string name, string type, double lng, double lat,
        double size, bool restricted, int maxAlt)
    {
        var geo = $"{{\"type\":\"Polygon\",\"coordinates\":[[" +
                  $"[{lng:F4},{lat:F4}]," +
                  $"[{lng + size:F4},{lat:F4}]," +
                  $"[{lng + size:F4},{lat + size:F4}]," +
                  $"[{lng:F4},{lat + size:F4}]," +
                  $"[{lng:F4},{lat:F4}]]]}}";

        return new FlightZone
        {
            Name = name,
            ZoneType = type,
            PolygonGeoJson = geo,
            IsRestricted = restricted,
            MaxAltitudeMeters = maxAlt
        };
    }

    private static (double lng, double lat) ZoneCenter(FlightZone zone)
    {
        try
        {
            var doc = System.Text.Json.JsonDocument.Parse(zone.PolygonGeoJson);
            var first = doc.RootElement.GetProperty("coordinates")[0][0];
            return (first[0].GetDouble(), first[1].GetDouble());
        }
        catch
        {
            return (21.16, 42.66);
        }
    }
}