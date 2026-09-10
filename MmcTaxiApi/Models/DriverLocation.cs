using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("driver_locations")]
    public class DriverLocation
    {
        [Key]
        [Column("location_id")]
        public long LocationId { get; set; }

        [Required]
        [Column("driver_id")]
        public int DriverId { get; set; }

        [Required]
        [Column("latitude")]
        public decimal Latitude { get; set; }

        [Required]
        [Column("longitude")]
        public decimal Longitude { get; set; }

        [Required]
        [Column("tracking_source")]
        [MaxLength(20)]
        public string TrackingSource { get; set; } = "PHONE_MAP";

        [Column("recorded_at")]
        public DateTime RecordedAt { get; set; }
    }
}