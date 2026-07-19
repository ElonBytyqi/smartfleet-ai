using SmartFleet.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Domain.Entites
{
    public class DroneComponent : BaseEntity
    {

        public Guid DroneId { get; set; }
        public Drone Drone { get; set; } = null!;

        public string ComponentType { get; set; } = string.Empty; // Motor, Propeller, Camera, GPS, FlightController
        public string? SerialNumber { get; set; }
        public DateOnly InstalledAt { get; set; }
        public int? ExpectedLifespanHours { get; set; }
        public string Status { get; set; } = "OK"; // OK, NeedsInspection, Replaced

    }
}
