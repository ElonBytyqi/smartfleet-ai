

using SmartFleet.Domain.Entites;

namespace SmartFleet.Application.DTOs
{
    public class BatteryDtos
    {

        public record CreateBatteryRequest(
    string SerialNumber,
    int CapacityMah,
    Guid? DroneId,
    DateOnly? PurchaseDate);

        public record UpdateBatteryRequest(
            int CapacityMah,
            int CycleCount,
            decimal HealthPercentage,
            DateOnly? LastInspectionDate);

        public record UpdateBatteryStatusRequest(BatteryStatus Status);

        public record AssignBatteryRequest(Guid? DroneId);

        public record BatteryResponse(
            Guid Id,
            string SerialNumber,
            int CapacityMah,
            int CycleCount,
            decimal HealthPercentage,
            string Status,
            Guid? DroneId,
            string? DroneSerialNumber,
            DateOnly? PurchaseDate,
            DateOnly? LastInspectionDate);


    }
}
