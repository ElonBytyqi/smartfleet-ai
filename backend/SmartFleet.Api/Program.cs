
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Infrastructure.Identity;
using SmartFleet.Infrastructure.Persistence;
using SmartFleet.Infrastructure.Seed;
using SmartFleet.Infrastructure.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ======================================
// 1. REGJISTRIMI I SHËRBIMEVE
// ======================================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"));
});

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequiredLength = 8;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IDroneService, DroneService>();
builder.Services.AddScoped<IDroneModelService, DroneModelService>();
builder.Services.AddScoped<IBatteryService, BatteryService>();
builder.Services.AddScoped<IPilotService, PilotService>();
builder.Services.AddScoped<IFlightZoneService, FlightZoneService>();
builder.Services.AddScoped<IMissionService, MissionService>();


// ======================================
// 2. JWT AUTHENTICATION
// ======================================

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],

                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(
                        builder.Configuration["Jwt:Key"]
                        ?? throw new InvalidOperationException(
                            "Jwt:Key mungon në appsettings.json.")))
            };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine(
                    $">>> JWT FAILED: " +
                    $"{context.Exception.GetType().Name}: " +
                    $"{context.Exception.Message}");

                return Task.CompletedTask;
            },

            OnChallenge = context =>
            {
                Console.WriteLine(
                    $">>> JWT CHALLENGE: " +
                    $"{context.Error}, " +
                    $"{context.ErrorDescription}");

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddAuthorization();

// ======================================
// 3. SWAGGER + JWT
// ======================================

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description =
                "Ngjit vetëm access token-in, pa fjalën Bearer."
        });

    options.AddSecurityRequirement(doc =>
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecuritySchemeReference("Bearer", doc),
                new List<string>()
            }
        });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// ======================================
// 4. BUILD
// ======================================

var app = builder.Build();

// ======================================
// 5. SEED DATA
// ======================================

using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    await DataSeeder.SeedRolesAsync(roleManager);
    await DataSeeder.SeedAdminUserAsync(userManager);
    await DataSeeder.SeedFleetAsync(dbContext, userManager);
}

// ======================================
// 6. MIDDLEWARE PIPELINE
// ======================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

