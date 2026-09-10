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
    public class TaxiOperatorOperationalAreasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TaxiOperatorOperationalAreasController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("operators")]
        [HasPermission("MANAGE_TAXI_OPERATOR_AREAS")]
        public async Task<IActionResult> GetTaxiOperators()
        {
            var operators = await (
                from u in _context.Users
                join ur in _context.UserRoles on u.UserId equals ur.UserId
                join r in _context.Roles on ur.RoleId equals r.RoleId
                where r.RoleName == "TAXI_OPERATIONS"
                orderby u.FullName
                select new
                {
                    userId = u.UserId,
                    fullName = u.FullName,
                    email = u.Email,
                    phone = u.Phone,
                    accountStatus = u.AccountStatus
                }
            ).Distinct().ToListAsync();

            var operatorIds = operators.Select(x => x.userId).ToList();

            var assignments = await _context.TaxiOperatorOperationalAreas
                .Where(x => operatorIds.Contains(x.UserId))
                .Join(
                    _context.OperationalAreas,
                    x => x.OperationalAreaId,
                    a => a.OperationalAreaId,
                    (x, a) => new
                    {
                        x.UserId,
                        x.TaxiOperatorOperationalAreaId,
                        x.OperationalAreaId,
                        a.AreaName,
                        a.IsActive,
                        AssignmentIsActive = x.IsActive
                    }
                )
                .ToListAsync();

            var result = operators.Select(op => new
            {
                op.userId,
                op.fullName,
                op.email,
                op.phone,
                op.accountStatus,
                assignedAreas = assignments
                    .Where(a => a.UserId == op.userId)
                    .Select(a => new
                    {
                        a.TaxiOperatorOperationalAreaId,
                        a.OperationalAreaId,
                        a.AreaName,
                        areaIsActive = a.IsActive,
                        assignmentIsActive = a.AssignmentIsActive
                    })
                    .ToList()
            });

            return Ok(result);
        }

        [HttpGet("assignments")]
        [HasPermission("MANAGE_TAXI_OPERATOR_AREAS")]
        public async Task<IActionResult> GetAssignments()
        {
            var assignments = await (
                from x in _context.TaxiOperatorOperationalAreas
                join u in _context.Users on x.UserId equals u.UserId
                join a in _context.OperationalAreas on x.OperationalAreaId equals a.OperationalAreaId
                orderby a.AreaName, u.FullName
                select new
                {
                    taxiOperatorOperationalAreaId = x.TaxiOperatorOperationalAreaId,
                    userId = u.UserId,
                    fullName = u.FullName,
                    email = u.Email,
                    phone = u.Phone,
                    accountStatus = u.AccountStatus,
                    operationalAreaId = a.OperationalAreaId,
                    areaName = a.AreaName,
                    areaIsActive = a.IsActive,
                    assignmentIsActive = x.IsActive,
                    createdAt = x.CreatedAt,
                    updatedAt = x.UpdatedAt
                }
            ).ToListAsync();

            return Ok(assignments);
        }

        [HttpGet("operator/{userId:int}")]
        [HasPermission("MANAGE_TAXI_OPERATOR_AREAS")]
        public async Task<IActionResult> GetAssignmentsForOperator(int userId)
        {
            var operatorExists = await HasTaxiOperationsRole(userId);

            if (!operatorExists)
            {
                return NotFound(new { message = "Taxi Operator not found." });
            }

            var assignments = await (
                from x in _context.TaxiOperatorOperationalAreas
                join a in _context.OperationalAreas on x.OperationalAreaId equals a.OperationalAreaId
                where x.UserId == userId
                orderby a.AreaName
                select new
                {
                    taxiOperatorOperationalAreaId = x.TaxiOperatorOperationalAreaId,
                    operationalAreaId = a.OperationalAreaId,
                    areaName = a.AreaName,
                    areaIsActive = a.IsActive,
                    assignmentIsActive = x.IsActive,
                    createdAt = x.CreatedAt,
                    updatedAt = x.UpdatedAt
                }
            ).ToListAsync();

            return Ok(assignments);
        }

        [HttpGet("my-areas")]
        [Authorize(Roles = "TAXI_OPERATIONS")]
        public async Task<IActionResult> GetMyAreas()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new { message = "Unable to identify logged-in user." });
            }

            var areas = await (
                from x in _context.TaxiOperatorOperationalAreas
                join a in _context.OperationalAreas on x.OperationalAreaId equals a.OperationalAreaId
                where x.UserId == userId.Value && x.IsActive && a.IsActive
                orderby a.AreaName
                select new
                {
                    taxiOperatorOperationalAreaId = x.TaxiOperatorOperationalAreaId,
                    operationalAreaId = a.OperationalAreaId,
                    areaName = a.AreaName,
                    description = a.Description
                }
            ).ToListAsync();

            return Ok(areas);
        }

        [HttpPost("assign")]
        [HasPermission("MANAGE_TAXI_OPERATOR_AREAS")]
        public async Task<IActionResult> AssignArea([FromBody] AssignTaxiOperatorAreaRequest request)
        {
            if (request.UserId <= 0 || request.OperationalAreaId <= 0)
            {
                return BadRequest(new { message = "Taxi Operator and Operational Area are required." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            if (!await HasTaxiOperationsRole(request.UserId))
            {
                return BadRequest(new { message = "Selected user is not a Taxi Operator." });
            }

            if (!string.Equals(user.AccountStatus, "ACTIVE", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Selected Taxi Operator account is not active." });
            }

            var area = await _context.OperationalAreas.FirstOrDefaultAsync(a => a.OperationalAreaId == request.OperationalAreaId);
            if (area == null)
            {
                return NotFound(new { message = "Operational Area not found." });
            }

            if (!area.IsActive)
            {
                return BadRequest(new { message = "Selected Operational Area is disabled." });
            }

            var existing = await _context.TaxiOperatorOperationalAreas
                .FirstOrDefaultAsync(x => x.UserId == request.UserId && x.OperationalAreaId == request.OperationalAreaId);

            if (existing != null)
            {
                if (existing.IsActive)
                {
                    return BadRequest(new { message = "This Taxi Operator is already assigned to the selected Operational Area." });
                }

                existing.IsActive = true;
                existing.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Taxi Operator area assignment reactivated successfully.",
                    assignmentId = existing.TaxiOperatorOperationalAreaId
                });
            }

            var assignment = new TaxiOperatorOperationalArea
            {
                UserId = request.UserId,
                OperationalAreaId = request.OperationalAreaId,
                IsActive = true,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.TaxiOperatorOperationalAreas.Add(assignment);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Taxi Operator assigned to Operational Area successfully.",
                assignmentId = assignment.TaxiOperatorOperationalAreaId
            });
        }

        [HttpPut("{id:int}/enable")]
        [HasPermission("MANAGE_TAXI_OPERATOR_AREAS")]
        public async Task<IActionResult> EnableAssignment(int id)
        {
            var assignment = await _context.TaxiOperatorOperationalAreas
                .FirstOrDefaultAsync(x => x.TaxiOperatorOperationalAreaId == id);

            if (assignment == null)
            {
                return NotFound(new { message = "Assignment not found." });
            }

            var area = await _context.OperationalAreas
                .FirstOrDefaultAsync(a => a.OperationalAreaId == assignment.OperationalAreaId);

            if (area == null || !area.IsActive)
            {
                return BadRequest(new { message = "Cannot enable assignment because the Operational Area is disabled or missing." });
            }

            assignment.IsActive = true;
            assignment.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Assignment enabled successfully." });
        }

        [HttpPut("{id:int}/disable")]
        [HasPermission("MANAGE_TAXI_OPERATOR_AREAS")]
        public async Task<IActionResult> DisableAssignment(int id)
        {
            var assignment = await _context.TaxiOperatorOperationalAreas
                .FirstOrDefaultAsync(x => x.TaxiOperatorOperationalAreaId == id);

            if (assignment == null)
            {
                return NotFound(new { message = "Assignment not found." });
            }

            assignment.IsActive = false;
            assignment.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Assignment disabled successfully." });
        }

        private int? GetCurrentUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(value, out var userId) ? userId : null;
        }

        private async Task<bool> HasTaxiOperationsRole(int userId)
        {
            return await (
                from ur in _context.UserRoles
                join r in _context.Roles on ur.RoleId equals r.RoleId
                where ur.UserId == userId && r.RoleName == "TAXI_OPERATIONS"
                select ur
            ).AnyAsync();
        }
    }

    public class AssignTaxiOperatorAreaRequest
    {
        public int UserId { get; set; }
        public int OperationalAreaId { get; set; }
    }
}
