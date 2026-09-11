using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MmcTaxiApi.Data;
using MmcTaxiApi.Models;

namespace MmcTaxiApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "SUPER_ADMIN")]
    public class FareSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FareSettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _context.FareSettings
                .Include(x => x.FareSlabs)
                .OrderBy(x => x.VehicleTypeId)
                .ToListAsync();

            return Ok(items);
        }

        [HttpPut("{vehicleTypeId}")]
        public async Task<IActionResult> Save(int vehicleTypeId, [FromBody] SaveFareSettingRequest request)
        {
            if (vehicleTypeId <= 0)
                return BadRequest(new { message = "Invalid vehicle type." });

            if (request.BaseDistanceKm < 0 || request.BaseFare < 0 || request.WaitingChargePerMinute < 0)
                return BadRequest(new { message = "Fare values cannot be negative." });

            if (request.DriverPercentage < 0 || request.MmcPercentage < 0 ||
                request.DriverPercentage > 100 || request.MmcPercentage > 100)
                return BadRequest(new { message = "Percentage values must be between 0 and 100." });

            if (Math.Round(request.DriverPercentage + request.MmcPercentage, 2) != 100m)
                return BadRequest(new { message = "Driver percentage + MMC percentage must equal 100%." });

            var vehicleTypeExists = await _context.VehicleTypes
                .AnyAsync(v => v.VehicleTypeId == vehicleTypeId);

            if (!vehicleTypeExists)
                return NotFound(new { message = "Vehicle type not found." });

            var setting = await _context.FareSettings
                .Include(x => x.FareSlabs)
                .FirstOrDefaultAsync(x => x.VehicleTypeId == vehicleTypeId);

            if (setting == null)
            {
                setting = new FareSetting
                {
                    VehicleTypeId = vehicleTypeId,
                    CreatedAt = DateTime.Now
                };
                _context.FareSettings.Add(setting);
            }

            setting.BaseDistanceKm = request.BaseDistanceKm;
            setting.BaseFare = request.BaseFare;
            setting.WaitingChargePerMinute = request.WaitingChargePerMinute;
            setting.DriverPercentage = request.DriverPercentage;
            setting.MmcPercentage = request.MmcPercentage;
            setting.Status = NormalizeStatus(request.Status);
            setting.UpdatedByUserId = GetCurrentUserId();
            setting.UpdatedAt = DateTime.Now;

            if (setting.FareSettingId != 0)
            {
                _context.FareSlabs.RemoveRange(setting.FareSlabs);
            }

            setting.FareSlabs = request.Slabs
                .OrderBy(x => x.SortOrder)
                .Select(x => new FareSlab
                {
                    FromKm = x.FromKm,
                    ToKm = x.ToKm,
                    RatePerKm = x.RatePerKm,
                    SortOrder = x.SortOrder,
                    IsActive = x.IsActive
                })
                .ToList();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Fare setting saved successfully.",
                fareSetting = setting
            });
        }

        private static string NormalizeStatus(string? status)
        {
            return string.Equals(status, "INACTIVE", StringComparison.OrdinalIgnoreCase)
                ? "INACTIVE"
                : "ACTIVE";
        }
    }

    public class SaveFareSettingRequest
    {
        public decimal BaseDistanceKm { get; set; }
        public decimal BaseFare { get; set; }
        public decimal WaitingChargePerMinute { get; set; } = 7m;
        public decimal DriverPercentage { get; set; } = 90m;
        public decimal MmcPercentage { get; set; } = 10m;
        public string Status { get; set; } = "ACTIVE";
        public List<SaveFareSlabRequest> Slabs { get; set; } = new();
    }

    public class SaveFareSlabRequest
    {
        public decimal FromKm { get; set; }
        public decimal? ToKm { get; set; }
        public decimal RatePerKm { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
