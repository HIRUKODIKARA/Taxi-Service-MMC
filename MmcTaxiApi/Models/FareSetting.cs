using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("fare_settings")]
    public class FareSetting
    {
        [Key]
        [Column("fare_setting_id")]
        public int FareSettingId { get; set; }

        [Required]
        [Column("vehicle_type_id")]
        public int VehicleTypeId { get; set; }

        [Column("base_distance_km", TypeName = "decimal(10,2)")]
        public decimal BaseDistanceKm { get; set; }

        [Column("base_fare", TypeName = "decimal(10,2)")]
        public decimal BaseFare { get; set; }

        [Column("waiting_charge_per_minute", TypeName = "decimal(10,2)")]
        public decimal WaitingChargePerMinute { get; set; } = 7.00m;

        [Column("driver_percentage", TypeName = "decimal(5,2)")]
        public decimal DriverPercentage { get; set; } = 90.00m;

        [Column("mmc_percentage", TypeName = "decimal(5,2)")]
        public decimal MmcPercentage { get; set; } = 10.00m;

        [Column("status")]
        [MaxLength(20)]
        public string Status { get; set; } = "ACTIVE";

        [Column("updated_by_user_id")]
        public int? UpdatedByUserId { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        public ICollection<FareSlab> FareSlabs { get; set; } = new List<FareSlab>();
    }
}
