using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Domain.Entities
{

    public enum AiAnalysisStatus
    {
        Pending,
        Analyzed,
        Failed
    }

    public class PostFlightReport : BaseEntity
    {
        public Guid MissionId { get; set; }
        public Mission Mission { get; set; } = null!;

        public Guid SubmittedByPilotId { get; set; }

        public int FlightDurationMinutes { get; set; }
        public decimal? BatteryUsedPercentage { get; set; }
        public string? IssuesReported { get; set; }
        public string? WeatherConditions { get; set; }
        public string? Summary { get; set; }
        public AiAnalysisStatus AiAnalysisStatus { get; set; } = AiAnalysisStatus.Pending;
        public DateTime SubmittedAt { get; set; }
    }
}
