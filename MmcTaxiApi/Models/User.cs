using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MmcTaxiApi.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("user_id")]
        public int UserId { get; set; }

        [Required]
        [Column("full_name")]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [Column("email")]
        [MaxLength(120)]
        public string Email { get; set; } = string.Empty;

        [Column("phone")]
        [MaxLength(20)]
        public string? Phone { get; set; }

        [Required]
        [Column("password_hash")]
        [MaxLength(255)]
        [JsonIgnore]
        public string PasswordHash { get; set; } = string.Empty;

        [Column("nic")]
        [MaxLength(20)]
        public string? Nic { get; set; }

        [Column("account_status")]
        [MaxLength(20)]
        public string AccountStatus { get; set; } = "ACTIVE";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }
}