using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("user_roles")]
    public class UserRole
    {
        [Key]
        [Column("user_role_id")]
        public int UserRoleId { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Required]
        [Column("role_id")]
        public int RoleId { get; set; }
    }
}