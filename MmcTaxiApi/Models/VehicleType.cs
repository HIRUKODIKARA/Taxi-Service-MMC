using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("vehicle_types")]
    public class VehicleType
    {
        [Key]
        [Column("vehicle_type_id")]
        public int VehicleTypeId { get; set; }

        [Required]
        [Column("type_name")]
        [MaxLength(50)]
        public string TypeName { get; set; } = string.Empty;

        [Column("description")]
        [MaxLength(255)]
        public string? Description { get; set; }

        [Required]
        [Column("passenger_capacity")]
        public int PassengerCapacity { get; set; }

        [Column("status")]
        [MaxLength(20)]
        public string Status { get; set; } = "ACTIVE";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
    }
}