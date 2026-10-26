using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SmartFleet.Domain.Entites;
using SmartFleet.Domain.Entities;
using SmartFleet.Infrastructure.Identity;
using System;
using System.Collections.Generic;
using System.Reflection.Emit;
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
        public DbSet<Alert> Alerts => Set<Alert>();
        public DbSet<Setting> Settings => Set<Setting>();


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


            builder.Entity<Setting>(e =>
            {
                e.HasIndex(s => s.Key).IsUnique();
                e.Property(s => s.Key).HasMaxLength(100);
                e.Property(s => s.Value).HasMaxLength(500);
                e.Property(s => s.DefaultValue).HasMaxLength(500);
                e.Property(s => s.Category).HasMaxLength(60);
                e.Property(s => s.Label).HasMaxLength(200);
            });

            builder.Entity<RefreshToken>()
    .HasIndex(rt => rt.Token)

                    .IsUnique();

            // Unique constraints
            builder.Entity<Drone>().HasIndex(d => d.SerialNumber).IsUnique();
            builder.Entity<Battery>().HasIndex(b => b.SerialNumber).IsUnique();
            builder.Entity<Pilot>().HasIndex(p => p.LicenseNumber).IsUnique();


            builder.Entity<Alert>(entity =>
            {
                entity.Property(a => a.AlertType).HasMaxLength(60).IsRequired();
                entity.Property(a => a.Message).HasMaxLength(500).IsRequired();
                entity.Property(a => a.DeduplicationKey).HasMaxLength(200).IsRequired();

                // Kerkimi i alarmeve aktive duhet te jete i shpejte
                entity.HasIndex(a => new { a.Status, a.CreatedAt });
                entity.HasIndex(a => a.DeduplicationKey);
                entity.HasIndex(a => a.DroneId);

                entity.HasOne(a => a.Drone)
                    .WithMany()
                    .HasForeignKey(a => a.DroneId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(a => a.Mission)
                    .WithMany()
                    .HasForeignKey(a => a.MissionId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(a => a.Battery)
                    .WithMany()
                    .HasForeignKey(a => a.BatteryId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(a => a.Pilot)
                    .WithMany()
                    .HasForeignKey(a => a.PilotId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }

    }
}
