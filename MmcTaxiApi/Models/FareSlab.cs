using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("fare_slabs")]
    public class FareSlab
    {
        [Key]
        [Column("fare_slab_id")]
        public int FareSlabId { get; set; }

        [Required]
        [Column("fare_setting_id")]
        public int FareSettingId { get; set; }

        [Column("from_km", TypeName = "decimal(10,2)")]
        public decimal FromKm { get; set; }

        [Column("to_km", TypeName = "decimal(10,2)")]
        public decimal? ToKm { get; set; }

        [Column("rate_per_km", TypeName = "decimal(10,2)")]
        public decimal RatePerKm { get; set; }

        [Column("sort_order")]
        public int SortOrder { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [ForeignKey(nameof(FareSettingId))]
        public FareSetting? FareSetting { get; set; }
    }
}
