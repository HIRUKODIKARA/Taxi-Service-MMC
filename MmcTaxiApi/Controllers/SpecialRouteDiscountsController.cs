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
    [Authorize]
    public class SpecialRouteDiscountsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SpecialRouteDiscountsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            return Ok(await _context.SpecialRouteDiscounts
                .Where(x => x.Status == "ACTIVE")
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync());
        }

        [HttpGet]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _context.SpecialRouteDiscounts
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync());
        }

        [HttpPost]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> Create([FromBody] SaveSpecialRouteDiscountRequest request)
        {
            var validation = Validate(request);
            if (validation != null) return BadRequest(new { message = validation });

            if (!await AreasExist(request.FromOperationalAreaId, request.ToOperationalAreaId))
                return BadRequest(new { message = "One or both operational areas do not exist." });

            var item = new SpecialRouteDiscount
            {
                FromOperationalAreaId = request.FromOperationalAreaId,
                ToOperationalAreaId = request.ToOperationalAreaId,
                DiscountType = NormalizeDiscountType(request.DiscountType),
                DiscountValue = request.DiscountValue,
                BothDirections = request.BothDirections,
                Status = NormalizeStatus(request.Status),
                CreatedByUserId = GetCurrentUserId(),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.SpecialRouteDiscounts.Add(item);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Special route discount created successfully.", item });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> Update(int id, [FromBody] SaveSpecialRouteDiscountRequest request)
        {
            var item = await _context.SpecialRouteDiscounts.FindAsync(id);
            if (item == null) return NotFound(new { message = "Special route discount not found." });

            var validation = Validate(request);
            if (validation != null) return BadRequest(new { message = validation });

            if (!await AreasExist(request.FromOperationalAreaId, request.ToOperationalAreaId))
                return BadRequest(new { message = "One or both operational areas do not exist." });

            item.FromOperationalAreaId = request.FromOperationalAreaId;
            item.ToOperationalAreaId = request.ToOperationalAreaId;
            item.DiscountType = NormalizeDiscountType(request.DiscountType);
            item.DiscountValue = request.DiscountValue;
            item.BothDirections = request.BothDirections;
            item.Status = NormalizeStatus(request.Status);
            item.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Special route discount updated successfully.", item });
        }

        [HttpPut("{id}/toggle")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> Toggle(int id)
        {
            var item = await _context.SpecialRouteDiscounts.FindAsync(id);
            if (item == null) return NotFound(new { message = "Special route discount not found." });

            item.Status = item.Status == "ACTIVE" ? "INACTIVE" : "ACTIVE";
            item.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Route discount is now {item.Status}.", item });
        }

        private async Task<bool> AreasExist(int fromId, int toId)
        {
            if (fromId <= 0 || toId <= 0 || fromId == toId) return false;

            var count = await _context.OperationalAreas
                .CountAsync(x => x.OperationalAreaId == fromId || x.OperationalAreaId == toId);

            return count == 2;
        }

        private static string? Validate(SaveSpecialRouteDiscountRequest request)
        {
            if (request.FromOperationalAreaId <= 0 || request.ToOperationalAreaId <= 0)
                return "Both operational areas are required.";

            if (request.FromOperationalAreaId == request.ToOperationalAreaId)
                return "From and To operational areas must be different.";

            var type = NormalizeDiscountType(request.DiscountType);

            if (request.DiscountValue <= 0)
                return "Discount value must be greater than zero.";

            if (type == "PERCENTAGE" && request.DiscountValue > 100)
                return "Percentage discount cannot exceed 100%.";

            return null;
        }

        private static string NormalizeDiscountType(string? value)
        {
            return string.Equals(value, "FIXED", StringComparison.OrdinalIgnoreCase)
                ? "FIXED"
                : "PERCENTAGE";
        }

        private static string NormalizeStatus(string? value)
        {
            return string.Equals(value, "INACTIVE", StringComparison.OrdinalIgnoreCase)
                ? "INACTIVE"
                : "ACTIVE";
        }
    }

    public class SaveSpecialRouteDiscountRequest
    {
        public int FromOperationalAreaId { get; set; }
        public int ToOperationalAreaId { get; set; }
        public string DiscountType { get; set; } = "PERCENTAGE";
        public decimal DiscountValue { get; set; }
        public bool BothDirections { get; set; } = true;
        public string Status { get; set; } = "ACTIVE";
    }
}
