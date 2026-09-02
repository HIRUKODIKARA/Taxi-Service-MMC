using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MmcTaxiApi.Authorization;
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
        private readonly PasswordHasher<User> _passwordHasher;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
            _passwordHasher = new PasswordHasher<User>();
        }

        // =========================================================
        // HELPER - Current logged-in user ID
        // =========================================================
        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (claim == null)
                return null;

            if (!int.TryParse(claim.Value, out var userId))
                return null;

            return userId;
        }

        // =========================================================
        // HELPER - Admin / Super Admin
        // =========================================================
        private bool IsAdminOrSuperAdmin()
        {
            return User.IsInRole("SUPER_ADMIN") ||
                   User.IsInRole("ADMIN");
        }

        // =========================================================
        // HELPER - Super Admin
        // =========================================================
        private bool IsSuperAdmin()
        {
            return User.IsInRole("SUPER_ADMIN");
        }

        // =========================================================
        // HELPER - Dynamic database permission check
        // =========================================================
        private async Task<bool> HasPermissionAsync(
            string permissionName)
        {
            // Super Admin always has full access.
            if (IsSuperAdmin())
                return true;

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
                return false;

            return await (
                from userRole in _context.UserRoles
                join rolePermission in _context.RolePermissions
                    on userRole.RoleId equals rolePermission.RoleId
                join permission in _context.Permissions
                    on rolePermission.PermissionId equals permission.PermissionId
                where userRole.UserId == currentUserId.Value
                      && permission.PermissionName == permissionName
                select permission
            ).AnyAsync();
        }

        // =========================================================
        // GET: api/users
        // Admin / Super Admin
        // =========================================================
        [HttpGet]
        [HasPermission("VIEW_USERS")]
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
                    u.UpdatedAt,

                    Roles = (
                        from userRole in _context.UserRoles
                        join role in _context.Roles
                            on userRole.RoleId equals role.RoleId
                        where userRole.UserId == u.UserId
                        select role.RoleName
                    ).ToList()
                })
                .ToListAsync();

            return Ok(users);
        }

        // =========================================================
        // POST: api/users
        // SUPER ADMIN ONLY
        // =========================================================
        [HttpPost]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult> CreateUser(
            [FromBody] CreateSystemUserRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify the logged-in user."
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

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Password is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.ConfirmPassword))
            {
                return BadRequest(new
                {
                    message = "Confirm password is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Role))
            {
                return BadRequest(new
                {
                    message = "Role is required."
                });
            }

            if (request.Password != request.ConfirmPassword)
            {
                return BadRequest(new
                {
                    message =
                        "Password and confirm password do not match."
                });
            }

            if (request.Password.Length < 8 ||
                request.Password.Length > 100)
            {
                return BadRequest(new
                {
                    message =
                        "Password must contain between 8 and 100 characters."
                });
            }

            if (!request.Password.Any(char.IsUpper) ||
                !request.Password.Any(char.IsLower) ||
                !request.Password.Any(char.IsDigit))
            {
                return BadRequest(new
                {
                    message =
                        "Password must contain an uppercase letter, lowercase letter and number."
                });
            }

            var normalizedEmail =
                request.Email.Trim().ToLowerInvariant();

            var normalizedPhone =
                request.Phone.Trim();

            var normalizedRole =
                request.Role.Trim().ToUpperInvariant();

            if (normalizedRole == "TAXI OPERATOR" ||
                normalizedRole == "TAXI_OPERATOR")
            {
                normalizedRole = "TAXI_OPERATIONS";
            }

            var allowedRoles = new[]
            {
                "ADMIN",
                "TAXI_OPERATIONS",
                "DRIVER",
                "PASSENGER"
            };

            if (!allowedRoles.Contains(normalizedRole))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid role. Allowed roles: Admin, Taxi Operator, Driver and Passenger."
                });
            }

            var emailExists = await _context.Users
                .AnyAsync(u =>
                    u.Email.ToLower() == normalizedEmail);

            if (emailExists)
            {
                return BadRequest(new
                {
                    message =
                        "This email address is already registered."
                });
            }

            var phoneExists = await _context.Users
                .AnyAsync(u =>
                    u.Phone == normalizedPhone);

            if (phoneExists)
            {
                return BadRequest(new
                {
                    message =
                        "This phone number is already registered."
                });
            }

            var role = await _context.Roles
                .FirstOrDefaultAsync(r =>
                    r.RoleName == normalizedRole);

            if (role == null)
            {
                return BadRequest(new
                {
                    message =
                        "Selected role is not configured in the database."
                });
            }

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var user = new User
                {
                    FullName = request.FullName.Trim(),
                    Email = normalizedEmail,
                    Phone = normalizedPhone,

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

                var userRole = new UserRole
                {
                    UserId = user.UserId,
                    RoleId = role.RoleId
                };

                _context.UserRoles.Add(userRole);

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,
                        ActivityType =
                            "USER_CREATED_BY_SUPER_ADMIN",

                        Description =
                            $"User '{user.Email}' created with role '{role.RoleName}'.",

                        CreatedAt = DateTime.Now
                    }
                );

                // IMPORTANT:
                // Welcome notification removed for now because
                // notifications.notification_type does not accept "ACCOUNT".

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "User created successfully.",

                    user = new
                    {
                        user.UserId,
                        user.FullName,
                        user.Email,
                        user.Phone,
                        user.Nic,
                        user.AccountStatus,

                        Role = role.RoleName,

                        RoleDisplayName =
                            GetRoleDisplayName(role.RoleName),

                        user.CreatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "An error occurred while creating the user.",

                    detail = ex.InnerException?.Message ??
                             ex.Message
                });
            }
        }

        // =========================================================
        // GET: api/users/me
        // =========================================================
        [HttpGet("me")]
        public async Task<ActionResult> GetMyProfile()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Unable to identify the logged-in user."
                });
            }

            var user = await _context.Users
                .Where(u =>
                    u.UserId == currentUserId.Value)
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.Nic,
                    u.AccountStatus,
                    u.CreatedAt,
                    u.UpdatedAt,

                    Roles = (
                        from userRole in _context.UserRoles
                        join role in _context.Roles
                            on userRole.RoleId equals role.RoleId
                        where userRole.UserId == u.UserId
                        select role.RoleName
                    ).ToList()
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
        // =========================================================
        [HttpGet("{id:int}")]
        public async Task<ActionResult> GetUser(int id)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Unable to identify the logged-in user."
                });
            }

            if (currentUserId.Value != id)
            {
                var canViewUsers =
                    await HasPermissionAsync("VIEW_USERS");

                if (!canViewUsers)
                {
                    return StatusCode(403, new
                    {
                        message =
                            "You do not have VIEW_USERS permission."
                    });
                }
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
                    u.UpdatedAt,

                    Roles = (
                        from userRole in _context.UserRoles
                        join role in _context.Roles
                            on userRole.RoleId equals role.RoleId
                        where userRole.UserId == u.UserId
                        select role.RoleName
                    ).ToList()
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
        // =========================================================
        [HttpPut("{id:int}")]
        public async Task<ActionResult> UpdateUser(
            int id,
            [FromBody] UpdateUserRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Unable to identify the logged-in user."
                });
            }

            if (currentUserId.Value != id)
            {
                var canManageUsers =
                    await HasPermissionAsync("MANAGE_USERS");

                if (!canManageUsers)
                {
                    return StatusCode(403, new
                    {
                        message =
                            "You do not have MANAGE_USERS permission."
                    });
                }
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.UserId == id);

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

            if (currentUserId.Value != id &&
                !IsSuperAdmin() &&
                targetRoles.Contains("SUPER_ADMIN"))
            {
                return StatusCode(403, new
                {
                    message =
                        "Only a Super Admin can edit a Super Admin account."
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

            var normalizedEmail =
                request.Email.Trim().ToLowerInvariant();

            var normalizedPhone =
                request.Phone.Trim();

            var duplicateEmail =
                await _context.Users.AnyAsync(u =>
                    u.UserId != id &&
                    u.Email.ToLower() == normalizedEmail);

            if (duplicateEmail)
            {
                return BadRequest(new
                {
                    message =
                        "This email address is already registered."
                });
            }

            var duplicatePhone =
                await _context.Users.AnyAsync(u =>
                    u.UserId != id &&
                    u.Phone == normalizedPhone);

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
            var oldNic = user.Nic;

            user.FullName = request.FullName.Trim();
            user.Email = normalizedEmail;
            user.Phone = normalizedPhone;

            user.Nic =
                string.IsNullOrWhiteSpace(request.Nic)
                    ? null
                    : request.Nic.Trim();

            user.UpdatedAt = DateTime.Now;

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,

                    ActivityType =
                        "USER_PROFILE_UPDATED",

                    Description =
                        $"User #{id} profile updated. " +
                        $"Name: '{oldName}' -> '{user.FullName}', " +
                        $"Email: '{oldEmail}' -> '{user.Email}', " +
                        $"Phone: '{oldPhone}' -> '{user.Phone}', " +
                        $"NIC: '{oldNic}' -> '{user.Nic}'.",

                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "User profile updated successfully.",

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
        // =========================================================
        [HttpPut("{id:int}/status")]
        [HasPermission("MANAGE_USERS")]
        public async Task<ActionResult> UpdateAccountStatus(
            int id,
            [FromBody] UserStatusRequest request)
        {
            var newStatus =
                request.Status?
                    .Trim()
                    .ToUpperInvariant();

            var allowedStatuses = new[]
            {
                "ACTIVE",
                "INACTIVE",
                "SUSPENDED"
            };

            if (string.IsNullOrWhiteSpace(newStatus) ||
                !allowedStatuses.Contains(newStatus))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid account status. Allowed values: ACTIVE, INACTIVE, SUSPENDED."
                });
            }

            return await ChangeAccountStatus(
                id,
                newStatus
            );
        }

        // =========================================================
        // PUT: api/users/5/activate
        // =========================================================
        [HttpPut("{id:int}/activate")]
        [HasPermission("MANAGE_USERS")]
        public async Task<ActionResult> ActivateUser(int id)
        {
            return await ChangeAccountStatus(
                id,
                "ACTIVE"
            );
        }

        // =========================================================
        // PUT: api/users/5/deactivate
        // =========================================================
        [HttpPut("{id:int}/deactivate")]
        [HasPermission("MANAGE_USERS")]
        public async Task<ActionResult> DeactivateUser(int id)
        {
            return await ChangeAccountStatus(
                id,
                "INACTIVE"
            );
        }

        // =========================================================
        // PUT: api/users/5/suspend
        // =========================================================
        [HttpPut("{id:int}/suspend")]
        [HasPermission("MANAGE_USERS")]
        public async Task<ActionResult> SuspendUser(int id)
        {
            return await ChangeAccountStatus(
                id,
                "SUSPENDED"
            );
        }

        // =========================================================
        // PRIVATE - Change account status
        // =========================================================
        private async Task<ActionResult>
            ChangeAccountStatus(
                int id,
                string newStatus)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Unable to identify the logged-in user."
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
                .FirstOrDefaultAsync(u =>
                    u.UserId == id);

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

                    ActivityType =
                        "USER_STATUS_CHANGED",

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

        // =========================================================
        // HELPER - Friendly role name
        // =========================================================
        private static string GetRoleDisplayName(
            string roleName)
        {
            return roleName switch
            {
                "SUPER_ADMIN" => "Super Admin",
                "ADMIN" => "Admin",
                "TAXI_OPERATIONS" => "Taxi Operator",
                "DRIVER" => "Driver",
                "PASSENGER" => "Passenger",
                _ => roleName
            };
        }
    }

    // =============================================================
    // CREATE USER DTO
    // =============================================================
    public class CreateSystemUserRequest
    {
        public string FullName { get; set; } =
            string.Empty;

        public string Email { get; set; } =
            string.Empty;

        public string Phone { get; set; } =
            string.Empty;

        public string? Nic { get; set; }

        public string Password { get; set; } =
            string.Empty;

        public string ConfirmPassword { get; set; } =
            string.Empty;

        public string Role { get; set; } =
            string.Empty;
    }

    // =============================================================
    // UPDATE USER DTO
    // =============================================================
    public class UpdateUserRequest
    {
        public string FullName { get; set; } =
            string.Empty;

        public string Email { get; set; } =
            string.Empty;

        public string Phone { get; set; } =
            string.Empty;

        public string? Nic { get; set; }
    }

    // =============================================================
    // STATUS DTO
    // =============================================================
    public class UserStatusRequest
    {
        public string Status { get; set; } =
            string.Empty;
    }
}