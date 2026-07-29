using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Domain.Entities;
using SmartFleet.Infrastructure.Identity;
using SmartFleet.Infrastructure.Persistence;

namespace SmartFleet.Infrastructure.Services;

public class PilotService : IPilotService
{
    private readonly ApplicationDbContext _dbContext;

    // Na duhet Identity sepse Pilot ruan vetem UserId — emri/email jane te AspNetUsers
    private readonly UserManager<ApplicationUser> _userManager;

    public PilotService(ApplicationDbContext dbContext, UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _userManager = userManager;
    }

    public async Task<List<PilotResponse>> GetAllAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var soon = today.AddDays(30);   // pragu per "certifikata qe skadojne se shpejti"

        // Fillimisht marrim nga DB vetem te dhenat e pilotit + numerimet (anonymous type)
        var pilots = await _dbContext.Pilots
            .Select(p => new
            {
                p.Id,
                p.UserId,
                p.LicenseNumber,
                p.TotalFlightHours,
                p.Status,
                CertCount = p.Certifications.Count,
                ExpiringCount = p.Certifications.Count(c => c.ExpiryDate <= soon)
            })
            .ToListAsync();

        var result = new List<PilotResponse>();

        // Pastaj per secilin marrim emrin/email nga Identity dhe ndertojme DTO-n perfundimtar
        foreach (var p in pilots)
        {
            var user = await _userManager.FindByIdAsync(p.UserId.ToString());
            result.Add(new PilotResponse(
                p.Id, p.UserId, user?.FullName, user?.Email,
                p.LicenseNumber, p.TotalFlightHours, p.Status.ToString(),
                p.CertCount, p.ExpiringCount));
        }

        return result;
    }

    public async Task<PilotResponse?> GetByIdAsync(Guid id)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var soon = today.AddDays(30);

        var p = await _dbContext.Pilots
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.UserId,
                x.LicenseNumber,
                x.TotalFlightHours,
                x.Status,
                CertCount = x.Certifications.Count,
                ExpiringCount = x.Certifications.Count(c => c.ExpiryDate <= soon)
            })
            .FirstOrDefaultAsync();

        if (p == null) return null;

        var user = await _userManager.FindByIdAsync(p.UserId.ToString());

        return new PilotResponse(
            p.Id, p.UserId, user?.FullName, user?.Email,
            p.LicenseNumber, p.TotalFlightHours, p.Status.ToString(),
            p.CertCount, p.ExpiringCount);
    }

    public async Task<(bool Success, string? Error, Guid? Id)> CreateAsync(CreatePilotRequest request)
    {
        // 4 validime perpara krijimit te profilit
        var user = await _userManager.FindByIdAsync(request.UserId.ToString());
        if (user == null)
            return (false, "User does not exist.", null);

        // Nuk krijojme profil piloti per dike qe s'ka rolin Pilot
        if (!await _userManager.IsInRoleAsync(user, "Pilot"))
            return (false, "User must have the 'Pilot' role before creating a pilot profile.", null);

        // Lidhja User -> Pilot eshte 1-me-1
        if (await _dbContext.Pilots.AnyAsync(p => p.UserId == request.UserId))
            return (false, "A pilot profile already exists for this user.", null);

        // Numri i licences duhet unik (nese eshte dhene)
        if (!string.IsNullOrWhiteSpace(request.LicenseNumber) &&
            await _dbContext.Pilots.AnyAsync(p => p.LicenseNumber == request.LicenseNumber))
            return (false, "This license number is already registered.", null);

        // TotalFlightHours = 0 dhe Status = Active vijne si default nga entiteti
        var pilot = new Pilot
        {
            UserId = request.UserId,
            LicenseNumber = request.LicenseNumber
        };

        _dbContext.Pilots.Add(pilot);
        await _dbContext.SaveChangesAsync();

        return (true, null, pilot.Id);
    }

    public async Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdatePilotRequest request)
    {
        var pilot = await _dbContext.Pilots.FindAsync(id);
        if (pilot == null) return (false, "Pilot not found.");

        // p.Id != id -> lejo qe piloti ta mbaje licencen e vet, blloko vetem konfliktet me te tjeret
        if (!string.IsNullOrWhiteSpace(request.LicenseNumber) &&
            await _dbContext.Pilots.AnyAsync(p => p.LicenseNumber == request.LicenseNumber && p.Id != id))
            return (false, "This license number is already registered to another pilot.");

        pilot.LicenseNumber = request.LicenseNumber;
        pilot.Status = request.Status;
        pilot.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return (true, null);
    }

    public async Task<List<CertificationResponse>> GetCertificationsAsync(Guid pilotId)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        return await _dbContext.Certifications
            .Where(c => c.PilotId == pilotId)
            .OrderBy(c => c.ExpiryDate)   // me afert skadimi ne krye
            .Select(c => new CertificationResponse(
                c.Id,
                c.PilotId,
                null,                     // PilotName s'duhet ketu — e dime tashme cilit pilot i perkasin
                c.CertificationType,
                c.IssuedBy,
                c.IssueDate,
                c.ExpiryDate,
                c.DocumentUrl,
                c.ExpiryDate < today,                          // IsExpired
                c.ExpiryDate.DayNumber - today.DayNumber))     // dite deri ne skadim (negative = skaduar)
            .ToListAsync();
    }

    // Alarmi kryesor per Fleet Manager: kush duhet ta rinovoje licencen
    public async Task<List<CertificationResponse>> GetExpiringCertificationsAsync(int days = 30)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var limit = today.AddDays(days);

        var certs = await _dbContext.Certifications
            .Include(c => c.Pilot)
            .Where(c => c.ExpiryDate <= limit)
            .OrderBy(c => c.ExpiryDate)
            .Select(c => new
            {
                c.Id,
                c.PilotId,
                c.Pilot.UserId,      // na duhet per te marre emrin nga Identity
                c.CertificationType,
                c.IssuedBy,
                c.IssueDate,
                c.ExpiryDate,
                c.DocumentUrl
            })
            .ToListAsync();

        var result = new List<CertificationResponse>();

        // Ketu PilotName ka kuptim — lista perzien certifikata te pilotesh te ndryshem
        foreach (var c in certs)
        {
            var user = await _userManager.FindByIdAsync(c.UserId.ToString());
            result.Add(new CertificationResponse(
                c.Id, c.PilotId, user?.FullName,
                c.CertificationType, c.IssuedBy, c.IssueDate, c.ExpiryDate, c.DocumentUrl,
                c.ExpiryDate < today,
                c.ExpiryDate.DayNumber - today.DayNumber));
        }

        return result;
    }

    public async Task<(bool Success, string? Error, Guid? Id)> AddCertificationAsync(
        Guid pilotId, CreateCertificationRequest request)
    {
        if (!await _dbContext.Pilots.AnyAsync(p => p.Id == pilotId))
            return (false, "Pilot not found.", null);

        if (request.ExpiryDate <= request.IssueDate)
            return (false, "Expiry date must be after the issue date.", null);

        var cert = new Certification
        {
            PilotId = pilotId,
            CertificationType = request.CertificationType,
            IssuedBy = request.IssuedBy,
            IssueDate = request.IssueDate,
            ExpiryDate = request.ExpiryDate,
            DocumentUrl = request.DocumentUrl
        };

        _dbContext.Certifications.Add(cert);
        await _dbContext.SaveChangesAsync();

        return (true, null, cert.Id);
    }

    public async Task<(bool Success, string? Error)> UpdateCertificationAsync(
        Guid pilotId, Guid certId, UpdateCertificationRequest request)
    {
        // Kerkojme me te DYJA ID-te — mbrojtje qe te mos preket certifikata e nje piloti tjeter
        var cert = await _dbContext.Certifications
            .FirstOrDefaultAsync(c => c.Id == certId && c.PilotId == pilotId);

        if (cert == null) return (false, "Certification not found for this pilot.");

        if (request.ExpiryDate <= request.IssueDate)
            return (false, "Expiry date must be after the issue date.");

        cert.CertificationType = request.CertificationType;
        cert.IssuedBy = request.IssuedBy;
        cert.IssueDate = request.IssueDate;
        cert.ExpiryDate = request.ExpiryDate;
        cert.DocumentUrl = request.DocumentUrl;
        cert.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> DeleteCertificationAsync(Guid pilotId, Guid certId)
    {
        // Njesoj: certId + pilotId sebashku
        var cert = await _dbContext.Certifications
            .FirstOrDefaultAsync(c => c.Id == certId && c.PilotId == pilotId);

        if (cert == null) return (false, "Certification not found for this pilot.");

        _dbContext.Certifications.Remove(cert);
        await _dbContext.SaveChangesAsync();
        return (true, null);
    }
}