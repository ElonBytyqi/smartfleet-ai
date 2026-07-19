using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SmartFleet.Domain.Entites;
using SmartFleet.Domain.Entities;
using SmartFleet.Infrastructure.Identity;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Infrastructure.Persistence
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<DroneModel> DroneModels => Set<DroneModel>();
        public DbSet<Drone> Drones => Set<Drone>();
        public DbSet<DroneComponent> DroneComponents => Set<DroneComponent>();
        public DbSet<Battery> Batteries => Set<Battery>();
        public DbSet<Pilot> Pilots => Set<Pilot>();
        public DbSet<Certification> Certifications => Set<Certification>();
        public DbSet<FlightZone> FlightZones => Set<FlightZone>();
        public DbSet<Mission> Missions => Set<Mission>();
        public DbSet<MissionWaypoint> MissionWaypoints => Set<MissionWaypoint>();
        public DbSet<PreFlightChecklist> PreFlightChecklists => Set<PreFlightChecklist>();
        public DbSet<PostFlightReport> PostFlightReports => Set<PostFlightReport>();
        public DbSet<MaintenanceRecord> MaintenanceRecords => Set<MaintenanceRecord>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();


        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Mission relationships me shumë FK opsionale -> shmang cascade delete konfliktesh
            builder.Entity<Mission>()
                .HasOne(m => m.Drone)
                .WithMany()
                .HasForeignKey(m => m.DroneId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Mission>()
                .HasOne(m => m.Pilot)
                .WithMany()
                .HasForeignKey(m => m.PilotId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Mission>()
                .HasOne(m => m.Battery)
                .WithMany()
                .HasForeignKey(m => m.BatteryId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Mission>()
                .HasOne(m => m.FlightZone)
                .WithMany(fz => fz.Missions)
                .HasForeignKey(m => m.FlightZoneId)
                .OnDelete(DeleteBehavior.Restrict);

            // 1-me-1: Mission <-> PreFlightChecklist / PostFlightReport
            builder.Entity<Mission>()
                .HasOne(m => m.PreFlightChecklist)
                .WithOne(c => c.Mission)
                .HasForeignKey<PreFlightChecklist>(c => c.MissionId);

            builder.Entity<Mission>()
                .HasOne(m => m.PostFlightReport)
                .WithOne(r => r.Mission)
                .HasForeignKey<PostFlightReport>(r => r.MissionId);

            // Battery -> Drone (nullable, mos e fshij dronin nëse ka bateri)
            builder.Entity<Battery>()
                .HasOne(b => b.Drone)
                .WithMany(d => d.Batteries)
                .HasForeignKey(b => b.DroneId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Entity<RefreshToken>()
    .HasIndex(rt => rt.Token)

                    .IsUnique();

            // Unique constraints
            builder.Entity<Drone>().HasIndex(d => d.SerialNumber).IsUnique();
            builder.Entity<Battery>().HasIndex(b => b.SerialNumber).IsUnique();
            builder.Entity<Pilot>().HasIndex(p => p.LicenseNumber).IsUnique();
        }

    }
}
