using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Domain.Entities
{

    public class AuditLog : BaseEntity
    {
        public Guid? UserId { get; set; } // referencë te ApplicationUser.Id, nullable

        public string Action { get; set; } = string.Empty; // p.sh. "Mission.Approved", "Drone.Created"
        public string EntityType { get; set; } = string.Empty;
        public Guid? EntityId { get; set; }
        public string? DetailsJson { get; set; } // ruajmë si string JSON, jo jsonb (PostgreSQL-specifik do të konfigurohet te EF Core)
    }
}
