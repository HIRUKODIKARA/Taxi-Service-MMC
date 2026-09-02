using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
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
    public class PermissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PermissionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // HELPER - CURRENT USER ID
        // =========================================================

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (claim == null ||
                !int.TryParse(claim.Value, out var userId))
            {
                return null;
            }

            return userId;
        }


        // =========================================================
        // GET: api/permissions
        //
        // Super Admin can view all available permissions
        // =========================================================

        [HttpGet]
        [HasPermission("VIEW_ROLES")]
        public async Task<ActionResult> GetPermissions()
        {
            var permissions = await _context.Permissions
                .OrderBy(p => p.PermissionName)
                .Select(p => new
                {
                    p.PermissionId,
                    p.PermissionName,
                    p.Description,
                    p.CreatedAt
                })
                .ToListAsync();

            return Ok(permissions);
        }


        // =========================================================
        // GET: api/permissions/5
        //
        // Get one permission
        // =========================================================

        [HttpGet("{id:int}")]
        [HasPermission("VIEW_ROLES")]
        public async Task<ActionResult> GetPermission(int id)
        {
            var permission = await _context.Permissions
                .Where(p => p.PermissionId == id)
                .Select(p => new
                {
                    p.PermissionId,
                    p.PermissionName,
                    p.Description,
                    p.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (permission == null)
            {
                return NotFound(new
                {
                    message = "Permission not found."
                });
            }

            return Ok(permission);
        }


        // =========================================================
        // GET: api/permissions/role/5
        //
        // Get permissions currently assigned to a role
        // =========================================================

        [HttpGet("role/{roleId:int}")]
        [HasPermission("VIEW_ROLES")]
        public async Task<ActionResult> GetRolePermissions(
            int roleId)
        {
            var role = await _context.Roles
                .FirstOrDefaultAsync(r =>
                    r.RoleId == roleId);

            if (role == null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            var permissions = await (
                from rp in _context.RolePermissions
                join p in _context.Permissions
                    on rp.PermissionId equals p.PermissionId
                where rp.RoleId == roleId
                orderby p.PermissionName
                select new
                {
                    p.PermissionId,
                    p.PermissionName,
                    p.Description
                }
            ).ToListAsync();

            return Ok(new
            {
                roleId = role.RoleId,
                roleName = role.RoleName,
                permissions
            });
        }


        // =========================================================
        // GET: api/permissions/role/5/matrix
        //
        // Returns ALL permissions + true/false assignment.
        //
        // Very useful for frontend checkbox/tick UI.
        // =========================================================

        [HttpGet("role/{roleId:int}/matrix")]
        [HasPermission("VIEW_ROLES")]
        public async Task<ActionResult> GetRolePermissionMatrix(
            int roleId)
        {
            var role = await _context.Roles
                .FirstOrDefaultAsync(r =>
                    r.RoleId == roleId);

            if (role == null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            var assignedIds = await _context.RolePermissions
                .Where(rp => rp.RoleId == roleId)
                .Select(rp => rp.PermissionId)
                .ToListAsync();

            var permissions = await _context.Permissions
                .OrderBy(p => p.PermissionName)
                .Select(p => new
                {
                    p.PermissionId,
                    p.PermissionName,
                    p.Description,
                    IsAssigned =
                        assignedIds.Contains(p.PermissionId)
                })
                .ToListAsync();

            return Ok(new
            {
                roleId = role.RoleId,
                roleName = role.RoleName,
                permissions
            });
        }


        // =========================================================
        // GET: api/permissions/my
        //
        // Logged-in user can view effective permissions
        // from all assigned roles.
        // =========================================================

        [HttpGet("my")]
        public async Task<ActionResult> GetMyPermissions()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Unable to identify logged-in user."
                });
            }

            var permissions = await (
                from ur in _context.UserRoles
                join rp in _context.RolePermissions
                    on ur.RoleId equals rp.RoleId
                join p in _context.Permissions
                    on rp.PermissionId equals p.PermissionId
                where ur.UserId == currentUserId.Value
                select new
                {
                    p.PermissionId,
                    p.PermissionName,
                    p.Description
                }
            )
            .Distinct()
            .OrderBy(p => p.PermissionName)
            .ToListAsync();

            return Ok(permissions);
        }


        // =========================================================
        // PUT: api/permissions/role/5
        //
        // Replace role's current permissions with checkbox
        // selections from frontend.
        //
        // SUPER_ADMIN role is protected.
        // =========================================================

        [HttpPut("role/{roleId:int}")]
        [HasPermission("MANAGE_PERMISSIONS")]
        public async Task<IActionResult> UpdateRolePermissions(
            int roleId,
            [FromBody] UpdateRolePermissionsRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Unable to identify logged-in user."
                });
            }

            var role = await _context.Roles
                .FirstOrDefaultAsync(r =>
                    r.RoleId == roleId);

            if (role == null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            // Super Admin must always retain full permissions.
            if (role.RoleName == "SUPER_ADMIN")
            {
                return BadRequest(new
                {
                    message =
                        "SUPER_ADMIN permissions are protected and cannot be modified."
                });
            }

            if (request.PermissionIds == null)
            {
                return BadRequest(new
                {
                    message =
                        "PermissionIds is required."
                });
            }

            var permissionIds = request.PermissionIds
                .Distinct()
                .ToList();

            if (permissionIds.Any(id => id <= 0))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid permission ID detected."
                });
            }

            var validPermissionIds =
                await _context.Permissions
                    .Where(p =>
                        permissionIds.Contains(
                            p.PermissionId))
                    .Select(p => p.PermissionId)
                    .ToListAsync();

            if (validPermissionIds.Count !=
                permissionIds.Count)
            {
                return BadRequest(new
                {
                    message =
                        "One or more selected permissions do not exist."
                });
            }

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                var currentRolePermissions =
                    await _context.RolePermissions
                        .Where(rp =>
                            rp.RoleId == roleId)
                        .ToListAsync();

                _context.RolePermissions.RemoveRange(
                    currentRolePermissions);

                var newRolePermissions =
                    permissionIds.Select(
                        permissionId =>
                            new RolePermission
                            {
                                RoleId = roleId,
                                PermissionId =
                                    permissionId
                            })
                        .ToList();

                if (newRolePermissions.Count > 0)
                {
                    _context.RolePermissions.AddRange(
                        newRolePermissions);
                }

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,
                        ActivityType =
                            "ROLE_PERMISSIONS_UPDATED",
                        Description =
                            $"Permissions for role '{role.RoleName}' were updated.",
                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        "Role permissions updated successfully.",
                    roleId = role.RoleId,
                    roleName = role.RoleName,
                    permissionCount =
                        permissionIds.Count
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }


    // =============================================================
    // DTO
    // =============================================================

    public class UpdateRolePermissionsRequest
    {
        public List<int> PermissionIds { get; set; } =
            new List<int>();
    }
}