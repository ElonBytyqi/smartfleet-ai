namespace SmartFleet.Domain.Entities;

public enum SettingValueType
{
    Integer = 0,
    Decimal = 1,
    Boolean = 2,
    Text = 3
}

public class Setting : BaseEntity
{
    /// <summary>Çelësi unik, p.sh. "Battery.LowPercentage".</summary>
    public string Key { get; set; } = null!;

    public string Value { get; set; } = null!;

    /// <summary>Vlera fillestare — lejon rikthimin te parazgjedhja.</summary>
    public string DefaultValue { get; set; } = null!;

    public SettingValueType ValueType { get; set; }

    /// <summary>Grupi në ndërfaqe: Bateria, Fluturimi, Siguria…</summary>
    public string Category { get; set; } = null!;

    public string Label { get; set; } = null!;
    public string? Description { get; set; }
    public string? Unit { get; set; }

    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }

    public int SortOrder { get; set; }
}