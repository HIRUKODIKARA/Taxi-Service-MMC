using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("driver_documents")]
    public class DriverDocument
    {
        [Key]
        [Column("document_id")]
        public int DocumentId { get; set; }

        [Required]
        [Column("driver_id")]
        public int DriverId { get; set; }

        [Required]
        [Column("document_type")]
        [MaxLength(50)]
        public string DocumentType { get; set; } = string.Empty;

        [Column("file_path")]
        [MaxLength(255)]
        public string? FilePath { get; set; }

        [Column("verification_status")]
        [MaxLength(50)]
        public string VerificationStatus { get; set; } = "PENDING";

        [Column("uploaded_at")]
        public DateTime UploadedAt { get; set; } = DateTime.Now;
    }
}