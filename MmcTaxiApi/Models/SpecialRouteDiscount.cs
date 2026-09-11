using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("special_route_discounts")]
    public class SpecialRouteDiscount
    {
        [Key]
        [Column("special_route_discount_id")]
        public int SpecialRouteDiscountId { get; set; }

        [Required]
        [Column("from_operational_area_id")]
        public int FromOperationalAreaId { get; set; }

        [Required]
        [Column("to_operational_area_id")]
        public int ToOperationalAreaId { get; set; }

        [Required]
        [Column("discount_type")]
        [MaxLength(20)]
        public string DiscountType { get; set; } = "PERCENTAGE";

        [Column("discount_value", TypeName = "decimal(10,2)")]
        public decimal DiscountValue { get; set; }

        [Column("both_directions")]
        public bool BothDirections { get; set; } = true;

        [Column("status")]
        [MaxLength(20)]
        public string Status { get; set; } = "ACTIVE";

        [Column("created_by_user_id")]
        public int? CreatedByUserId { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }
    }
}
