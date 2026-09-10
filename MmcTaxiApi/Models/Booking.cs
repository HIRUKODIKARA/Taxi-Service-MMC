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

        // =========================================================
        // TRIP DIRECTION
        // Expected values:
        // MMC_TO_OTHER
        // OTHER_TO_MMC
        // =========================================================

        [Column("trip_direction")]
        [MaxLength(30)]
        public string? TripDirection { get; set; }

        // =========================================================
        // OPERATIONAL AREA
        // Mainly used for OTHER_TO_MMC bookings
        // =========================================================

        [Column("operational_area_id")]
        public int? OperationalAreaId { get; set; }

        // =========================================================
        // PICKUP LOCATION
        // =========================================================

        [Required]
        [Column("pickup_location")]
        [MaxLength(255)]
        public string PickupLocation { get; set; } = string.Empty;

        [Column("pickup_latitude", TypeName = "decimal(10,7)")]
        public decimal? PickupLatitude { get; set; }

        [Column("pickup_longitude", TypeName = "decimal(10,7)")]
        public decimal? PickupLongitude { get; set; }

        // =========================================================
        // DESTINATION
        // =========================================================

        [Required]
        [Column("destination")]
        [MaxLength(255)]
        public string Destination { get; set; } = string.Empty;

        [Column("destination_latitude", TypeName = "decimal(10,7)")]
        public decimal? DestinationLatitude { get; set; }

        [Column("destination_longitude", TypeName = "decimal(10,7)")]
        public decimal? DestinationLongitude { get; set; }

        // =========================================================
        // BOOKING DATE & TIME
        // =========================================================

        [Column("booking_date")]
        public DateTime? BookingDate { get; set; }

        [Column("booking_time")]
        public TimeSpan? BookingTime { get; set; }

        // =========================================================
        // VEHICLE
        // =========================================================

        [Required]
        [Column("vehicle_type_id")]
        public int VehicleTypeId { get; set; }

        [Column("assigned_driver_id")]
        public int? AssignedDriverId { get; set; }

        [Column("assigned_vehicle_id")]
        public int? AssignedVehicleId { get; set; }

        // =========================================================
        // BOOKING STATUS
        // =========================================================

        [Column("booking_status")]
        [MaxLength(30)]
        public string BookingStatus { get; set; } = "PENDING";

        // =========================================================
        // CREATED BY
        // =========================================================

        [Column("created_by_user_id")]
        public int? CreatedByUserId { get; set; }

        // =========================================================
        // TIMESTAMPS
        // =========================================================

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }
}
