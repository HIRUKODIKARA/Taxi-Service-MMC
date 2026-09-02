using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace MmcTaxiApi.Authorization
{
    public class PermissionPolicyProvider
        : DefaultAuthorizationPolicyProvider
    {
        public const string PolicyPrefix = "Permission:";

        public PermissionPolicyProvider(
            IOptions<AuthorizationOptions> options
        ) : base(options)
        {
        }

        public override async Task<AuthorizationPolicy?> GetPolicyAsync(
            string policyName
        )
        {
            // Normal policies such as SuperAdminOnly,
            // AdminOnly, DriverOnly etc. continue to work.
            if (!policyName.StartsWith(
                    PolicyPrefix,
                    StringComparison.OrdinalIgnoreCase))
            {
                return await base.GetPolicyAsync(policyName);
            }

            // Example:
            // "Permission:VIEW_USERS"
            // becomes "VIEW_USERS"
            var permissionName =
                policyName.Substring(PolicyPrefix.Length);

            if (string.IsNullOrWhiteSpace(permissionName))
            {
                return await base.GetPolicyAsync(policyName);
            }

            var policy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddRequirements(
                    new PermissionRequirement(permissionName)
                )
                .Build();

            return policy;
        }
    }
}