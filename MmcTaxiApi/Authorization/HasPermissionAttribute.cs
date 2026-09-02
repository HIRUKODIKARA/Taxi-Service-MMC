using Microsoft.AspNetCore.Authorization;

namespace MmcTaxiApi.Authorization
{
    public class HasPermissionAttribute : AuthorizeAttribute
    {
        public HasPermissionAttribute(string permissionName)
        {
            Policy =
                PermissionPolicyProvider.PolicyPrefix +
                permissionName;
        }
    }
}