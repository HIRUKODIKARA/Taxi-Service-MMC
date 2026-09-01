using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("notifications")]
    public class Notification
    {
        [Key]
        [Column("notification_id")]
        public int NotificationId { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Required]
        [Column("title")]
        [MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [Column("message")]
        public string Message { get; set; } = string.Empty;

        [Column("notification_type")]
        [MaxLength(20)]
        public string NotificationType { get; set; } = "SYSTEM";

        [Column("is_read")]
        public bool IsRead { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}