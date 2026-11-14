
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using SmartFleet.Api.Hubs;
using SmartFleet.Application.DTOs;
using SmartFleet.Application.Services;
using SmartFleet.Infrastructure.Identity;
using SmartFleet.Infrastructure.Persistence;
using SmartFleet.Infrastructure.Seed;
using SmartFleet.Infrastructure.Services;
using SmartFleet.Infrastructure.Telemetry;
using StackExchange.Redis;
using System.Text;



using Serilog;
using Serilog.Events;

// Logger fillestar — kap edhe gabimet gjatë nisjes, para se të lexohet konfigurimi
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("SmartFleet po niset...");

    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, config) => config
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext());



// ======================================
// 1. REGJISTRIMI I SHËRBIMEVE
// ======================================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuditInterceptor>();

builder.Services.AddDbContext<ApplicationDbContext>((sp, options) =>
    options
        .UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
        .AddInterceptors(sp.GetRequiredService<AuditInterceptor>()));

// MongoDB — singleton sepse klienti eshte thread-safe dhe menaxhon vete lidhjet
builder.Services.AddSingleton<TelemetryDbContext>();

// Redis
builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(builder.Configuration["Redis:ConnectionString"]!));
builder.Services.AddSingleton<ILiveStateService, LiveStateService>();
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
builder.Services.AddScoped<IMaintenanceService, MaintenanceService>();
builder.Services.AddScoped<IFlightRecordService, FlightRecordService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITelemetryService, TelemetryService>();
builder.Services.AddHttpClient<IAiService, AiService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IAlertService, AlertService>();
builder.Services.AddHostedService<AlertCleanupService>();

builder.Services.AddSignalR();
builder.Services.AddSingleton<ITelemetryBroadcaster, TelemetryBroadcaster>();


QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
builder.Services.AddScoped<IReportService, ReportService>();


builder.Services.AddScoped<ISettingsService, SettingsService>();

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
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;

                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                Log.Warning("Autentikimi JWT dështoi: {Reason}", context.Exception.Message);
                return Task.CompletedTask;
            },

            OnChallenge = context =>
            {
                Log.Debug("JWT challenge: {Error} {Description}",
                    context.Error, context.ErrorDescription);
                return Task.CompletedTask;
            }
        };
    });

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
              .AllowAnyMethod()
              .AllowCredentials());

});


// ======================================
// 4. BUILD
// ======================================

var app = builder.Build();


    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate =
            "{RequestMethod} {RequestPath} → {StatusCode} në {Elapsed:0} ms";

        // Kërkesat e ngadalta dhe gabimet dalin si Warning
        options.GetLevel = (http, elapsed, ex) =>
        http.Request.Path.StartsWithSegments("/swagger") ? LogEventLevel.Verbose
        : ex != null || http.Response.StatusCode >= 500 ? LogEventLevel.Error
        : http.Response.StatusCode >= 400 ? LogEventLevel.Warning
        : elapsed > 2500 ? LogEventLevel.Warning
        : LogEventLevel.Information;

        options.EnrichDiagnosticContext = (ctx, http) =>
        {
            ctx.Set("UserName", http.User.Identity?.Name ?? "anonim");
            ctx.Set("ClientIp", http.Connection.RemoteIpAddress?.ToString() ?? "-");
        };
    });


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

    await SettingsSeeder.SeedAsync(dbContext);        // mbush tabelën

    var settings = scope.ServiceProvider.GetRequiredService<ISettingsService>();
    await settings.WarmUpAsync();                     // pastaj cache-in
}

// ======================================
// 6. MIDDLEWARE PIPELINE
// ======================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.MapHub<TelemetryHub>("/hubs/telemetry");
app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "SmartFleet dështoi gjatë nisjes.");
}
finally
{
    Log.CloseAndFlush();
}

