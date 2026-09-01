using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("booking_status_history")]
    public class BookingStatusHistory
    {
        [Key]
        [Column("history_id")]
        public int HistoryId { get; set; }

        [Required]
        [Column("booking_id")]
        public int BookingId { get; set; }

        [Column("old_status")]
        [MaxLength(50)]
        public string? OldStatus { get; set; }

        [Required]
        [Column("new_status")]
        [MaxLength(50)]
        public string NewStatus { get; set; } = string.Empty;

        [Column("changed_by_user_id")]
        public int? ChangedByUserId { get; set; }

        [Column("remarks")]
        [MaxLength(255)]
        public string? Remarks { get; set; }

        [Column("changed_at")]
        public DateTime ChangedAt { get; set; }
    }
}