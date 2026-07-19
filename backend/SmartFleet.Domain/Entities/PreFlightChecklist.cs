using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Domain.Entities
{

    public class PreFlightChecklist : BaseEntity
    {
        public Guid MissionId { get; set; }
        public Mission Mission { get; set; } = null!;

        public Guid CompletedByPilotId { get; set; }

        public bool BatteryChecked { get; set; }
        public bool PropellersChecked { get; set; }
        public bool GpsSignalOk { get; set; }
        public bool WeatherConditionsOk { get; set; }
        public bool FirmwareUpToDate { get; set; }
        public string? Notes { get; set; }
        public DateTime CompletedAt { get; set; }
    }
}
