using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MmcTaxiApi.Models
{
    [Table("system_settings")]
    public class SystemSetting
    {
        [Key]
        [Column("setting_id")]
        public int SettingId { get; set; }

        [Required]
        [Column("setting_key")]
        [MaxLength(100)]
        public string SettingKey { get; set; } = string.Empty;

        [Column("setting_value")]
        [MaxLength(500)]
        public string? SettingValue { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
}