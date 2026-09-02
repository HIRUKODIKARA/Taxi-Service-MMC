using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MmcTaxiApi.Data;

namespace MmcTaxiApi.Authorization
{
    public class PermissionAuthorizationHandler
        : AuthorizationHandler<PermissionRequirement>
    {
        private readonly ApplicationDbContext _context;

        public PermissionAuthorizationHandler(
            ApplicationDbContext context
        )
        {
            _context = context;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement
        )
        {
            // User must be authenticated
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                return;
            }

            // Try to get user id from JWT claims
            var userIdClaim =
                context.User.FindFirst(ClaimTypes.NameIdentifier) ??
                context.User.FindFirst("sub");

            if (userIdClaim == null)
            {
                return;
            }

            if (!int.TryParse(userIdClaim.Value, out int userId))
            {
                return;
            }

            // Super Admin always has full access
            var isSuperAdmin = await (
                from ur in _context.UserRoles
                join r in _context.Roles
                    on ur.RoleId equals r.RoleId
                where ur.UserId == userId
                      && r.RoleName == "SUPER_ADMIN"
                select ur
            ).AnyAsync();

            if (isSuperAdmin)
            {
                context.Succeed(requirement);
                return;
            }

            // Check permission through:
            // user_roles -> role_permissions -> permissions
            var hasPermission = await (
                from ur in _context.UserRoles
                join rp in _context.RolePermissions
                    on ur.RoleId equals rp.RoleId
                join p in _context.Permissions
                    on rp.PermissionId equals p.PermissionId
                where ur.UserId == userId
                      && p.PermissionName == requirement.PermissionName
                select p
            ).AnyAsync();

            if (hasPermission)
            {
                context.Succeed(requirement);
            }
        }
    }
}