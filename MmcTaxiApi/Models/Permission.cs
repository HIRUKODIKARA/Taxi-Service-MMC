namespace MmcTaxiApi.Models
{
    public class Permission
    {
        public int PermissionId { get; set; }

        public string PermissionName { get; set; } =
            string.Empty;

        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}