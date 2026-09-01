using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("drivers")]
    public class Driver
    {
        [Key]
        [Column("driver_id")]
        public int DriverId { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Required]
        [Column("driving_license_no")]
        [MaxLength(50)]
        public string DrivingLicenseNo { get; set; } = string.Empty;

        [Column("verification_status")]
        [MaxLength(20)]
        public string VerificationStatus { get; set; } = "PENDING";

        [Column("operational_status")]
        [MaxLength(20)]
        public string OperationalStatus { get; set; } = "OFFLINE";

        [Column("gps_enabled")]
        public bool GpsEnabled { get; set; }

        [Column("verified_at")]
        public DateTime? VerifiedAt { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}