using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MmcTaxiApi.Data;

var builder = WebApplication.CreateBuilder(args);

// =========================
// Controllers
// =========================
builder.Services.AddControllers();


// =========================
// Database
// =========================
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "DefaultConnection is not configured."
    );
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySQL(connectionString)
);


// =========================
// CORS
// =========================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});


// =========================
// JWT Configuration
// =========================
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

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
                        Encoding.UTF8.GetBytes(jwtKey)
                    ),

                ClockSkew = TimeSpan.Zero
            };
    });


// =========================
// Role Authorization
// =========================
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(
        "SuperAdminOnly",
        policy => policy.RequireRole("SUPER_ADMIN")
    );

    options.AddPolicy(
        "AdminOnly",
        policy => policy.RequireRole(
            "SUPER_ADMIN",
            "ADMIN"
        )
    );

    options.AddPolicy(
        "OperationsOnly",
        policy => policy.RequireRole(
            "SUPER_ADMIN",
            "ADMIN",
            "TAXI_OPERATIONS"
        )
    );

    options.AddPolicy(
        "DriverOnly",
        policy => policy.RequireRole("DRIVER")
    );

    options.AddPolicy(
        "PassengerOnly",
        policy => policy.RequireRole("PASSENGER")
    );

    options.AddPolicy(
        "AuthenticatedUser",
        policy => policy.RequireAuthenticatedUser()
    );
});


// =========================
// OpenAPI
// =========================
builder.Services.AddOpenApi();


var app = builder.Build();


// =========================
// Development
// =========================
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


// =========================
// Middleware
// =========================

// For now HTTP localhost is being used.
// We can enable HTTPS redirection later after HTTPS is configured.
// app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseAuthentication();

app.UseAuthorization();


// =========================
// Controllers
// =========================
app.MapControllers();


// =========================
// Database Test
// =========================
app.MapGet(
    "/api/database-test",
    async (ApplicationDbContext db) =>
    {
        try
        {
            var canConnect =
                await db.Database.CanConnectAsync();

            if (canConnect)
            {
                return Results.Ok(new
                {
                    success = true,
                    message =
                        "Successfully connected to MMC Taxi MySQL Database"
                });
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


// =========================
// Root
// =========================
app.MapGet(
    "/",
    () => "MMC Taxi API is running"
);


app.Run();