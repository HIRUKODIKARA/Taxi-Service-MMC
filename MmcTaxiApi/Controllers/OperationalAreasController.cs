using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MmcTaxiApi.Data;
using MmcTaxiApi.Models;

namespace MmcTaxiApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OperationalAreasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OperationalAreasController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET ALL ACTIVE OPERATIONAL AREAS
        // Passenger / Booking page can use this endpoint
        // GET: api/OperationalAreas
        // =========================================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OperationalArea>>> GetActiveAreas()
        {
            var areas = await _context.OperationalAreas
                .Where(a => a.IsActive)
                .OrderBy(a => a.AreaName)
                .ToListAsync();

            return Ok(areas);
        }

        // =========================================================
        // GET ALL OPERATIONAL AREAS
        // Useful for Super Admin management page
        // GET: api/OperationalAreas/all
        // =========================================================

        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<OperationalArea>>> GetAllAreas()
        {
            var areas = await _context.OperationalAreas
                .OrderBy(a => a.AreaName)
                .ToListAsync();

            return Ok(areas);
        }

        // =========================================================
        // GET ONE OPERATIONAL AREA
        // GET: api/OperationalAreas/5
        // =========================================================

        [HttpGet("{id}")]
        public async Task<ActionResult<OperationalArea>> GetArea(int id)
        {
            var area = await _context.OperationalAreas
                .FirstOrDefaultAsync(a => a.OperationalAreaId == id);

            if (area == null)
            {
                return NotFound(new
                {
                    message = "Operational area not found."
                });
            }

            return Ok(area);
        }

        // =========================================================
        // ADD NEW OPERATIONAL AREA
        // POST: api/OperationalAreas
        // =========================================================

        [HttpPost]
        public async Task<ActionResult<OperationalArea>> CreateArea(
            [FromBody] OperationalAreaRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.AreaName))
            {
                return BadRequest(new
                {
                    message = "Area name is required."
                });
            }

            var areaName = request.AreaName.Trim();

            var alreadyExists = await _context.OperationalAreas
                .AnyAsync(a => a.AreaName.ToLower() == areaName.ToLower());

            if (alreadyExists)
            {
                return BadRequest(new
                {
                    message = "This operational area already exists."
                });
            }

            var area = new OperationalArea
            {
                AreaName = areaName,

                Description = string.IsNullOrWhiteSpace(request.Description)
                    ? null
                    : request.Description.Trim(),

                IsActive = true,

                CreatedAt = DateTime.Now,

                UpdatedAt = DateTime.Now
            };

            _context.OperationalAreas.Add(area);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetArea),
                new { id = area.OperationalAreaId },
                area
            );
        }

        // =========================================================
        // UPDATE OPERATIONAL AREA
        // PUT: api/OperationalAreas/5
        // =========================================================

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateArea(
            int id,
            [FromBody] OperationalAreaRequest request)
        {
            var area = await _context.OperationalAreas
                .FirstOrDefaultAsync(a => a.OperationalAreaId == id);

            if (area == null)
            {
                return NotFound(new
                {
                    message = "Operational area not found."
                });
            }

            if (string.IsNullOrWhiteSpace(request.AreaName))
            {
                return BadRequest(new
                {
                    message = "Area name is required."
                });
            }

            var areaName = request.AreaName.Trim();

            var duplicateExists = await _context.OperationalAreas
                .AnyAsync(a =>
                    a.OperationalAreaId != id &&
                    a.AreaName.ToLower() == areaName.ToLower()
                );

            if (duplicateExists)
            {
                return BadRequest(new
                {
                    message = "Another operational area already uses this name."
                });
            }

            area.AreaName = areaName;

            area.Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim();

            area.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Operational area updated successfully.",
                area
            });
        }

        // =========================================================
        // ENABLE OPERATIONAL AREA
        // PUT: api/OperationalAreas/5/enable
        // =========================================================

        [HttpPut("{id}/enable")]
        public async Task<IActionResult> EnableArea(int id)
        {
            var area = await _context.OperationalAreas
                .FirstOrDefaultAsync(a => a.OperationalAreaId == id);

            if (area == null)
            {
                return NotFound(new
                {
                    message = "Operational area not found."
                });
            }

            area.IsActive = true;
            area.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Operational area enabled successfully.",
                area
            });
        }

        // =========================================================
        // DISABLE OPERATIONAL AREA
        // PUT: api/OperationalAreas/5/disable
        // =========================================================

        [HttpPut("{id}/disable")]
        public async Task<IActionResult> DisableArea(int id)
        {
            var area = await _context.OperationalAreas
                .FirstOrDefaultAsync(a => a.OperationalAreaId == id);

            if (area == null)
            {
                return NotFound(new
                {
                    message = "Operational area not found."
                });
            }

            area.IsActive = false;
            area.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Operational area disabled successfully.",
                area
            });
        }
    }

    // =============================================================
    // REQUEST MODEL
    // Used when creating/updating an Operational Area
    // =============================================================

    public class OperationalAreaRequest
    {
        public string AreaName { get; set; } = string.Empty;

        public string? Description { get; set; }
    }
}