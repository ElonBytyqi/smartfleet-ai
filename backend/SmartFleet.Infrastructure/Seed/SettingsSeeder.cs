using Microsoft.EntityFrameworkCore;
using SmartFleet.Application;
using SmartFleet.Domain.Entities;
using SmartFleet.Infrastructure.Persistence;

namespace SmartFleet.Infrastructure.Seed;

public static class SettingsSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db)
    {
        var existing = await db.Settings.Select(s => s.Key).ToListAsync();

        var defaults = new List<Setting>
        {
            // ===== Bateria =====
            New(SettingKeys.BatteryLow, "25", SettingValueType.Integer, "Bateria",
                "Pragu i baterisë së ulët",
                "Nën këtë nivel ngrihet një paralajmërim gjatë fluturimit.",
                "%", 5, 50, 1),

            New(SettingKeys.BatteryCritical, "15", SettingValueType.Integer, "Bateria",
                "Pragu kritik i baterisë",
                "Nën këtë nivel alarmi bëhet kritik — droni duhet kthyer menjëherë.",
                "%", 3, 30, 2),

            New(SettingKeys.BatteryHealthWarning, "80", SettingValueType.Integer, "Bateria",
                "Shëndeti minimal i pranueshëm",
                "Bateritë nën këtë shëndet shfaqen si që kërkojnë vëmendje.",
                "%", 50, 95, 3),

            // ===== Fluturimi =====
            New(SettingKeys.MaxAltitude, "500", SettingValueType.Integer, "Fluturimi",
                "Lartësia maksimale",
                "Kufiri absolut i lartësisë, pavarësisht zonës.",
                "m", 50, 1000, 1),

            New(SettingKeys.HighVibration, "60", SettingValueType.Integer, "Fluturimi",
                "Pragu i dridhjeve",
                "Dridhje mbi këtë nivel tregojnë problem me motorët ose helikat.",
                null, 20, 100, 2),

            New(SettingKeys.MaxTemperature, "45", SettingValueType.Integer, "Fluturimi",
                "Temperatura maksimale",
                "Temperaturë mbi këtë vlerë rrezikon komponentët.",
                "°C", 30, 80, 3),

            New(SettingKeys.SignalLostSeconds, "30", SettingValueType.Integer, "Fluturimi",
                "Humbja e sinjalit",
                "Sekonda pa telemetri derisa droni shënohet si i humbur.",
                "s", 10, 300, 4),

            // ===== GPS =====
            New(SettingKeys.GpsMinSatellites, "6", SettingValueType.Integer, "GPS",
                "Satelitë minimalë",
                "Nën këtë numër pozicionimi konsiderohet i pabesueshëm.",
                null, 4, 20, 1),

            // ===== Siguria =====
            New(SettingKeys.SeparationHorizontal, "60", SettingValueType.Integer, "Siguria",
                "Distanca horizontale minimale",
                "Dy dronë më afër se kaq ngrenë alarm afërsie.",
                "m", 20, 500, 1),

            New(SettingKeys.SeparationVertical, "20", SettingValueType.Integer, "Siguria",
                "Distanca vertikale minimale",
                "Alarmi ngrihet vetëm nëse shkelet edhe kufiri horizontal.",
                "m", 5, 200, 2),

            New(SettingKeys.ConflictRadius, "100", SettingValueType.Integer, "Siguria",
                "Rrezja e konfliktit në planifikim",
                "Waypoint-e më afër se kaq, me kohë që mbivendoset, raportohen si konflikt.",
                "m", 20, 1000, 3),

            // ===== Mirëmbajtja =====
            New(SettingKeys.CertExpiryWarningDays, "30", SettingValueType.Integer, "Mirëmbajtja",
                "Paralajmërimi për certifikata",
                "Ditë para skadimit kur certifikata shfaqet te vëmendja.",
                "ditë", 7, 180, 1),

            // ===== Sistemi =====
            New(SettingKeys.AlertAutoResolveMinutes, "5", SettingValueType.Integer, "Sistemi",
                "Mbyllja automatike e alarmeve",
                "Minuta pa u rishfaqur derisa alarmi mbyllet vetë.",
                "min", 1, 120, 1),

            New(SettingKeys.AuditRetentionDays, "365", SettingValueType.Integer, "Sistemi",
                "Ruajtja e regjistrit",
                "Ditë sa mbahen hyrjet e regjistrit para fshirjes.",
                "ditë", 30, 3650, 2),
        };

        var missing = defaults.Where(d => !existing.Contains(d.Key)).ToList();
        Console.WriteLine($">>> SETTINGS: ekzistuese {existing.Count}, per t'u shtuar {missing.Count}");
        if (missing.Count == 0) return;

        db.Settings.AddRange(missing);
        await db.SaveChangesAsync();
    }

    private static Setting New(
        string key, string value, SettingValueType type, string category,
        string label, string description, string? unit,
        decimal? min, decimal? max, int order) => new()
        {
            Id = Guid.NewGuid(),
            Key = key,
            Value = value,
            DefaultValue = value,
            ValueType = type,
            Category = category,
            Label = label,
            Description = description,
            Unit = unit,
            MinValue = min,
            MaxValue = max,
            SortOrder = order
        };
}