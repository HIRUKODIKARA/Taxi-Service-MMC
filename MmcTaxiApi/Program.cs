using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

using MmcTaxiApi.Authorization;
using MmcTaxiApi.Data;

var builder = WebApplication.CreateBuilder(args);


// =========================================================
// CONTROLLERS
// =========================================================
builder.Services.AddControllers();


// =========================================================
// DATABASE
// =========================================================
var connectionString =
    builder.Configuration.GetConnectionString(
        "DefaultConnection"
    );

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "DefaultConnection is not configured."
    );
}

builder.Services.AddDbContext<ApplicationDbContext>(
    options =>
        options.UseMySQL(connectionString)
);


// =========================================================
// CORS
// =========================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowReactApp",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "http://localhost:5174",
                    "http://127.0.0.1:5174"
                )
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    );
});


// =========================================================
// JWT CONFIGURATION
// =========================================================
var jwtKey =
    builder.Configuration["Jwt:Key"];

var jwtIssuer =
    builder.Configuration["Jwt:Issuer"];

var jwtAudience =
    builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "JWT Key is not configured."
    );
}

if (string.IsNullOrWhiteSpace(jwtIssuer))
{
    throw new InvalidOperationException(
        "JWT Issuer is not configured."
    );
}

if (string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException(
        "JWT Audience is not configured."
    );
}


// =========================================================
// AUTHENTICATION
// =========================================================
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            jwtKey
                        )
                    ),

                ClockSkew = TimeSpan.Zero
            };
    });


// =========================================================
// ROLE AUTHORIZATION
// =========================================================
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(
        "SuperAdminOnly",
        policy =>
            policy.RequireRole(
                "SUPER_ADMIN"
            )
    );

    options.AddPolicy(
        "AdminOnly",
        policy =>
            policy.RequireRole(
                "SUPER_ADMIN",
                "ADMIN"
            )
    );

    options.AddPolicy(
        "OperationsOnly",
        policy =>
            policy.RequireRole(
                "SUPER_ADMIN",
                "ADMIN",
                "TAXI_OPERATIONS"
            )
    );

    options.AddPolicy(
        "DriverOnly",
        policy =>
            policy.RequireRole(
                "DRIVER"
            )
    );

    options.AddPolicy(
        "PassengerOnly",
        policy =>
            policy.RequireRole(
                "PASSENGER"
            )
    );

    options.AddPolicy(
        "AuthenticatedUser",
        policy =>
            policy.RequireAuthenticatedUser()
    );
});


// =========================================================
// DATABASE PERMISSION AUTHORIZATION
// =========================================================

// Handles:
// [HasPermission("VIEW_USERS")]
// [HasPermission("MANAGE_BOOKINGS")]
// etc.
builder.Services.AddScoped<
    IAuthorizationHandler,
    PermissionAuthorizationHandler
>();

// Dynamically creates policies such as:
// Permission:VIEW_USERS
// Permission:MANAGE_USERS
// Permission:VIEW_REPORTS
builder.Services.AddSingleton<
    IAuthorizationPolicyProvider,
    PermissionPolicyProvider
>();


// =========================================================
// OPEN API
// =========================================================
builder.Services.AddOpenApi();


var app = builder.Build();


// =========================================================
// DEVELOPMENT
// =========================================================
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


// =========================================================
// MIDDLEWARE
// =========================================================

// Local development currently uses HTTP.
// HTTPS can be configured for deployment later.
// app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseAuthentication();

app.UseAuthorization();


// =========================================================
// CONTROLLERS
// =========================================================
app.MapControllers();


// =========================================================
// DATABASE TEST
// =========================================================
app.MapGet(
    "/api/database-test",
    async (ApplicationDbContext db) =>
    {
        try
        {
            var canConnect =
                await db.Database
                    .CanConnectAsync();

            if (canConnect)
            {
                return Results.Ok(
                    new
                    {
                        success = true,
                        message =
                            "Successfully connected to MMC Taxi MySQL Database"
                    }
                );
            }

            return Results.Problem(
                "Could not connect to database."
            );
        }
        catch
        {
            return Results.Problem(
                "Database connection test failed."
            );
        }
    }
);


// =========================================================
// ROOT
// =========================================================
app.MapGet(
    "/",
    () => "MMC Taxi API is running"
);


app.Run();