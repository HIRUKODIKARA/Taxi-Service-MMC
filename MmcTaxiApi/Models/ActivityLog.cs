using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("activity_logs")]
    public class ActivityLog
    {
        [Key]
        [Column("log_id")]
        public long LogId { get; set; }

        [Column("user_id")]
        public int? UserId { get; set; }

        [Required]
        [Column("activity_type")]
        [MaxLength(100)]
        public string ActivityType { get; set; } = string.Empty;

        [Column("description")]
        [MaxLength(500)]
        public string? Description { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}