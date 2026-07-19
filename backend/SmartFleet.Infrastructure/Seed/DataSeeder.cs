using Microsoft.AspNetCore.Identity;
using SmartFleet.Infrastructure.Identity;
using System;
using System.Collections.Generic;
using System.Text;

namespace SmartFleet.Infrastructure.Seed
{
    public static class DataSeeder
    {
        private static readonly string[] Roles =
        {
        "Admin",
        "FleetManager",
        "Pilot",
        "MaintenanceTechnician",
        "Operator"
    };

        public static async Task SeedRolesAsync(RoleManager<IdentityRole<Guid>> roleManager)
        {
            Console.WriteLine(">>> SEEDER: Duke krijuar rolet...");
            foreach (var roleName in Roles)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    var result = await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
                    Console.WriteLine(result.Succeeded
                        ? $">>> SEEDER: Roli '{roleName}' u krijua."
                        : $">>> SEEDER: DESHTOI roli '{roleName}': {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }
        }

        public static async Task SeedAdminUserAsync(UserManager<ApplicationUser> userManager)
        {
            const string adminEmail = "admin@smartfleet.com";
            const string adminPassword = "Admin1234!";

            Console.WriteLine(">>> SEEDER: Duke kontrolluar admin user...");

            var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
            if (existingAdmin != null)
            {
                Console.WriteLine(">>> SEEDER: Admin ekziston tashme, skip.");
                return;
            }

            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "System Administrator",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(admin, adminPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
                Console.WriteLine(">>> SEEDER: Admin u krijua me sukses!");
            }
            else
            {
                Console.WriteLine(">>> SEEDER: DESHTOI krijimi i admin:");
                foreach (var error in result.Errors)
                {
                    Console.WriteLine($">>>   - {error.Code}: {error.Description}");
                }
            }
        }
    }
}
