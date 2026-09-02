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
    public class DriverLocationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DriverLocationsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // HELPER - Get logged-in user ID from JWT
        // =========================================================
        private int? GetCurrentUserId()
        {
            var claim =
                User.FindFirst(ClaimTypes.NameIdentifier);

            if (claim == null ||
                !int.TryParse(claim.Value, out var userId))
            {
                return null;
            }

            return userId;
        }

        private async Task<bool> HasPermissionAsync(
            string permissionName)
        {
            if (User.IsInRole("SUPER_ADMIN"))
            {
                return true;
            }

            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return false;
            }

            return await (
                from userRole in _context.UserRoles
                join rolePermission in _context.RolePermissions
                    on userRole.RoleId equals rolePermission.RoleId
                join permission in _context.Permissions
                    on rolePermission.PermissionId equals permission.PermissionId
                where userRole.UserId == currentUserId.Value
                      && permission.PermissionName == permissionName
                select permission
            ).AnyAsync();
        }

        // =========================================================
        // HELPER - Get current driver's profile
        // =========================================================
        private async Task<Driver?> GetCurrentDriverAsync()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return null;
            }

            return await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.UserId == currentUserId.Value);
        }

        // =========================================================
        // HELPER
        // Check if current user may view driver's location
        // =========================================================
        private async Task<bool> CanViewDriverLocationAsync(
            int driverId)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return false;
            }

            // Users with VIEW_DRIVER_LOCATION may monitor drivers.
            if (await HasPermissionAsync("VIEW_DRIVER_LOCATION"))
            {
                return true;
            }

            // Driver can view own location
            if (User.IsInRole("DRIVER"))
            {
                return await _context.Drivers
                    .AnyAsync(d =>
                        d.DriverId == driverId &&
                        d.UserId == currentUserId.Value);
            }

            // Passenger can see location only when the driver
            // is assigned to passenger's active booking.
            if (User.IsInRole("PASSENGER"))
            {
                return await _context.Bookings
                    .AnyAsync(b =>
                        b.PassengerId ==
                            currentUserId.Value &&
                        b.AssignedDriverId ==
                            driverId &&
                        (
                            b.BookingStatus == "ACCEPTED" ||
                            b.BookingStatus == "DRIVER_ARRIVING" ||
                            b.BookingStatus == "ON_RIDE"
                        ));
            }

            return false;
        }

        // =========================================================
        // GET: api/driverlocations
        //
        // Full location collection:
        // Super Admin / Admin / Taxi Operations only
        // =========================================================
        [HttpGet]
        [HasPermission("VIEW_DRIVER_LOCATION")]
        public async Task<ActionResult> GetAllLocations()
        {
            var locations =
                await _context.DriverLocations
                    .OrderByDescending(l =>
                        l.RecordedAt)
                    .Select(l => new
                    {
                        l.LocationId,
                        l.DriverId,
                        l.Latitude,
                        l.Longitude,
                        l.RecordedAt
                    })
                    .ToListAsync();

            return Ok(locations);
        }

        // =========================================================
        // GET: api/driverlocations/driver/1/latest
        //
        // Operations/Admin/Super Admin -> any driver
        // Driver -> own location
        // Passenger -> assigned active driver only
        // =========================================================
        [HttpGet("driver/{driverId}/latest")]
        public async Task<ActionResult>
            GetLatestDriverLocation(int driverId)
        {
            var driverExists =
                await _context.Drivers
                    .AnyAsync(d =>
                        d.DriverId == driverId);

            if (!driverExists)
            {
                return NotFound(new
                {
                    message = "Driver not found."
                });
            }

            if (!await CanViewDriverLocationAsync(driverId))
            {
                return StatusCode(403, new
                {
                    message =
                        "You do not have permission to view this driver's location."
                });
            }

            var location =
                await _context.DriverLocations
                    .Where(l =>
                        l.DriverId == driverId)
                    .OrderByDescending(l =>
                        l.RecordedAt)
                    .Select(l => new
                    {
                        l.LocationId,
                        l.DriverId,
                        l.Latitude,
                        l.Longitude,
                        l.RecordedAt
                    })
                    .FirstOrDefaultAsync();

            if (location == null)
            {
                return NotFound(new
                {
                    message =
                        "Driver location not found."
                });
            }

            return Ok(location);
        }

        // =========================================================
        // GET: api/driverlocations/driver/1
        //
        // Location history is more sensitive.
        //
        // Operations/Admin/Super Admin -> any driver
        // Driver -> own history
        //
        // Passenger is NOT allowed full location history.
        // =========================================================
        [HttpGet("driver/{driverId}")]
        public async Task<ActionResult>
            GetDriverLocations(int driverId)
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

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.DriverId == driverId);

            if (driver == null)
            {
                return NotFound(new
                {
                    message = "Driver not found."
                });
            }

            var hasViewPermission =
                await HasPermissionAsync("VIEW_DRIVER_LOCATION");

            var ownDriver =
                User.IsInRole("DRIVER") &&
                driver.UserId == currentUserId.Value;

            if (!hasViewPermission && !ownDriver)
            {
                return StatusCode(403, new
                {
                    message =
                        "You do not have permission to view this driver's location history."
                });
            }

            var locations =
                await _context.DriverLocations
                    .Where(l =>
                        l.DriverId == driverId)
                    .OrderByDescending(l =>
                        l.RecordedAt)
                    .Select(l => new
                    {
                        l.LocationId,
                        l.DriverId,
                        l.Latitude,
                        l.Longitude,
                        l.RecordedAt
                    })
                    .ToListAsync();

            return Ok(locations);
        }

        // =========================================================
        // POST: api/driverlocations
        //
        // DRIVER ONLY
        //
        // DriverId is NOT accepted from client.
        // Driver is identified from JWT.
        // =========================================================
        [HttpPost]
        [HasPermission("UPDATE_DRIVER_LOCATION")]
        public async Task<ActionResult>
            AddDriverLocation(
                [FromBody] AddDriverLocationRequest request)
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

            var driver =
                await GetCurrentDriverAsync();

            if (driver == null)
            {
                return NotFound(new
                {
                    message =
                        "Driver profile not found for the logged-in user."
                });
            }

            // -----------------------------------------------------
            // Driver must be approved
            // -----------------------------------------------------
            if (driver.VerificationStatus != "APPROVED")
            {
                return BadRequest(new
                {
                    message =
                        "Only approved drivers can update location."
                });
            }

            // -----------------------------------------------------
            // GPS must be enabled
            // -----------------------------------------------------
            if (!driver.GpsEnabled)
            {
                return BadRequest(new
                {
                    message =
                        "GPS must be enabled before sending location."
                });
            }

            // -----------------------------------------------------
            // Validate latitude
            // -----------------------------------------------------
            if (request.Latitude < -90 ||
                request.Latitude > 90)
            {
                return BadRequest(new
                {
                    message =
                        "Latitude must be between -90 and 90."
                });
            }

            // -----------------------------------------------------
            // Validate longitude
            // -----------------------------------------------------
            if (request.Longitude < -180 ||
                request.Longitude > 180)
            {
                return BadRequest(new
                {
                    message =
                        "Longitude must be between -180 and 180."
                });
            }

            var location = new DriverLocation
            {
                DriverId = driver.DriverId,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                RecordedAt = DateTime.Now
            };

            _context.DriverLocations.Add(location);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Driver location updated successfully.",

                location = new
                {
                    location.LocationId,
                    location.DriverId,
                    location.Latitude,
                    location.Longitude,
                    location.RecordedAt
                }
            });
        }

        // =========================================================
        // GET: api/driverlocations/my-latest
        //
        // Driver can get own latest location without sending ID.
        // =========================================================
        [HttpGet("my-latest")]
        [HasPermission("UPDATE_DRIVER_LOCATION")]
        public async Task<ActionResult>
            GetMyLatestLocation()
        {
            var driver =
                await GetCurrentDriverAsync();

            if (driver == null)
            {
                return NotFound(new
                {
                    message =
                        "Driver profile not found for the logged-in user."
                });
            }

            var location =
                await _context.DriverLocations
                    .Where(l =>
                        l.DriverId ==
                            driver.DriverId)
                    .OrderByDescending(l =>
                        l.RecordedAt)
                    .Select(l => new
                    {
                        l.LocationId,
                        l.DriverId,
                        l.Latitude,
                        l.Longitude,
                        l.RecordedAt
                    })
                    .FirstOrDefaultAsync();

            if (location == null)
            {
                return NotFound(new
                {
                    message =
                        "No location has been recorded yet."
                });
            }

            return Ok(location);
        }
    }

    // =============================================================
    // LOCATION DTO
    // =============================================================
    public class AddDriverLocationRequest
    {
        public decimal Latitude { get; set; }

        public decimal Longitude { get; set; }
    }
}