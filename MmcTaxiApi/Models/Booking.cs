using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("bookings")]
    public class Booking
    {
        [Key]
        [Column("booking_id")]
        public int BookingId { get; set; }

        [Column("passenger_id")]
        public int? PassengerId { get; set; }

        [Required]
        [Column("passenger_name")]
        [MaxLength(100)]
        public string PassengerName { get; set; } = string.Empty;

        [Required]
        [Column("passenger_phone")]
        [MaxLength(20)]
        public string PassengerPhone { get; set; } = string.Empty;

        [Required]
        [Column("booking_source")]
        [MaxLength(20)]
        public string BookingSource { get; set; } = string.Empty;

        [Required]
        [Column("pickup_location")]
        [MaxLength(255)]
        public string PickupLocation { get; set; } = string.Empty;

        [Required]
        [Column("destination")]
        [MaxLength(255)]
        public string Destination { get; set; } = string.Empty;

        [Column("booking_date")]
        public DateTime? BookingDate { get; set; }

        [Column("booking_time")]
        public TimeSpan? BookingTime { get; set; }

        [Required]
        [Column("vehicle_type_id")]
        public int VehicleTypeId { get; set; }

        [Column("assigned_driver_id")]
        public int? AssignedDriverId { get; set; }

        [Column("assigned_vehicle_id")]
        public int? AssignedVehicleId { get; set; }

        [Column("booking_status")]
        [MaxLength(30)]
        public string BookingStatus { get; set; } = "PENDING";

        [Column("created_by_user_id")]
        public int? CreatedByUserId { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }
}