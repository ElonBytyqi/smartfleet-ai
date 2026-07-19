using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text;

namespace SmartFleet.Domain.Entities
{

    public class FlightZone : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string ZoneType { get; set; } = string.Empty; // Agriculture, Infrastructure, Energy, Environmental, Mapping
        public string PolygonGeoJson { get; set; } = string.Empty;
        public bool IsRestricted { get; set; } = false;
        public int? MaxAltitudeMeters { get; set; }

        public ICollection<Mission> Missions { get; set; } = new List<Mission>();
    }
}
