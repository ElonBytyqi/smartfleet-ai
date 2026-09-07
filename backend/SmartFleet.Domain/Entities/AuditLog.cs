using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Domain.Entities
{

    public class AuditLog : BaseEntity
    {
        public Guid? UserId { get; set; }
        public string? UserEmail { get; set; }      // ruajme edhe emailin, qe te mos humbase nese fshihet useri

        public string Action { get; set; } = string.Empty;      // Created, Updated, Deleted
        public string EntityType { get; set; } = string.Empty;
        public Guid? EntityId { get; set; }
        public string? EntityLabel { get; set; }    // p.sh. numri serik ose titulli

        public string? Changes { get; set; }        // JSON me fushat qe ndryshuan
        public string? IpAddress { get; set; }

    }
}
