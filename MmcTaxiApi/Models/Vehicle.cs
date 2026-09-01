using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("vehicles")]
    public class Vehicle
    {
        [Key]
        [Column("vehicle_id")]
        public int VehicleId { get; set; }

        [Column("driver_id")]
        public int? DriverId { get; set; }

        [Required]
        [Column("vehicle_type_id")]
        public int VehicleTypeId { get; set; }

        [Required]
        [Column("registration_number")]
        [MaxLength(50)]
        public string RegistrationNumber { get; set; } = string.Empty;

        [Column("gps_available")]
        public bool GpsAvailable { get; set; }

        [Column("operational_status")]
        [MaxLength(20)]
        public string OperationalStatus { get; set; } = "OFFLINE";

        [Column("account_status")]
        [MaxLength(20)]
        public string AccountStatus { get; set; } = "ACTIVE";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}