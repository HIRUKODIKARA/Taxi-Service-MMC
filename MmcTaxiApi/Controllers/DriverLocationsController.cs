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

        private const string PHONE_MAP = "PHONE_MAP";
        private const string GPS_DEVICE = "GPS_DEVICE";

        public DriverLocationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null || !int.TryParse(claim.Value, out var userId))
                return null;
            return userId;
        }

        private async Task<bool> HasPermissionAsync(string permissionName)
        {
            if (User.IsInRole("SUPER_ADMIN"))
                return true;

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return false;

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

        private async Task<Driver?> GetCurrentDriverAsync()
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return null;

            return await _context.Drivers
                .FirstOrDefaultAsync(d => d.UserId == currentUserId.Value);
        }

        private async Task<bool> CanViewDriverLocationAsync(int driverId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return false;

            if (await HasPermissionAsync("VIEW_DRIVER_LOCATION"))
                return true;

            if (User.IsInRole("DRIVER"))
            {
                return await _context.Drivers.AnyAsync(d =>
                    d.DriverId == driverId &&
                    d.UserId == currentUserId.Value);
            }

            if (User.IsInRole("PASSENGER"))
            {
                return await _context.Bookings.AnyAsync(b =>
                    b.PassengerId == currentUserId.Value &&
                    b.AssignedDriverId == driverId &&
                    (
                        b.BookingStatus == "ACCEPTED" ||
                        b.BookingStatus == "DRIVER_ARRIVING" ||
                        b.BookingStatus == "DRIVER_ARRIVED" ||
                        b.BookingStatus == "ON_RIDE"
                    ));
            }

            return false;
        }

        private string NormalizeTrackingSource(string? source)
        {
            var normalized = (source ?? PHONE_MAP).Trim().ToUpperInvariant();
            return normalized == GPS_DEVICE ? GPS_DEVICE : PHONE_MAP;
        }

        private object BuildTrackingStatus(DateTime recordedAt, string trackingSource)
        {
            var ageSeconds = Math.Max(0, (DateTime.Now - recordedAt).TotalSeconds);

            var connectionStatus = ageSeconds <= 30
                ? "LIVE"
                : ageSeconds <= 60
                    ? "UNSTABLE"
                    : "OFFLINE";

            return new
            {
                connectionStatus,
                isOnline = ageSeconds <= 60,
                ageSeconds = Math.Round(ageSeconds),
                trackingSource
            };
        }

        [HttpGet]
        [HasPermission("VIEW_DRIVER_LOCATION")]
        public async Task<ActionResult> GetAllLocations()
        {
            var locations = await _context.DriverLocations
                .OrderByDescending(l => l.RecordedAt)
                .Select(l => new
                {
                    l.LocationId,
                    l.DriverId,
                    l.Latitude,
                    l.Longitude,
                    l.TrackingSource,
                    l.RecordedAt
                })
                .ToListAsync();

            return Ok(locations);
        }

        [HttpGet("driver/{driverId}/latest")]
        public async Task<ActionResult> GetLatestDriverLocation(int driverId)
        {
            var driverExists = await _context.Drivers
                .AnyAsync(d => d.DriverId == driverId);

            if (!driverExists)
                return NotFound(new { message = "Driver not found." });

            if (!await CanViewDriverLocationAsync(driverId))
            {
                return StatusCode(403, new
                {
                    message = "You do not have permission to view this driver's location."
                });
            }

            var location = await _context.DriverLocations
                .Where(l => l.DriverId == driverId)
                .OrderByDescending(l => l.RecordedAt)
                .FirstOrDefaultAsync();

            if (location == null)
            {
                return NotFound(new
                {
                    message = "Driver location not found.",
                    connectionStatus = "OFFLINE",
                    isOnline = false
                });
            }

            var source = NormalizeTrackingSource(location.TrackingSource);

            return Ok(new
            {
                location.LocationId,
                location.DriverId,
                location.Latitude,
                location.Longitude,
                trackingSource = source,
                location.RecordedAt,
                tracking = BuildTrackingStatus(location.RecordedAt, source)
            });
        }

        [HttpGet("driver/{driverId}")]
        public async Task<ActionResult> GetDriverLocations(int driverId)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.DriverId == driverId);

            if (driver == null)
                return NotFound(new { message = "Driver not found." });

            var hasViewPermission = await HasPermissionAsync("VIEW_DRIVER_LOCATION");
            var ownDriver = User.IsInRole("DRIVER") &&
                            driver.UserId == currentUserId.Value;

            if (!hasViewPermission && !ownDriver)
            {
                return StatusCode(403, new
                {
                    message = "You do not have permission to view this driver's location history."
                });
            }

            var locations = await _context.DriverLocations
                .Where(l => l.DriverId == driverId)
                .OrderByDescending(l => l.RecordedAt)
                .Select(l => new
                {
                    l.LocationId,
                    l.DriverId,
                    l.Latitude,
                    l.Longitude,
                    l.TrackingSource,
                    l.RecordedAt
                })
                .ToListAsync();

            return Ok(locations);
        }

        [HttpPost]
        [HasPermission("UPDATE_DRIVER_LOCATION")]
        public async Task<ActionResult> AddDriverLocation(
            [FromBody] AddDriverLocationRequest request)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            var driver = await GetCurrentDriverAsync();
            if (driver == null)
            {
                return NotFound(new
                {
                    message = "Driver profile not found for the logged-in user."
                });
            }

            if (driver.VerificationStatus != "APPROVED")
            {
                return BadRequest(new
                {
                    message = "Only approved drivers can update location."
                });
            }

            if (!driver.GpsEnabled)
            {
                return BadRequest(new
                {
                    message = "Location sharing must be enabled before sending location."
                });
            }

            if (request.Latitude < -90 || request.Latitude > 90)
            {
                return BadRequest(new
                {
                    message = "Latitude must be between -90 and 90."
                });
            }

            if (request.Longitude < -180 || request.Longitude > 180)
            {
                return BadRequest(new
                {
                    message = "Longitude must be between -180 and 180."
                });
            }

            var trackingSource = NormalizeTrackingSource(request.TrackingSource);

            var location = new DriverLocation
            {
                DriverId = driver.DriverId,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                TrackingSource = trackingSource,
                RecordedAt = DateTime.Now
            };

            _context.DriverLocations.Add(location);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Driver location updated successfully.",
                location = new
                {
                    location.LocationId,
                    location.DriverId,
                    location.Latitude,
                    location.Longitude,
                    location.TrackingSource,
                    location.RecordedAt,
                    tracking = BuildTrackingStatus(
                        location.RecordedAt,
                        location.TrackingSource)
                }
            });
        }

        [HttpGet("my-latest")]
        [HasPermission("UPDATE_DRIVER_LOCATION")]
        public async Task<ActionResult> GetMyLatestLocation()
        {
            var driver = await GetCurrentDriverAsync();
            if (driver == null)
            {
                return NotFound(new
                {
                    message = "Driver profile not found for the logged-in user."
                });
            }

            var location = await _context.DriverLocations
                .Where(l => l.DriverId == driver.DriverId)
                .OrderByDescending(l => l.RecordedAt)
                .FirstOrDefaultAsync();

            if (location == null)
            {
                return NotFound(new
                {
                    message = "No location has been recorded yet.",
                    connectionStatus = "OFFLINE",
                    isOnline = false
                });
            }

            var source = NormalizeTrackingSource(location.TrackingSource);

            return Ok(new
            {
                location.LocationId,
                location.DriverId,
                location.Latitude,
                location.Longitude,
                trackingSource = source,
                location.RecordedAt,
                tracking = BuildTrackingStatus(location.RecordedAt, source)
            });
        }
    }

    public class AddDriverLocationRequest
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string TrackingSource { get; set; } = "PHONE_MAP";
    }
}
