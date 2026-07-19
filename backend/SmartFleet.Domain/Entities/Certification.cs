using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Domain.Entities
{

    public class Certification : BaseEntity
    {
        public Guid PilotId { get; set; }
        public Pilot Pilot { get; set; } = null!;

        public string CertificationType { get; set; } = string.Empty; // p.sh. "EASA A2", "Part 107"
        public string IssuedBy { get; set; } = string.Empty;
        public DateOnly IssueDate { get; set; }
        public DateOnly ExpiryDate { get; set; }
        public string? DocumentUrl { get; set; }
    }
}
