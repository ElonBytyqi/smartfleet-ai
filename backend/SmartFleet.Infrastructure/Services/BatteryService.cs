using Microsoft.EntityFrameworkCore;
using SmartFleet.Application.Services;
using SmartFleet.Domain.Entites;
using SmartFleet.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Text;
using static SmartFleet.Application.DTOs.BatteryDtos;

namespace SmartFleet.Infrastructure.Services
{
    public class BatteryService : IBatteryService
    {

        private readonly ApplicationDbContext _dbContext;

        public BatteryService(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }
        public async Task<List<BatteryResponse>> GetAllAsync(Guid? droneId = null)
        {
            var query = _dbContext.Batteries.AsQueryable();

            if (droneId.HasValue)
                query = query.Where(b => b.DroneId == droneId.Value);

            return await query
                .OrderBy(b => b.SerialNumber)
                .Select(b => new BatteryResponse(
                    b.Id,
                    b.SerialNumber,
                    b.CapacityMah,
                    b.CycleCount,
                    b.HealthPercentage,
                    b.Status.ToString(),
                    b.DroneId,
                    b.Drone != null ? b.Drone.SerialNumber : null,
                    b.PurchaseDate,
                    b.LastInspectionDate))
                .ToListAsync();
        }

        public async Task<BatteryResponse?> GetByIdAsync(Guid id)
        {
            return await _dbContext.Batteries
                .Where(b => b.Id == id)
                .Select(b => new BatteryResponse(
                    b.Id,
                    b.SerialNumber,
                    b.CapacityMah,
                    b.CycleCount,
                    b.HealthPercentage,
                    b.Status.ToString(),
                    b.DroneId,
                    b.Drone != null ? b.Drone.SerialNumber : null,
                    b.PurchaseDate,
                    b.LastInspectionDate))
                .FirstOrDefaultAsync();
        }

        public async Task<List<BatteryResponse>> GetNeedingInspectionAsync(decimal healthThreshold = 80)
        {
            return await _dbContext.Batteries
                .Where(b => b.HealthPercentage < healthThreshold
                            || b.Status == BatteryStatus.NeedsReplacement)
                .OrderBy(b => b.HealthPercentage)
                .Select(b => new BatteryResponse(
                    b.Id,
                    b.SerialNumber,
                    b.CapacityMah,
                    b.CycleCount,
                    b.HealthPercentage,
                    b.Status.ToString(),
                    b.DroneId,
                    b.Drone != null ? b.Drone.SerialNumber : null,
                    b.PurchaseDate,
                    b.LastInspectionDate))
                .ToListAsync();
        }

        public async Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreateBatteryRequest request)
        {
            if (await _dbContext.Batteries.AnyAsync(b => b.SerialNumber == request.SerialNumber))
                return (false, "A battery with this serial number already exists.", null);

            if (request.DroneId.HasValue &&
                !await _dbContext.Drones.AnyAsync(d => d.Id == request.DroneId.Value))
                return (false, "Drone does not exist.", null);

            if (request.CapacityMah <= 0)
                return (false, "Capacity must be greater than zero.", null);

            var battery = new Battery
            {
                SerialNumber = request.SerialNumber,
                CapacityMah = request.CapacityMah,
                DroneId = request.DroneId,
                PurchaseDate = request.PurchaseDate
            };

            _dbContext.Batteries.Add(battery);
            await _dbContext.SaveChangesAsync();

            return (true, null, battery.Id);
        }

        public async Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateBatteryRequest request)
        {
            var battery = await _dbContext.Batteries.FindAsync(id);
            if (battery == null) return (false, "Battery not found.");

            if (request.HealthPercentage < 0 || request.HealthPercentage > 100)
                return (false, "Health percentage must be between 0 and 100.");

            if (request.CycleCount < 0)
                return (false, "Cycle count cannot be negative.");

            battery.CapacityMah = request.CapacityMah;
            battery.CycleCount = request.CycleCount;
            battery.HealthPercentage = request.HealthPercentage;
            battery.LastInspectionDate = request.LastInspectionDate;
            battery.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return (true, null);
        }

        public async Task<(bool Success, string? Error)> UpdateStatusAsync(Guid id, UpdateBatteryStatusRequest request)
        {
            var battery = await _dbContext.Batteries.FindAsync(id);
            if (battery == null) return (false, "Battery not found.");

            battery.Status = request.Status;
            battery.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return (true, null);
        }

        public async Task<(bool Success, string? Error)> AssignToDroneAsync(Guid id, AssignBatteryRequest request)
        {
            var battery = await _dbContext.Batteries.FindAsync(id);
            if (battery == null) return (false, "Battery not found.");

            // Heqja e caktimit
            if (request.DroneId == null)
            {
                battery.DroneId = null;
                battery.Status = BatteryStatus.Available;
                battery.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();
                return (true, null);
            }

            if (battery.Status == BatteryStatus.InUse)
                return (false, "Battery is currently in use and cannot be reassigned.");

            if (battery.Status == BatteryStatus.NeedsReplacement)
                return (false, "Battery needs replacement and cannot be assigned.");

            if (!await _dbContext.Drones.AnyAsync(d => d.Id == request.DroneId.Value))
                return (false, "Drone does not exist.");

            battery.DroneId = request.DroneId;
            battery.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return (true, null);
        }

    }
}
