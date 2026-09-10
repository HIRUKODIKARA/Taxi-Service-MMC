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

        // ==========================================
        // DRIVER PERSONAL / REGISTRATION DETAILS
        // ==========================================

        [Column("address")]
        [MaxLength(255)]
        public string? Address { get; set; }

        [Column("date_of_birth")]
        public DateTime? DateOfBirth { get; set; }

        [Column("driving_license_expiry")]
        public DateTime? DrivingLicenseExpiry { get; set; }

        // ==========================================
        // DRIVER VERIFICATION
        // ==========================================

        [Column("verification_status")]
        [MaxLength(20)]
        public string VerificationStatus { get; set; } = "PENDING";

        // ==========================================
        // DRIVER OPERATIONAL STATUS
        // ==========================================

        [Column("operational_status")]
        [MaxLength(20)]
        public string OperationalStatus { get; set; } = "OFFLINE";

        [Column("gps_enabled")]
        public bool GpsEnabled { get; set; }

        // ==========================================
        // DATES
        // ==========================================

        [Column("verified_at")]
        public DateTime? VerifiedAt { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}