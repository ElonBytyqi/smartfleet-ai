using SmartFleet.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Domain.Entites
{
    public class Drone : BaseEntity
    {
        public string SerialNumber { get; set; } = string.Empty;
        public string? Nickname { get; set; }
        public DroneStatus Status { get; set; } =  DroneStatus.Available;

        public decimal TotalFlightHours { get; set; } = 0;
        public DateOnly? PurchaseDate { get; set; }

        public Guid DroneModelId { get; set; }
        public DroneModel DroneModel { get; set; } = null!;

        public ICollection<DroneComponent> Components { get; set; } = new List<DroneComponent>();
        public ICollection<Battery> Batteries { get; set; } = new List<Battery>();

    }


    public enum DroneStatus
    {
        Available,
        InMission,
        Maintenance,
        Grounded
    }


}
