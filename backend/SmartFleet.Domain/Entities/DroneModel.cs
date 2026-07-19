using SmartFleet.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Domain.Entites
{
    public class DroneModel : BaseEntity
    {
        public string ManufacturerName { get; set; } = string.Empty;
        public string ModelName { get; set; } = string.Empty;
        public int MaxFlightTimeMinutes { get; set; }
        public decimal MaxPayloadKg { get; set; }
        public decimal MaxSpeedKmh { get; set; }
        public string? CameraSpecs { get; set; }
        public ICollection<Drone> Drones { get; set; } = new List<Drone>();

    }
}
