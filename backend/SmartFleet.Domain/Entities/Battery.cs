using SmartFleet.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Domain.Entites
{

    public enum BatteryStatus
    {
        Available,
        InUse,
        Charging,
        NeedsReplacement
    }

    public class Battery : BaseEntity
    {
        public string SerialNumber { get; set; } = string.Empty;
        public Guid? DroneId { get; set; }
        public Drone? Drone { get; set; }

        public int CapacityMah { get; set; }
        public int CycleCount { get; set; } = 0;
        public decimal HealthPercentage { get; set; } = 100;
        public BatteryStatus Status { get; set; } = BatteryStatus.Available;
        public DateTime? PurchaseDate { get; set; }
        public DateTime? LastInspectionDate { get; set; }
    }
}
