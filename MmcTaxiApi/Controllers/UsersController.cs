using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MmcTaxiApi.Data;
using MmcTaxiApi.Models;

namespace MmcTaxiApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // HELPER - Get logged-in user ID from JWT
        // =========================================================
        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (claim == null)
            {
                return null;
            }

            if (!int.TryParse(claim.Value, out var userId))
            {
                return null;
            }

            return userId;
        }

        // =========================================================
        // HELPER - Check Admin / Super Admin
        // =========================================================
        private bool IsAdminOrSuperAdmin()
        {
            return User.IsInRole("SUPER_ADMIN") ||
                   User.IsInRole("ADMIN");
        }

        // =========================================================
        // HELPER - Check Super Admin
        // =========================================================
        private bool IsSuperAdmin()
        {
            return User.IsInRole("SUPER_ADMIN");
        }

        // =========================================================
        // GET: api/users
        // Admin / Super Admin only
        // =========================================================
        [HttpGet]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult> GetUsers()
        {
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.Nic,
                    u.AccountStatus,
                    u.CreatedAt,
                    u.UpdatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // =========================================================
        // GET: api/users/me
        // Logged-in user gets own profile
        // =========================================================
        [HttpGet("me")]
        public async Task<ActionResult> GetMyProfile()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify the logged-in user."
                });
            }

            var user = await _context.Users
                .Where(u => u.UserId == currentUserId.Value)
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.Nic,
                    u.AccountStatus,
                    u.CreatedAt,
                    u.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            return Ok(user);
        }

        // =========================================================
        // GET: api/users/5
        // Own profile OR Admin / Super Admin
        // =========================================================
        [HttpGet("{id}")]
        public async Task<ActionResult> GetUser(int id)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify the logged-in user."
                });
            }

            if (currentUserId.Value != id &&
                !IsAdminOrSuperAdmin())
            {
                return StatusCode(403, new
                {
                    message =
                        "You do not have permission to view this user."
                });
            }

            var user = await _context.Users
                .Where(u => u.UserId == id)
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.Nic,
                    u.AccountStatus,
                    u.CreatedAt,
                    u.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            return Ok(user);
        }

        // =========================================================
        // PUT: api/users/5
        // User can edit own profile.
        // Admin / Super Admin can also edit user profile details.
        // =========================================================
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateUser(
            int id,
            [FromBody] UpdateUserRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify the logged-in user."
                });
            }

            if (currentUserId.Value != id &&
                !IsAdminOrSuperAdmin())
            {
                return StatusCode(403, new
                {
                    message =
                        "You do not have permission to update this user."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest(new
                {
                    message = "Full name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new
                {
                    message = "Email is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Phone))
            {
                return BadRequest(new
                {
                    message = "Phone number is required."
                });
            }

            var normalizedEmail = request.Email
                .Trim()
                .ToLowerInvariant();

            var normalizedPhone = request.Phone.Trim();

            var duplicateEmail = await _context.Users
                .AnyAsync(u =>
                    u.UserId != id &&
                    u.Email.ToLower() == normalizedEmail
                );

            if (duplicateEmail)
            {
                return BadRequest(new
                {
                    message =
                        "This email address is already registered."
                });
            }

            var duplicatePhone = await _context.Users
                .AnyAsync(u =>
                    u.UserId != id &&
                    u.Phone == normalizedPhone
                );

            if (duplicatePhone)
            {
                return BadRequest(new
                {
                    message =
                        "This phone number is already registered."
                });
            }

            var oldName = user.FullName;
            var oldEmail = user.Email;
            var oldPhone = user.Phone;

            user.FullName = request.FullName.Trim();
            user.Email = normalizedEmail;
            user.Phone = normalizedPhone;
            user.UpdatedAt = DateTime.Now;

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType = "USER_PROFILE_UPDATED",
                    Description =
                        $"User #{id} profile updated. " +
                        $"Name: '{oldName}' -> '{user.FullName}', " +
                        $"Email: '{oldEmail}' -> '{user.Email}', " +
                        $"Phone: '{oldPhone}' -> '{user.Phone}'.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User profile updated successfully.",
                user = new
                {
                    user.UserId,
                    user.FullName,
                    user.Email,
                    user.Phone,
                    user.Nic,
                    user.AccountStatus,
                    user.UpdatedAt
                }
            });
        }

        // =========================================================
        // PUT: api/users/5/status
        // Admin / Super Admin only
        // =========================================================
        [HttpPut("{id}/status")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult> UpdateAccountStatus(
            int id,
            [FromBody] UserStatusRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify the logged-in user."
                });
            }

            if (currentUserId.Value == id)
            {
                return BadRequest(new
                {
                    message =
                        "You cannot change your own account status."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var targetRoles = await (
                from userRole in _context.UserRoles
                join role in _context.Roles
                    on userRole.RoleId equals role.RoleId
                where userRole.UserId == id
                select role.RoleName
            ).ToListAsync();

            // ADMIN cannot disable/suspend a SUPER_ADMIN
            if (!IsSuperAdmin() &&
                targetRoles.Contains("SUPER_ADMIN"))
            {
                return StatusCode(403, new
                {
                    message =
                        "Only a Super Admin can manage a Super Admin account."
                });
            }

            var allowedStatuses = new[]
            {
                "ACTIVE",
                "INACTIVE",
                "SUSPENDED"
            };

            var newStatus = request.Status?
                .Trim()
                .ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(newStatus) ||
                !allowedStatuses.Contains(newStatus))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid account status. Allowed values: ACTIVE, INACTIVE, SUSPENDED."
                });
            }

            var oldStatus = user.AccountStatus;

            if (oldStatus == newStatus)
            {
                return Ok(new
                {
                    message =
                        $"User account is already {newStatus}.",
                    user = new
                    {
                        user.UserId,
                        user.FullName,
                        user.Email,
                        user.AccountStatus
                    }
                });
            }

            user.AccountStatus = newStatus;
            user.UpdatedAt = DateTime.Now;

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType = "USER_STATUS_CHANGED",
                    Description =
                        $"User #{id} account status changed from {oldStatus} to {newStatus}.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "User account status updated successfully.",
                user = new
                {
                    user.UserId,
                    user.FullName,
                    user.Email,
                    user.AccountStatus
                }
            });
        }

        // =========================================================
        // PUT: api/users/5/activate
        // Admin / Super Admin only
        // =========================================================
        [HttpPut("{id}/activate")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult> ActivateUser(int id)
        {
            return await ChangeAccountStatus(
                id,
                "ACTIVE"
            );
        }

        // =========================================================
        // PUT: api/users/5/deactivate
        // Admin / Super Admin only
        // =========================================================
        [HttpPut("{id}/deactivate")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult> DeactivateUser(int id)
        {
            return await ChangeAccountStatus(
                id,
                "INACTIVE"
            );
        }

        // =========================================================
        // PUT: api/users/5/suspend
        // Admin / Super Admin only
        // =========================================================
        [HttpPut("{id}/suspend")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult> SuspendUser(int id)
        {
            return await ChangeAccountStatus(
                id,
                "SUSPENDED"
            );
        }

        // =========================================================
        // PRIVATE STATUS HELPER
        // =========================================================
        private async Task<ActionResult> ChangeAccountStatus(
            int id,
            string newStatus)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify the logged-in user."
                });
            }

            if (currentUserId.Value == id)
            {
                return BadRequest(new
                {
                    message =
                        "You cannot change your own account status."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var targetRoles = await (
                from userRole in _context.UserRoles
                join role in _context.Roles
                    on userRole.RoleId equals role.RoleId
                where userRole.UserId == id
                select role.RoleName
            ).ToListAsync();

            if (!IsSuperAdmin() &&
                targetRoles.Contains("SUPER_ADMIN"))
            {
                return StatusCode(403, new
                {
                    message =
                        "Only a Super Admin can manage a Super Admin account."
                });
            }

            var oldStatus = user.AccountStatus;

            if (oldStatus == newStatus)
            {
                return Ok(new
                {
                    message =
                        $"User account is already {newStatus}.",
                    user = new
                    {
                        user.UserId,
                        user.FullName,
                        user.Email,
                        user.AccountStatus
                    }
                });
            }

            user.AccountStatus = newStatus;
            user.UpdatedAt = DateTime.Now;

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType = "USER_STATUS_CHANGED",
                    Description =
                        $"User #{id} account status changed from {oldStatus} to {newStatus}.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    $"User account changed to {newStatus} successfully.",
                user = new
                {
                    user.UserId,
                    user.FullName,
                    user.Email,
                    user.AccountStatus
                }
            });
        }
    }

    // =============================================================
    // PROFILE UPDATE DTO
    // =============================================================
    public class UpdateUserRequest
    {
        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;
    }

    // =============================================================
    // ACCOUNT STATUS DTO
    // =============================================================
    public class UserStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}