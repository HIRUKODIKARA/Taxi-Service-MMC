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
    public class RolesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RolesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // HELPER - Get current logged-in user ID from JWT
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
        // GET: api/roles
        // Super Admin / Admin can view roles
        // =========================================================
        [HttpGet]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult> GetRoles()
        {
            var roles = await _context.Roles
                .OrderBy(r => r.RoleName)
                .Select(r => new
                {
                    r.RoleId,
                    r.RoleName,
                    r.Description,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(roles);
        }

        // =========================================================
        // GET: api/roles/user/5
        // Get roles assigned to a user
        // Super Admin / Admin only
        // =========================================================
        [HttpGet("user/{userId}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult> GetUserRoles(int userId)
        {
            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == userId);

            if (!userExists)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var roles = await (
                from userRole in _context.UserRoles
                join role in _context.Roles
                    on userRole.RoleId equals role.RoleId
                where userRole.UserId == userId
                orderby role.RoleName
                select new
                {
                    role.RoleId,
                    role.RoleName,
                    role.Description
                }
            ).ToListAsync();

            return Ok(roles);
        }

        // =========================================================
        // GET: api/roles/me
        // Logged-in user can see own roles
        // =========================================================
        [HttpGet("me")]
        public async Task<ActionResult> GetMyRoles()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            var roles = await (
                from userRole in _context.UserRoles
                join role in _context.Roles
                    on userRole.RoleId equals role.RoleId
                where userRole.UserId == currentUserId.Value
                orderby role.RoleName
                select new
                {
                    role.RoleId,
                    role.RoleName,
                    role.Description
                }
            ).ToListAsync();

            return Ok(roles);
        }

        // =========================================================
        // POST: api/roles/assign
        //
        // SUPER ADMIN ONLY
        //
        // Assign a role to a user
        // =========================================================
        [HttpPost("assign")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult> AssignRole(
            [FromBody] AssignRoleRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.UserId == request.UserId);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var role = await _context.Roles
                .FirstOrDefaultAsync(r =>
                    r.RoleId == request.RoleId);

            if (role == null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            // -----------------------------------------------------
            // Do not allow changing own role
            // -----------------------------------------------------
            if (request.UserId == currentUserId.Value)
            {
                return BadRequest(new
                {
                    message =
                        "You cannot change your own role."
                });
            }

            // -----------------------------------------------------
            // Only supported system roles
            // -----------------------------------------------------
            var allowedRoles = new[]
            {
                "SUPER_ADMIN",
                "ADMIN",
                "TAXI_OPERATIONS",
                "DRIVER",
                "PASSENGER"
            };

            if (!allowedRoles.Contains(
                    role.RoleName.ToUpperInvariant()))
            {
                return BadRequest(new
                {
                    message =
                        "This role is not a valid system role."
                });
            }

            var alreadyAssigned =
                await _context.UserRoles.AnyAsync(ur =>
                    ur.UserId == request.UserId &&
                    ur.RoleId == request.RoleId
                );

            if (alreadyAssigned)
            {
                return BadRequest(new
                {
                    message =
                        "This role is already assigned to the user."
                });
            }

            using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var userRole = new UserRole
                {
                    UserId = request.UserId,
                    RoleId = request.RoleId
                };

                _context.UserRoles.Add(userRole);

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,
                        ActivityType = "USER_ROLE_ASSIGNED",
                        Description =
                            $"Role {role.RoleName} assigned to user #{request.UserId}.",
                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        $"{role.RoleName} role assigned successfully.",
                    userId = request.UserId,
                    roleId = role.RoleId,
                    roleName = role.RoleName
                });
            }
            catch
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "An error occurred while assigning the role."
                });
            }
        }

        // =========================================================
        // DELETE: api/roles/remove
        //
        // This DOES NOT delete user or role.
        // It only removes the user-role relationship.
        //
        // SUPER ADMIN ONLY
        // =========================================================
        [HttpDelete("remove")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult> RemoveRole(
            [FromBody] RemoveRoleRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            if (request.UserId == currentUserId.Value)
            {
                return BadRequest(new
                {
                    message =
                        "You cannot remove your own role."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.UserId == request.UserId);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var role = await _context.Roles
                .FirstOrDefaultAsync(r =>
                    r.RoleId == request.RoleId);

            if (role == null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            var userRole = await _context.UserRoles
                .FirstOrDefaultAsync(ur =>
                    ur.UserId == request.UserId &&
                    ur.RoleId == request.RoleId
                );

            if (userRole == null)
            {
                return NotFound(new
                {
                    message =
                        "This role is not assigned to the user."
                });
            }

            // -----------------------------------------------------
            // Protect the system from having zero Super Admins
            // -----------------------------------------------------
            if (role.RoleName == "SUPER_ADMIN")
            {
                var superAdminRoleId = role.RoleId;

                var superAdminCount =
                    await _context.UserRoles.CountAsync(ur =>
                        ur.RoleId == superAdminRoleId
                    );

                if (superAdminCount <= 1)
                {
                    return BadRequest(new
                    {
                        message =
                            "The last Super Admin role cannot be removed."
                    });
                }
            }

            // -----------------------------------------------------
            // Prevent user from ending with zero roles
            // -----------------------------------------------------
            var roleCount =
                await _context.UserRoles.CountAsync(ur =>
                    ur.UserId == request.UserId
                );

            if (roleCount <= 1)
            {
                return BadRequest(new
                {
                    message =
                        "A user must have at least one role."
                });
            }

            using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                _context.UserRoles.Remove(userRole);

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,
                        ActivityType = "USER_ROLE_REMOVED",
                        Description =
                            $"Role {role.RoleName} removed from user #{request.UserId}.",
                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        $"{role.RoleName} role removed successfully.",
                    userId = request.UserId,
                    roleId = role.RoleId,
                    roleName = role.RoleName
                });
            }
            catch
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "An error occurred while removing the role."
                });
            }
        }
    }

    // =============================================================
    // ASSIGN ROLE DTO
    // =============================================================
    public class AssignRoleRequest
    {
        public int UserId { get; set; }

        public int RoleId { get; set; }
    }

    // =============================================================
    // REMOVE ROLE DTO
    // =============================================================
    public class RemoveRoleRequest
    {
        public int UserId { get; set; }

        public int RoleId { get; set; }
    }
}