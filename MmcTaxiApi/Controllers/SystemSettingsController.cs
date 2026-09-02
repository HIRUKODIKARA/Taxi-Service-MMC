using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MmcTaxiApi.Authorization;
using MmcTaxiApi.Data;
using MmcTaxiApi.Models;

namespace MmcTaxiApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    [HasPermission("MANAGE_SYSTEM_SETTINGS")]
    public class SystemSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SystemSettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // GET LOGGED-IN USER ID FROM JWT
        // ==========================================
        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(
                ClaimTypes.NameIdentifier
            );

            if (userIdClaim == null)
            {
                return null;
            }

            if (!int.TryParse(
                    userIdClaim.Value,
                    out var userId))
            {
                return null;
            }

            return userId;
        }

        // ==========================================
        // GET ALL SETTINGS
        // GET: api/systemsettings
        // Requires MANAGE_SYSTEM_SETTINGS permission
        // ==========================================
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SystemSetting>>> GetSettings()
        {
            var settings = await _context.SystemSettings
                .OrderBy(s => s.SettingKey)
                .ToListAsync();

            return Ok(settings);
        }

        // ==========================================
        // GET SETTING BY KEY
        // GET: api/systemsettings/BOOKING_ENABLED
        // Requires MANAGE_SYSTEM_SETTINGS permission
        // ==========================================
        [HttpGet("{key}")]
        public async Task<ActionResult<SystemSetting>> GetSetting(
            string key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return BadRequest(new
                {
                    message = "Setting key is required."
                });
            }

            var normalizedKey = key
                .Trim()
                .ToUpperInvariant();

            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s =>
                    s.SettingKey == normalizedKey);

            if (setting == null)
            {
                return NotFound(new
                {
                    message = "System setting not found."
                });
            }

            return Ok(setting);
        }

        // ==========================================
        // CREATE SETTING
        // POST: api/systemsettings
        // Requires MANAGE_SYSTEM_SETTINGS permission
        // ==========================================
        [HttpPost]
        public async Task<ActionResult<SystemSetting>> CreateSetting(
            [FromBody] CreateSystemSettingRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Unable to identify the logged-in user."
                });
            }

            if (string.IsNullOrWhiteSpace(request.SettingKey))
            {
                return BadRequest(new
                {
                    message = "Setting key is required."
                });
            }

            if (request.SettingKey.Trim().Length > 100)
            {
                return BadRequest(new
                {
                    message =
                        "Setting key cannot exceed 100 characters."
                });
            }

            if (!string.IsNullOrWhiteSpace(
                    request.SettingValue) &&
                request.SettingValue.Length > 500)
            {
                return BadRequest(new
                {
                    message =
                        "Setting value cannot exceed 500 characters."
                });
            }

            var normalizedKey = request.SettingKey
                .Trim()
                .ToUpperInvariant();

            var alreadyExists =
                await _context.SystemSettings
                    .AnyAsync(s =>
                        s.SettingKey == normalizedKey);

            if (alreadyExists)
            {
                return BadRequest(new
                {
                    message =
                        "A setting with this key already exists."
                });
            }

            var setting = new SystemSetting
            {
                SettingKey = normalizedKey,

                SettingValue =
                    string.IsNullOrWhiteSpace(
                        request.SettingValue)
                        ? null
                        : request.SettingValue.Trim(),

                UpdatedAt = DateTime.Now
            };

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                _context.SystemSettings.Add(setting);

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,

                        ActivityType =
                            "SYSTEM_SETTING_CREATED",

                        Description =
                            $"System setting '{setting.SettingKey}' was created.",

                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return CreatedAtAction(
                    nameof(GetSetting),
                    new
                    {
                        key = setting.SettingKey
                    },
                    setting
                );
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ==========================================
        // UPDATE SETTING
        // PUT: api/systemsettings/BOOKING_ENABLED
        // Requires MANAGE_SYSTEM_SETTINGS permission
        // ==========================================
        [HttpPut("{key}")]
        public async Task<IActionResult> UpdateSetting(
            string key,
            [FromBody] UpdateSystemSettingRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Unable to identify the logged-in user."
                });
            }

            if (string.IsNullOrWhiteSpace(key))
            {
                return BadRequest(new
                {
                    message = "Setting key is required."
                });
            }

            if (!string.IsNullOrWhiteSpace(
                    request.SettingValue) &&
                request.SettingValue.Length > 500)
            {
                return BadRequest(new
                {
                    message =
                        "Setting value cannot exceed 500 characters."
                });
            }

            var normalizedKey = key
                .Trim()
                .ToUpperInvariant();

            var setting =
                await _context.SystemSettings
                    .FirstOrDefaultAsync(s =>
                        s.SettingKey == normalizedKey);

            if (setting == null)
            {
                return NotFound(new
                {
                    message =
                        "System setting not found."
                });
            }

            var oldValue = setting.SettingValue;

            setting.SettingValue =
                string.IsNullOrWhiteSpace(
                    request.SettingValue)
                    ? null
                    : request.SettingValue.Trim();

            setting.UpdatedAt = DateTime.Now;

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,

                    ActivityType =
                        "SYSTEM_SETTING_UPDATED",

                    Description =
                        $"System setting '{setting.SettingKey}' changed from '{oldValue}' to '{setting.SettingValue}'.",

                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "System setting updated successfully.",

                setting
            });
        }
    }

    // ==========================================
    // REQUEST DTOs
    // ==========================================
    public class CreateSystemSettingRequest
    {
        public string SettingKey { get; set; }
            = string.Empty;

        public string? SettingValue { get; set; }
    }

    public class UpdateSystemSettingRequest
    {
        public string? SettingValue { get; set; }
    }
}
