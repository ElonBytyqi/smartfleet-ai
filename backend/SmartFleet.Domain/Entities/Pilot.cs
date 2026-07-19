using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Domain.Entities
{
    public enum PilotStatus
    {
        Active,
        Suspended,
        Inactive
    }

    public class Pilot : BaseEntity
    {
        public Guid UserId { get; set; } // lidhet me ApplicationUser.Id, jo referencë direkte

        public string? LicenseNumber { get; set; }
        public decimal TotalFlightHours { get; set; } = 0;
        public PilotStatus Status { get; set; } = PilotStatus.Active;

        public ICollection<Certification> Certifications { get; set; } = new List<Certification>();
    }
}
