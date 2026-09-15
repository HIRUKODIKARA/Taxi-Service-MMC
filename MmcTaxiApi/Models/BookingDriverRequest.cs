using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("booking_driver_requests")]
    public class BookingDriverRequest
    {
        [Key]
        [Column("request_id")]
        public int RequestId { get; set; }

        [Required]
        [Column("booking_id")]
        public int BookingId { get; set; }

        [Required]
        [Column("driver_id")]
        public int DriverId { get; set; }

        [Required]
        [Column("vehicle_id")]
        public int VehicleId { get; set; }

        [Required]
        [Column("request_status")]
        [MaxLength(20)]
        public string RequestStatus { get; set; } = "PENDING";

        [Column("sent_at")]
        public DateTime SentAt { get; set; } = DateTime.Now;

        [Column("responded_at")]
        public DateTime? RespondedAt { get; set; }
    }
}