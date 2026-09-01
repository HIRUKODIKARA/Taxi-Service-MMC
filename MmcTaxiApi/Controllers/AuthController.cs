using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MmcTaxiApi.Data;
using MmcTaxiApi.DTOs;
using MmcTaxiApi.Models;

namespace MmcTaxiApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly PasswordHasher<User> _passwordHasher;

        public AuthController(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            _passwordHasher = new PasswordHasher<User>();
        }

        // ==========================================
        // REGISTER PASSENGER
        // POST: api/auth/register
        // ==========================================
        [HttpPost("register")]
        public async Task<IActionResult> Register(
            [FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var email = request.Email
                .Trim()
                .ToLowerInvariant();

            var phone = request.Phone.Trim();

            // Check duplicate email
            var emailExists = await _context.Users
                .AnyAsync(u => u.Email.ToLower() == email);

            if (emailExists)
            {
                return BadRequest(new
                {
                    message = "An account with this email already exists."
                });
            }

            // Check duplicate phone
            var phoneExists = await _context.Users
                .AnyAsync(u => u.Phone == phone);

            if (phoneExists)
            {
                return BadRequest(new
                {
                    message = "An account with this phone number already exists."
                });
            }

            // Find PASSENGER role
            var passengerRole = await _context.Roles
                .FirstOrDefaultAsync(r =>
                    r.RoleName == "PASSENGER");

            if (passengerRole == null)
            {
                return StatusCode(500, new
                {
                    message =
                        "PASSENGER role is not configured in the database."
                });
            }

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var user = new User
                {
                    FullName = request.FullName.Trim(),
                    Email = email,
                    Phone = phone,
                    Nic = string.IsNullOrWhiteSpace(request.Nic)
                        ? null
                        : request.Nic.Trim(),
                    AccountStatus = "ACTIVE",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                user.PasswordHash =
                    _passwordHasher.HashPassword(
                        user,
                        request.Password
                    );

                _context.Users.Add(user);

                await _context.SaveChangesAsync();

                // Assign PASSENGER role
                var userRole = new UserRole
                {
                    UserId = user.UserId,
                    RoleId = passengerRole.RoleId
                };

                _context.UserRoles.Add(userRole);

                // Activity log
                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = user.UserId,
                        ActivityType = "USER_REGISTERED",
                        Description =
                            $"Passenger account created for {user.Email}.",
                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Registration successful.",
                    user = new
                    {
                        user.UserId,
                        user.FullName,
                        user.Email,
                        user.Phone,
                        user.Nic,
                        user.AccountStatus,
                        role = passengerRole.RoleName
                    }
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ==========================================
        // LOGIN
        // POST: api/auth/login
        // ==========================================
        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var email = request.Email
                .Trim()
                .ToLowerInvariant();

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == email);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            // Block inactive/suspended accounts
            if (user.AccountStatus != "ACTIVE")
            {
                if (user.AccountStatus == "SUSPENDED")
                {
                    return StatusCode(403, new
                    {
                        message =
                            "Your account has been suspended. Please contact MMC administration."
                    });
                }

                return StatusCode(403, new
                {
                    message =
                        "Your account is currently inactive."
                });
            }

            // Old TEMP_HASH accounts cannot login
            if (string.IsNullOrWhiteSpace(user.PasswordHash) ||
                user.PasswordHash == "TEMP_HASH")
            {
                return Unauthorized(new
                {
                    message =
                        "This account requires a password reset before login."
                });
            }

            var verificationResult =
                _passwordHasher.VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    request.Password
                );

            if (verificationResult ==
                PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            // Get all roles assigned to the user
            var roles = await (
                from userRole in _context.UserRoles
                join role in _context.Roles
                    on userRole.RoleId equals role.RoleId
                where userRole.UserId == user.UserId
                select role.RoleName
            )
            .Distinct()
            .ToListAsync();

            if (roles.Count == 0)
            {
                return StatusCode(403, new
                {
                    message =
                        "No system role is assigned to this account."
                });
            }

            var token = GenerateJwtToken(
                user,
                roles
            );

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = user.UserId,
                    ActivityType = "USER_LOGIN",
                    Description =
                        $"User {user.Email} logged into the system.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Login successful.",
                token,

                user = new
                {
                    user.UserId,
                    user.FullName,
                    user.Email,
                    user.Phone,
                    user.Nic,
                    user.AccountStatus,

                    role = roles.FirstOrDefault(),
                    roles
                }
            });
        }

        // ==========================================
        // JWT TOKEN GENERATION
        // ==========================================
        private string GenerateJwtToken(
            User user,
            List<string> roles)
        {
            var jwtKey =
                _configuration["Jwt:Key"];

            var jwtIssuer =
                _configuration["Jwt:Issuer"];

            var jwtAudience =
                _configuration["Jwt:Audience"];

            var expiryMinutesText =
                _configuration["Jwt:ExpiryMinutes"];

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

            var expiryMinutes = 120;

            if (int.TryParse(
                    expiryMinutesText,
                    out var configuredExpiry) &&
                configuredExpiry > 0)
            {
                expiryMinutes = configuredExpiry;
            }

            var claims = new List<Claim>
            {
                new Claim(
                    JwtRegisteredClaimNames.Sub,
                    user.UserId.ToString()
                ),

                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.UserId.ToString()
                ),

                new Claim(
                    ClaimTypes.Name,
                    user.FullName
                ),

                new Claim(
                    ClaimTypes.Email,
                    user.Email
                ),

                new Claim(
                    JwtRegisteredClaimNames.Email,
                    user.Email
                ),

                new Claim(
                    JwtRegisteredClaimNames.Jti,
                    Guid.NewGuid().ToString()
                )
            };

            // Add role claims
            foreach (var role in roles)
            {
                claims.Add(
                    new Claim(
                        ClaimTypes.Role,
                        role
                    )
                );
            }

            var securityKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey)
                );

            var credentials =
                new SigningCredentials(
                    securityKey,
                    SecurityAlgorithms.HmacSha256
                );

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow
                    .AddMinutes(expiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }
    }
}