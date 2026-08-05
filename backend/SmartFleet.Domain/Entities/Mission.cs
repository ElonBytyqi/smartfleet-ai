using SmartFleet.Domain.Entites;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Domain.Entities
{
    public enum MissionStatus
    {
        Planned,
        Approved,
        InProgress,
        Completed,
        Cancelled,
        Aborted
    }

    public class Mission : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string MissionType { get; set; } = string.Empty; // Agriculture, Infrastructure, Energy, Environmental, Mapping

        public Guid FlightZoneId { get; set; }
        public FlightZone FlightZone { get; set; } = null!;

        public Guid? DroneId { get; set; }
        public Drone? Drone { get; set; }

        public Guid? PilotId { get; set; }
        public Pilot? Pilot { get; set; }

        public Guid? BatteryId { get; set; }
        public Battery? Battery { get; set; }

        public MissionStatus Status { get; set; } = MissionStatus.Planned;
        public bool IsAutonomous { get; set; } = true;

        public DateTime ScheduledStart { get; set; }
        public DateTime? ScheduledEnd { get; set; }
        public DateTime? ActualStart { get; set; }
        public DateTime? ActualEnd { get; set; }

        public Guid CreatedByUserId { get; set; }
        public Guid? ApprovedByUserId { get; set; }

        public ICollection<MissionWaypoint> Waypoints { get; set; } = new List<MissionWaypoint>();
        public PreFlightChecklist? PreFlightChecklist { get; set; }
        public PostFlightReport? PostFlightReport { get; set; }
    }
}
