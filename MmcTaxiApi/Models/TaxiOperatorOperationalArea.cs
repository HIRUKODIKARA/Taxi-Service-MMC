using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("TaxiOperatorOperationalAreas")]
    public class TaxiOperatorOperationalArea
    {
        [Key]
        [Column("TaxiOperatorOperationalAreaId")]
        public int TaxiOperatorOperationalAreaId { get; set; }

        [Required]
        [Column("user_id")]
        public int UserId { get; set; }

        [Required]
        [Column("OperationalAreaId")]
        public int OperationalAreaId { get; set; }

        [Required]
        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }

        [Column("UpdatedAt")]
        public DateTime UpdatedAt { get; set; }

        public User? User { get; set; }

        public OperationalArea? OperationalArea { get; set; }
    }
}
