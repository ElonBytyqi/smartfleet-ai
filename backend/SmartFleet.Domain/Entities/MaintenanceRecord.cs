using SmartFleet.Domain.Entites;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Domain.Entities
{

    public enum MaintenanceType
    {
        Scheduled,
        Corrective,
        Predictive
    }

    public enum MaintenanceStatus
    {
        Scheduled,
        InProgress,
        Completed
    }

    public class MaintenanceRecord : BaseEntity
    {
        public Guid DroneId { get; set; }
        public Drone Drone { get; set; } = null!;

        public Guid TechnicianId { get; set; } // referencë te ApplicationUser.Id (Infrastructure)

        public MaintenanceType MaintenanceType { get; set; }
        public string Description { get; set; } = string.Empty;

        public Guid? ComponentId { get; set; }
        public DroneComponent? Component { get; set; }

        public DateTime PerformedAt { get; set; }
        public DateOnly? NextRecommendedDate { get; set; }
        public decimal? Cost { get; set; }
        public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Scheduled;
    }
}
