using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("ratings")]
    public class Rating
    {
        [Key]
        [Column("rating_id")]
        public int RatingId { get; set; }

        [Required]
        [Column("booking_id")]
        public int BookingId { get; set; }

        [Required]
        [Column("passenger_id")]
        public int PassengerId { get; set; }

        [Required]
        [Column("driver_id")]
        public int DriverId { get; set; }

        [Required]
        [Column("rating_value")]
        public int RatingValue { get; set; }

        [Column("feedback")]
        [MaxLength(500)]
        public string? Feedback { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}