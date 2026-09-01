using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("payments")]
    public class Payment
    {
        [Key]
        [Column("payment_id")]
        public int PaymentId { get; set; }

        [Required]
        [Column("booking_id")]
        public int BookingId { get; set; }

        [Required]
        [Column("amount", TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        [Required]
        [Column("payment_method")]
        [MaxLength(20)]
        public string PaymentMethod { get; set; } = "CASH";

        [Required]
        [Column("payment_status")]
        [MaxLength(20)]
        public string PaymentStatus { get; set; } = "PENDING";

        [Column("paid_at")]
        public DateTime? PaidAt { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}