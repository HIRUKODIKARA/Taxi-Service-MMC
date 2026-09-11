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
    public class OffersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OffersController(ApplicationDbContext context)
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
            return Ok(await _context.Offers
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SaveOfferRequest request)
        {
            var validation = Validate(request);
            if (validation != null) return BadRequest(new { message = validation });

            var offer = new Offer
            {
                OfferName = request.OfferName.Trim(),
                Description = request.Description?.Trim(),
                DiscountType = NormalizeDiscountType(request.DiscountType),
                DiscountValue = request.DiscountValue,
                VehicleTypeId = request.VehicleTypeId,
                FromOperationalAreaId = request.FromOperationalAreaId,
                ToOperationalAreaId = request.ToOperationalAreaId,
                CustomerType = string.IsNullOrWhiteSpace(request.CustomerType)
                    ? "ALL"
                    : request.CustomerType.Trim().ToUpperInvariant(),
                MinimumFare = request.MinimumFare,
                StartAt = request.StartAt,
                EndAt = request.EndAt,
                Status = NormalizeStatus(request.Status),
                CreatedByUserId = GetCurrentUserId(),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Offers.Add(offer);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Offer created successfully.", offer });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] SaveOfferRequest request)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null) return NotFound(new { message = "Offer not found." });

            var validation = Validate(request);
            if (validation != null) return BadRequest(new { message = validation });

            offer.OfferName = request.OfferName.Trim();
            offer.Description = request.Description?.Trim();
            offer.DiscountType = NormalizeDiscountType(request.DiscountType);
            offer.DiscountValue = request.DiscountValue;
            offer.VehicleTypeId = request.VehicleTypeId;
            offer.FromOperationalAreaId = request.FromOperationalAreaId;
            offer.ToOperationalAreaId = request.ToOperationalAreaId;
            offer.CustomerType = string.IsNullOrWhiteSpace(request.CustomerType)
                ? "ALL"
                : request.CustomerType.Trim().ToUpperInvariant();
            offer.MinimumFare = request.MinimumFare;
            offer.StartAt = request.StartAt;
            offer.EndAt = request.EndAt;
            offer.Status = NormalizeStatus(request.Status);
            offer.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Offer updated successfully.", offer });
        }

        [HttpPut("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null) return NotFound(new { message = "Offer not found." });

            offer.Status = offer.Status == "ACTIVE" ? "INACTIVE" : "ACTIVE";
            offer.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Offer is now {offer.Status}.", offer });
        }

        private static string? Validate(SaveOfferRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.OfferName))
                return "Offer name is required.";

            if (request.DiscountValue <= 0)
                return "Discount value must be greater than zero.";

            if (NormalizeDiscountType(request.DiscountType) == "PERCENTAGE" &&
                request.DiscountValue > 100)
                return "Percentage discount cannot exceed 100%.";

            if (request.MinimumFare < 0)
                return "Minimum fare cannot be negative.";

            if (request.StartAt.HasValue && request.EndAt.HasValue &&
                request.EndAt.Value <= request.StartAt.Value)
                return "Offer end date/time must be after the start date/time.";

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
            return string.Equals(value, "ACTIVE", StringComparison.OrdinalIgnoreCase)
                ? "ACTIVE"
                : "INACTIVE";
        }
    }

    public class SaveOfferRequest
    {
        public string OfferName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string DiscountType { get; set; } = "PERCENTAGE";
        public decimal DiscountValue { get; set; }
        public int? VehicleTypeId { get; set; }
        public int? FromOperationalAreaId { get; set; }
        public int? ToOperationalAreaId { get; set; }
        public string CustomerType { get; set; } = "ALL";
        public decimal? MinimumFare { get; set; }
        public DateTime? StartAt { get; set; }
        public DateTime? EndAt { get; set; }
        public string Status { get; set; } = "INACTIVE";
    }
}
