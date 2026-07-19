using Microsoft.EntityFrameworkCore;
using SmartFleet.Application.Services;
using SmartFleet.Domain.Entites;
using SmartFleet.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Application.DTOs
{
    public class DroneService : IDroneService
    {

        private readonly ApplicationDbContext _dbContext;

        public DroneService(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }
        public async Task<List<DroneResponse>> GetAllAsync()
        {
            return await _dbContext.Drones
                .Include(d => d.DroneModel)
                .Select(d => new DroneResponse(
                    d.Id, d.SerialNumber, d.Nickname, d.Status.ToString(),
                    d.TotalFlightHours, d.PurchaseDate, d.DroneModelId, d.DroneModel.ModelName))
                .ToListAsync();

        }


        public async Task<DroneResponse?> GetByIdAsync(Guid id)
        {
            var d = await _dbContext.Drones
                .Include(x => x.DroneModel)
                .FirstOrDefaultAsync(x => x.Id == id);

            return d == null ? null : new DroneResponse(
                d.Id, d.SerialNumber, d.Nickname, d.Status.ToString(),
                d.TotalFlightHours, d.PurchaseDate, d.DroneModelId, d.DroneModel.ModelName);
        }

        public async Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreateDroneRequest request)
        {
            if (!await _dbContext.DroneModels.AnyAsync(m => m.Id == request.DroneModelId))
                return (false, "DroneModel does not exist.", null);

            if (await _dbContext.Drones.AnyAsync(d => d.SerialNumber == request.SerialNumber))
                return (false, "A drone with this serial number already exists.", null);

            var drone = new Drone
            {
                SerialNumber = request.SerialNumber,
                Nickname = request.Nickname,
                DroneModelId = request.DroneModelId,
                PurchaseDate = request.PurchaseDate
            };

            _dbContext.Drones.Add(drone);
            await _dbContext.SaveChangesAsync();
            return (true, null, drone.Id);
        }

        public async Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateDroneRequest request)
        {
            var drone = await _dbContext.Drones.FindAsync(id);
            if (drone == null) return (false, "Drone not found.");

            drone.Nickname = request.Nickname;
            drone.Status = request.Status;
            drone.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return (true, null);
        }

        public async Task<(bool Success, string? Error)> DeleteAsync(Guid id)
        {
            var drone = await _dbContext.Drones.FindAsync(id);
            if (drone == null) return (false, "Drone not found.");

            _dbContext.Drones.Remove(drone);
            await _dbContext.SaveChangesAsync();
            return (true, null);
        }
    }
}
