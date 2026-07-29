using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Domain.Entites;
using SmartFleet.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;


namespace SmartFleet.Infrastructure.Services
{
    public class DroneModelService : IDroneModelService
    {

        private readonly ApplicationDbContext _dbContext;

        public DroneModelService(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }
        public async Task<List<DroneModelResponse>> GetAllAsync()
        {
            return await _dbContext.DroneModels
                .Select(m => new DroneModelResponse(
                    m.Id,
                    m.ManufacturerName,
                    m.ModelName,
                    m.MaxFlightTimeMinutes,
                    m.MaxPayloadKg,
                    m.MaxSpeedKmh,
                    m.CameraSpecs,
                    m.Drones.Count))
                .ToListAsync();
        }

        public async Task<DroneModelResponse?> GetByIdAsync(Guid id)
        {
            return await _dbContext.DroneModels
                .Where(m => m.Id == id)
                .Select(m => new DroneModelResponse(
                    m.Id,
                    m.ManufacturerName,
                    m.ModelName,
                    m.MaxFlightTimeMinutes,
                    m.MaxSpeedKmh,
                    m.MaxPayloadKg,
                    m.CameraSpecs,
                    m.Drones.Count))
                .FirstOrDefaultAsync();
        }

        public async Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreateDroneModelRequest request)
        {
            var duplicate = await _dbContext.DroneModels.AnyAsync(m =>
                m.ManufacturerName == request.ManufacturerName &&
                m.ModelName == request.ModelName);

            if (duplicate)
                return (false, "This manufacturer/model combination already exists.", null);

            var model = new DroneModel
            {
                ManufacturerName = request.ManufacturerName,
                ModelName = request.ModelName,
                MaxFlightTimeMinutes = request.MaxFlightTimeMinutes,
                MaxPayloadKg = request.MaxPayloadKg,
                MaxSpeedKmh = request.MaxSpeedKmh,
                CameraSpecs = request.CameraSpecs
            };

            _dbContext.DroneModels.Add(model);
            await _dbContext.SaveChangesAsync();

            return (true, null, model.Id);
        }

        public async Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateDroneModelRequest request)
        {
            var model = await _dbContext.DroneModels.FindAsync(id);
            if (model == null) return (false, "Drone model not found.");

            model.ManufacturerName = request.ManufacturerName;
            model.ModelName = request.ModelName;
            model.MaxFlightTimeMinutes = request.MaxFlightTimeMinutes;
            model.MaxPayloadKg = request.MaxPayloadKg;
            model.MaxSpeedKmh = request.MaxSpeedKmh;
            model.CameraSpecs = request.CameraSpecs;
            model.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return (true, null);
        }

        public async Task<(bool Success, string? Error)> DeleteAsync(Guid id)
        {
            var model = await _dbContext.DroneModels.FindAsync(id);
            if (model == null) return (false, "Drone model not found.");

            var hasDrones = await _dbContext.Drones.AnyAsync(d => d.DroneModelId == id);
            if (hasDrones)
                return (false, "Cannot delete a model that has registered drones.");

            _dbContext.DroneModels.Remove(model);
            await _dbContext.SaveChangesAsync();
            return (true, null);
        }
    }
}
