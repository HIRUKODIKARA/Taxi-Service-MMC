using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("offers")]
    public class Offer
    {
        [Key]
        [Column("offer_id")]
        public int OfferId { get; set; }

        [Required]
        [Column("offer_name")]
        [MaxLength(100)]
        public string OfferName { get; set; } = string.Empty;

        [Column("description")]
        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [Column("discount_type")]
        [MaxLength(20)]
        public string DiscountType { get; set; } = "PERCENTAGE";

        [Column("discount_value", TypeName = "decimal(10,2)")]
        public decimal DiscountValue { get; set; }

        [Column("vehicle_type_id")]
        public int? VehicleTypeId { get; set; }

        [Column("from_operational_area_id")]
        public int? FromOperationalAreaId { get; set; }

        [Column("to_operational_area_id")]
        public int? ToOperationalAreaId { get; set; }

        [Column("customer_type")]
        [MaxLength(30)]
        public string CustomerType { get; set; } = "ALL";

        [Column("minimum_fare", TypeName = "decimal(10,2)")]
        public decimal? MinimumFare { get; set; }

        [Column("start_at")]
        public DateTime? StartAt { get; set; }

        [Column("end_at")]
        public DateTime? EndAt { get; set; }

        [Column("status")]
        [MaxLength(20)]
        public string Status { get; set; } = "INACTIVE";

        [Column("created_by_user_id")]
        public int? CreatedByUserId { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }
}
