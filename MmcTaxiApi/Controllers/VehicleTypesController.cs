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
    public class VehicleTypesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VehicleTypesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // HELPERS
        // =========================================================

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (claim == null ||
                !int.TryParse(claim.Value, out var userId))
            {
                return null;
            }

            return userId;
        }

        // =========================================================
        // GET: api/vehicletypes
        //
        // Public / Passenger booking pages:
        // Only ACTIVE vehicle types
        // =========================================================
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult> GetVehicleTypes()
        {
            var vehicleTypes = await _context.VehicleTypes
                .Where(v => v.Status == "ACTIVE")
                .OrderBy(v => v.TypeName)
                .Select(v => new
                {
                    v.VehicleTypeId,
                    v.TypeName,
                    v.Description,
                    v.PassengerCapacity,
                    v.Status,
                    v.CreatedAt
                })
                .ToListAsync();

            return Ok(vehicleTypes);
        }

        // =========================================================
        // GET: api/vehicletypes/all
        //
        // Super Admin / Admin:
        // Includes ACTIVE + INACTIVE
        // =========================================================
        [HttpGet("all")]
        [HasPermission("MANAGE_VEHICLE_TYPES")]
        public async Task<ActionResult> GetAllVehicleTypes()
        {
            var vehicleTypes = await _context.VehicleTypes
                .OrderBy(v => v.TypeName)
                .Select(v => new
                {
                    v.VehicleTypeId,
                    v.TypeName,
                    v.Description,
                    v.PassengerCapacity,
                    v.Status,
                    v.CreatedAt
                })
                .ToListAsync();

            return Ok(vehicleTypes);
        }

        // =========================================================
        // GET: api/vehicletypes/5
        // =========================================================
        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<ActionResult> GetVehicleType(int id)
        {
            var vehicleType = await _context.VehicleTypes
                .FirstOrDefaultAsync(v =>
                    v.VehicleTypeId == id);

            if (vehicleType == null)
            {
                return NotFound(new
                {
                    message = "Vehicle type not found."
                });
            }

            // Public users should not access inactive types.
            if (vehicleType.Status != "ACTIVE" &&
                !(User.Identity?.IsAuthenticated ?? false))
            {
                return NotFound(new
                {
                    message = "Vehicle type not found."
                });
            }

            return Ok(new
            {
                vehicleType.VehicleTypeId,
                vehicleType.TypeName,
                vehicleType.Description,
                vehicleType.PassengerCapacity,
                vehicleType.Status,
                vehicleType.CreatedAt
            });
        }

        // =========================================================
        // POST: api/vehicletypes
        //
        // Super Admin / Admin
        // =========================================================
        [HttpPost]
        [HasPermission("MANAGE_VEHICLE_TYPES")]
        public async Task<ActionResult> CreateVehicleType(
            [FromBody] CreateVehicleTypeRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Unable to identify logged-in user."
                });
            }

            var typeName = request.TypeName?.Trim();

            if (string.IsNullOrWhiteSpace(typeName))
            {
                return BadRequest(new
                {
                    message =
                        "Vehicle type name is required."
                });
            }

            if (typeName.Length > 50)
            {
                return BadRequest(new
                {
                    message =
                        "Vehicle type name cannot exceed 50 characters."
                });
            }

            if (request.PassengerCapacity <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Passenger capacity must be greater than zero."
                });
            }

            if (request.PassengerCapacity > 50)
            {
                return BadRequest(new
                {
                    message =
                        "Passenger capacity is too large."
                });
            }

            if (!string.IsNullOrWhiteSpace(request.Description) &&
                request.Description.Length > 255)
            {
                return BadRequest(new
                {
                    message =
                        "Description cannot exceed 255 characters."
                });
            }

            var duplicateExists =
                await _context.VehicleTypes.AnyAsync(v =>
                    v.TypeName.ToLower() ==
                    typeName.ToLower());

            if (duplicateExists)
            {
                return BadRequest(new
                {
                    message =
                        "A vehicle type with this name already exists."
                });
            }

            var vehicleType = new VehicleType
            {
                TypeName = typeName,
                Description =
                    string.IsNullOrWhiteSpace(
                        request.Description)
                        ? null
                        : request.Description.Trim(),
                PassengerCapacity =
                    request.PassengerCapacity,
                Status = "ACTIVE",
                CreatedAt = DateTime.Now
            };

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                _context.VehicleTypes.Add(vehicleType);

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,
                        ActivityType =
                            "VEHICLE_TYPE_CREATED",
                        Description =
                            $"Vehicle type '{vehicleType.TypeName}' was created.",
                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(
                    nameof(GetVehicleType),
                    new
                    {
                        id = vehicleType.VehicleTypeId
                    },
                    new
                    {
                        message =
                            "Vehicle type created successfully.",

                        vehicleType = new
                        {
                            vehicleType.VehicleTypeId,
                            vehicleType.TypeName,
                            vehicleType.Description,
                            vehicleType.PassengerCapacity,
                            vehicleType.Status,
                            vehicleType.CreatedAt
                        }
                    }
                );
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // =========================================================
        // PUT: api/vehicletypes/5
        //
        // Super Admin / Admin
        // =========================================================
        [HttpPut("{id:int}")]
        [HasPermission("MANAGE_VEHICLE_TYPES")]
        public async Task<IActionResult> UpdateVehicleType(
            int id,
            [FromBody] UpdateVehicleTypeRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Unable to identify logged-in user."
                });
            }

            var vehicleType = await _context.VehicleTypes
                .FirstOrDefaultAsync(v =>
                    v.VehicleTypeId == id);

            if (vehicleType == null)
            {
                return NotFound(new
                {
                    message =
                        "Vehicle type not found."
                });
            }

            var typeName = request.TypeName?.Trim();

            if (string.IsNullOrWhiteSpace(typeName))
            {
                return BadRequest(new
                {
                    message =
                        "Vehicle type name is required."
                });
            }

            if (typeName.Length > 50)
            {
                return BadRequest(new
                {
                    message =
                        "Vehicle type name cannot exceed 50 characters."
                });
            }

            if (request.PassengerCapacity <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Passenger capacity must be greater than zero."
                });
            }

            if (request.PassengerCapacity > 50)
            {
                return BadRequest(new
                {
                    message =
                        "Passenger capacity is too large."
                });
            }

            if (!string.IsNullOrWhiteSpace(
                    request.Description) &&
                request.Description.Length > 255)
            {
                return BadRequest(new
                {
                    message =
                        "Description cannot exceed 255 characters."
                });
            }

            var duplicateExists =
                await _context.VehicleTypes.AnyAsync(v =>
                    v.VehicleTypeId != id &&
                    v.TypeName.ToLower() ==
                    typeName.ToLower());

            if (duplicateExists)
            {
                return BadRequest(new
                {
                    message =
                        "Another vehicle type with this name already exists."
                });
            }

            var oldName = vehicleType.TypeName;

            vehicleType.TypeName = typeName;
            vehicleType.Description =
                string.IsNullOrWhiteSpace(
                    request.Description)
                    ? null
                    : request.Description.Trim();
            vehicleType.PassengerCapacity =
                request.PassengerCapacity;

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType =
                        "VEHICLE_TYPE_UPDATED",
                    Description =
                        $"Vehicle type '{oldName}' was updated to '{vehicleType.TypeName}'.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Vehicle type updated successfully.",

                vehicleType = new
                {
                    vehicleType.VehicleTypeId,
                    vehicleType.TypeName,
                    vehicleType.Description,
                    vehicleType.PassengerCapacity,
                    vehicleType.Status,
                    vehicleType.CreatedAt
                }
            });
        }

        // =========================================================
        // PUT: api/vehicletypes/5/status
        //
        // ACTIVE / INACTIVE
        // No DELETE
        // =========================================================
        [HttpPut("{id:int}/status")]
        [HasPermission("MANAGE_VEHICLE_TYPES")]
        public async Task<IActionResult> ChangeVehicleTypeStatus(
            int id,
            [FromBody] ChangeVehicleTypeStatusRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Unable to identify logged-in user."
                });
            }

            var vehicleType = await _context.VehicleTypes
                .FirstOrDefaultAsync(v =>
                    v.VehicleTypeId == id);

            if (vehicleType == null)
            {
                return NotFound(new
                {
                    message =
                        "Vehicle type not found."
                });
            }

            var newStatus = request.Status?
                .Trim()
                .ToUpperInvariant();

            if (newStatus != "ACTIVE" &&
                newStatus != "INACTIVE")
            {
                return BadRequest(new
                {
                    message =
                        "Status must be ACTIVE or INACTIVE."
                });
            }

            if (vehicleType.Status == newStatus)
            {
                return Ok(new
                {
                    message =
                        $"Vehicle type is already {newStatus}.",
                    vehicleTypeId =
                        vehicleType.VehicleTypeId,
                    status = vehicleType.Status
                });
            }

            if (newStatus == "INACTIVE")
            {
                var activeBookingExists =
                    await _context.Bookings.AnyAsync(b =>
                        b.VehicleTypeId == id &&
                        (
                            b.BookingStatus == "PENDING" ||
                            b.BookingStatus ==
                                "WAITING_FOR_DRIVER" ||
                            b.BookingStatus == "ACCEPTED" ||
                            b.BookingStatus ==
                                "DRIVER_ARRIVING" ||
                            b.BookingStatus == "ON_RIDE"
                        ));

                if (activeBookingExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "This vehicle type cannot be deactivated because it is used by an active booking."
                    });
                }
            }

            var oldStatus = vehicleType.Status;

            vehicleType.Status = newStatus;

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType =
                        "VEHICLE_TYPE_STATUS_CHANGED",
                    Description =
                        $"Vehicle type '{vehicleType.TypeName}' status changed from {oldStatus} to {newStatus}.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    $"Vehicle type status changed to {newStatus} successfully.",
                vehicleTypeId =
                    vehicleType.VehicleTypeId,
                status = vehicleType.Status
            });
        }

        // =========================================================
        // Convenience endpoint:
        // PUT: api/vehicletypes/5/activate
        // =========================================================
        [HttpPut("{id:int}/activate")]
        [HasPermission("MANAGE_VEHICLE_TYPES")]
        public async Task<IActionResult> ActivateVehicleType(
            int id)
        {
            return await ChangeStatusInternal(
                id,
                "ACTIVE"
            );
        }

        // =========================================================
        // Convenience endpoint:
        // PUT: api/vehicletypes/5/deactivate
        // =========================================================
        [HttpPut("{id:int}/deactivate")]
        [HasPermission("MANAGE_VEHICLE_TYPES")]
        public async Task<IActionResult> DeactivateVehicleType(
            int id)
        {
            return await ChangeStatusInternal(
                id,
                "INACTIVE"
            );
        }

        private async Task<IActionResult> ChangeStatusInternal(
            int id,
            string newStatus)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Unable to identify logged-in user."
                });
            }

            var vehicleType = await _context.VehicleTypes
                .FirstOrDefaultAsync(v =>
                    v.VehicleTypeId == id);

            if (vehicleType == null)
            {
                return NotFound(new
                {
                    message =
                        "Vehicle type not found."
                });
            }

            if (vehicleType.Status == newStatus)
            {
                return Ok(new
                {
                    message =
                        $"Vehicle type is already {newStatus}.",
                    vehicleTypeId =
                        vehicleType.VehicleTypeId,
                    status = vehicleType.Status
                });
            }

            if (newStatus == "INACTIVE")
            {
                var activeBookingExists =
                    await _context.Bookings.AnyAsync(b =>
                        b.VehicleTypeId == id &&
                        (
                            b.BookingStatus == "PENDING" ||
                            b.BookingStatus ==
                                "WAITING_FOR_DRIVER" ||
                            b.BookingStatus == "ACCEPTED" ||
                            b.BookingStatus ==
                                "DRIVER_ARRIVING" ||
                            b.BookingStatus == "ON_RIDE"
                        ));

                if (activeBookingExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "This vehicle type cannot be deactivated because it is used by an active booking."
                    });
                }
            }

            var oldStatus = vehicleType.Status;

            vehicleType.Status = newStatus;

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType =
                        "VEHICLE_TYPE_STATUS_CHANGED",
                    Description =
                        $"Vehicle type '{vehicleType.TypeName}' status changed from {oldStatus} to {newStatus}.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    $"Vehicle type {newStatus.ToLowerInvariant()} successfully.",
                vehicleTypeId =
                    vehicleType.VehicleTypeId,
                status = vehicleType.Status
            });
        }
    }

    // =============================================================
    // DTOs
    // =============================================================

    public class CreateVehicleTypeRequest
    {
        public string TypeName { get; set; } =
            string.Empty;

        public string? Description { get; set; }

        public int PassengerCapacity { get; set; }
    }

    public class UpdateVehicleTypeRequest
    {
        public string TypeName { get; set; } =
            string.Empty;

        public string? Description { get; set; }

        public int PassengerCapacity { get; set; }
    }

    public class ChangeVehicleTypeStatusRequest
    {
        public string Status { get; set; } =
            string.Empty;
    }
}