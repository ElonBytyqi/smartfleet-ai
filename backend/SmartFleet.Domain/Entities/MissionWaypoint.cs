using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Domain.Entities
{
    public class MissionWaypoint : BaseEntity
    {
        public Guid MissionId { get; set; }
        public Mission Mission { get; set; } = null!;

        public int SequenceNumber { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public decimal? AltitudeMeters { get; set; }
        public string? ActionType { get; set; } // Waypoint, Photo, Hover, Land
    }
}
