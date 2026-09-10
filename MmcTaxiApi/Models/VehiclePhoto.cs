using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("vehicle_photos")]
    public class VehiclePhoto
    {
        [Key]
        [Column("vehicle_photo_id")]
        public int VehiclePhotoId { get; set; }

        [Required]
        [Column("vehicle_id")]
        public int VehicleId { get; set; }

        [Required]
        [Column("photo_type")]
        [MaxLength(20)]
        public string PhotoType { get; set; } = string.Empty;

        [Required]
        [Column("file_path")]
        [MaxLength(255)]
        public string FilePath { get; set; } = string.Empty;

        [Column("uploaded_at")]
        public DateTime UploadedAt { get; set; } = DateTime.Now;
    }
}