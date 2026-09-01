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
    public class BookingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BookingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id) ? id : null;
        }

        private bool IsOperationsUser() =>
            User.IsInRole("SUPER_ADMIN") || User.IsInRole("ADMIN") || User.IsInRole("TAXI_OPERATIONS");

        private async Task<Driver?> GetCurrentDriverAsync()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return null;
            return await _context.Drivers.FirstOrDefaultAsync(d => d.UserId == userId.Value);
        }

        private async Task<bool> CanViewBookingAsync(Booking booking)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return false;
            if (IsOperationsUser()) return true;
            if (User.IsInRole("PASSENGER") && booking.PassengerId == userId.Value) return true;
            if (User.IsInRole("DRIVER") && booking.AssignedDriverId != null)
            {
                var driver = await GetCurrentDriverAsync();
                return driver != null && booking.AssignedDriverId == driver.DriverId;
            }
            return false;
        }

        // =========================================================
        // GET: api/bookings
        // =========================================================
        [HttpGet]
        [Authorize(Policy = "OperationsOnly")]
        public async Task<ActionResult<IEnumerable<Booking>>> GetBookings()
        {
            var bookings = await _context.Bookings
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

            return Ok(bookings);
        }

        // =========================================================
        // GET: api/bookings/my
        // Passenger: own bookings | Driver: assigned bookings
        // =========================================================
        [HttpGet("my")]
        public async Task<ActionResult> GetMyBookings()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized(new { message = "Unable to identify logged-in user." });

            if (User.IsInRole("PASSENGER"))
            {
                var items = await _context.Bookings.Where(b => b.PassengerId == userId.Value)
                    .OrderByDescending(b => b.CreatedAt).ToListAsync();
                return Ok(items);
            }

            if (User.IsInRole("DRIVER"))
            {
                var driver = await GetCurrentDriverAsync();
                if (driver == null) return NotFound(new { message = "Driver profile not found." });
                var items = await _context.Bookings.Where(b => b.AssignedDriverId == driver.DriverId)
                    .OrderByDescending(b => b.CreatedAt).ToListAsync();
                return Ok(items);
            }

            if (IsOperationsUser())
            {
                return Ok(await _context.Bookings.OrderByDescending(b => b.CreatedAt).ToListAsync());
            }

            return StatusCode(403, new { message = "You do not have permission to view bookings." });
        }

        // =========================================================
        // GET: api/bookings/1
        // =========================================================
        [HttpGet("{id}")]
        public async Task<ActionResult<Booking>> GetBooking(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);

            if (booking == null)
            {
                return NotFound(new
                {
                    message = "Booking not found."
                });
            }

            if (!await CanViewBookingAsync(booking))
                return StatusCode(403, new { message = "You do not have permission to view this booking." });

            return Ok(booking);
        }

        // =========================================================
        // GET: api/bookings/1/history
        // =========================================================
        [HttpGet("{id}/history")]
        public async Task<ActionResult<IEnumerable<BookingStatusHistory>>>
            GetBookingHistory(int id)
        {
            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingId == id);
            if (booking == null) return NotFound(new { message = "Booking not found." });
            if (!await CanViewBookingAsync(booking))
                return StatusCode(403, new { message = "You do not have permission to view this booking history." });

            var history = await _context.BookingStatusHistories
                .Where(h => h.BookingId == id)
                .OrderBy(h => h.ChangedAt)
                .ToListAsync();

            return Ok(history);
        }

        // =========================================================
        // POST: api/bookings
        // =========================================================
        [HttpPost]
        public async Task<ActionResult<Booking>> CreateBooking(
            Booking booking)
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null) return Unauthorized(new { message = "Unable to identify logged-in user." });

            // Passenger may create WEBSITE bookings only, for self.
            if (User.IsInRole("PASSENGER") && !IsOperationsUser())
            {
                booking.PassengerId = currentUserId.Value;
                booking.CreatedByUserId = currentUserId.Value;
                booking.BookingSource = "WEBSITE";

                var passenger = await _context.Users.FirstOrDefaultAsync(u => u.UserId == currentUserId.Value && u.AccountStatus == "ACTIVE");
                if (passenger == null) return BadRequest(new { message = "Passenger account is not active." });
                booking.PassengerName = passenger.FullName;
                booking.PassengerPhone = passenger.Phone ?? booking.PassengerPhone;
            }
            else if (IsOperationsUser())
            {
                booking.CreatedByUserId = currentUserId.Value;
            }
            else
            {
                return StatusCode(403, new { message = "You do not have permission to create bookings." });
            }

            if (string.IsNullOrWhiteSpace(booking.PassengerName) ||
                string.IsNullOrWhiteSpace(booking.PassengerPhone) ||
                string.IsNullOrWhiteSpace(booking.PickupLocation) ||
                string.IsNullOrWhiteSpace(booking.Destination))
            {
                return BadRequest(new
                {
                    message =
                        "Passenger name, phone, pickup location and destination are required."
                });
            }

            var validSources = new[]
            {
                "WEBSITE",
                "PHONE",
                "ON_SITE"
            };

            var source = string.IsNullOrWhiteSpace(booking.BookingSource)
                ? "WEBSITE"
                : booking.BookingSource.Trim().ToUpperInvariant();

            if (User.IsInRole("PASSENGER") && source != "WEBSITE")
                return StatusCode(403, new { message = "Passengers can create WEBSITE bookings only." });

            if (!validSources.Contains(source))
            {
                return BadRequest(new
                {
                    message = "Invalid booking source."
                });
            }

            var vehicleTypeExists = await _context.VehicleTypes
                .AnyAsync(v =>
                    v.VehicleTypeId == booking.VehicleTypeId &&
                    v.Status == "ACTIVE");

            if (!vehicleTypeExists)
            {
                return BadRequest(new
                {
                    message =
                        "Selected vehicle type does not exist or is inactive."
                });
            }

            if (booking.PassengerId != null)
            {
                var passengerExists = await _context.Users
                    .AnyAsync(u =>
                        u.UserId == booking.PassengerId.Value &&
                        u.AccountStatus == "ACTIVE");

                if (!passengerExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "Passenger account does not exist or is inactive."
                    });
                }
            }

            booking.BookingId = 0;
            booking.BookingSource = source;

            // Website / Phone / Counter bookings first wait
            // for Taxi Operations / driver assignment workflow.
            booking.BookingStatus = "PENDING";

            booking.AssignedDriverId = null;
            booking.AssignedVehicleId = null;

            if (booking.BookingDate == null)
            {
                booking.BookingDate = DateTime.Today;
            }

            if (booking.BookingTime == null)
            {
                booking.BookingTime = DateTime.Now.TimeOfDay;
            }

            booking.CreatedAt = DateTime.Now;
            booking.UpdatedAt = DateTime.Now;

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                _context.Bookings.Add(booking);
                await _context.SaveChangesAsync();

                AddBookingHistoryEntity(
                    booking.BookingId,
                    null,
                    "PENDING",
                    booking.CreatedByUserId,
                    "Booking created"
                );

                if (booking.PassengerId != null)
                {
                    AddNotificationEntity(
                        booking.PassengerId.Value,
                        "Booking Created",
                        $"Your booking #{booking.BookingId} has been created successfully.",
                        "BOOKING"
                    );
                }

                AddActivityLogEntity(
                    booking.CreatedByUserId,
                    "BOOKING_CREATED",
                    $"Booking #{booking.BookingId} was created through {booking.BookingSource}."
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(
                    nameof(GetBooking),
                    new { id = booking.BookingId },
                    booking
                );
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // =========================================================
        // PUT: api/bookings/1/assign
        // Taxi Operations assigns driver + vehicle
        // =========================================================
        [HttpPut("{id}/assign")]
        [Authorize(Policy = "OperationsOnly")]
        public async Task<IActionResult> AssignBooking(
            int id,
            [FromBody] AssignBookingRequest request)
        {
            var booking = await _context.Bookings.FindAsync(id);

            if (booking == null)
            {
                return NotFound(new
                {
                    message = "Booking not found."
                });
            }

            if (booking.BookingStatus != "PENDING" &&
                booking.BookingStatus != "REJECTED")
            {
                return BadRequest(new
                {
                    message =
                        "Only PENDING or REJECTED bookings can be assigned."
                });
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.DriverId == request.DriverId);

            if (driver == null)
            {
                return BadRequest(new
                {
                    message = "Driver not found."
                });
            }

            if (driver.VerificationStatus != "APPROVED")
            {
                return BadRequest(new
                {
                    message =
                        "Only approved drivers can receive bookings."
                });
            }

            if (driver.OperationalStatus != "AVAILABLE")
            {
                return BadRequest(new
                {
                    message =
                        "Selected driver is not currently available."
                });
            }

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v =>
                    v.VehicleId == request.VehicleId);

            if (vehicle == null)
            {
                return BadRequest(new
                {
                    message = "Vehicle not found."
                });
            }

            if (vehicle.DriverId != driver.DriverId)
            {
                return BadRequest(new
                {
                    message =
                        "Selected vehicle is not assigned to the selected driver."
                });
            }

            if (vehicle.AccountStatus != "ACTIVE")
            {
                return BadRequest(new
                {
                    message =
                        "Selected vehicle is inactive."
                });
            }

            if (vehicle.OperationalStatus != "AVAILABLE")
            {
                return BadRequest(new
                {
                    message =
                        "Selected vehicle is not currently available."
                });
            }

            if (vehicle.VehicleTypeId != booking.VehicleTypeId)
            {
                return BadRequest(new
                {
                    message =
                        "Selected vehicle does not match the requested vehicle type."
                });
            }

            var driverHasActiveBooking = await _context.Bookings
                .AnyAsync(b =>
                    b.BookingId != booking.BookingId &&
                    b.AssignedDriverId == driver.DriverId &&
                    (
                        b.BookingStatus == "WAITING_FOR_DRIVER" ||
                        b.BookingStatus == "ACCEPTED" ||
                        b.BookingStatus == "DRIVER_ARRIVING" ||
                        b.BookingStatus == "ON_RIDE"
                    ));

            if (driverHasActiveBooking)
            {
                return BadRequest(new
                {
                    message =
                        "Selected driver already has an active booking."
                });
            }

            var vehicleHasActiveBooking = await _context.Bookings
                .AnyAsync(b =>
                    b.BookingId != booking.BookingId &&
                    b.AssignedVehicleId == vehicle.VehicleId &&
                    (
                        b.BookingStatus == "WAITING_FOR_DRIVER" ||
                        b.BookingStatus == "ACCEPTED" ||
                        b.BookingStatus == "DRIVER_ARRIVING" ||
                        b.BookingStatus == "ON_RIDE"
                    ));

            if (vehicleHasActiveBooking)
            {
                return BadRequest(new
                {
                    message =
                        "Selected vehicle already has an active booking."
                });
            }

            var oldStatus = booking.BookingStatus;

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                booking.AssignedDriverId = driver.DriverId;
                booking.AssignedVehicleId = vehicle.VehicleId;
                booking.BookingStatus = "WAITING_FOR_DRIVER";
                booking.UpdatedAt = DateTime.Now;

                AddBookingHistoryEntity(
                    booking.BookingId,
                    oldStatus,
                    "WAITING_FOR_DRIVER",
                    GetCurrentUserId(),
                    "Driver and vehicle assigned"
                );

                AddNotificationEntity(
                    driver.UserId,
                    "New Booking Request",
                    $"You have received booking request #{booking.BookingId} from {booking.PickupLocation} to {booking.Destination}.",
                    "BOOKING"
                );

                if (booking.PassengerId != null)
                {
                    AddNotificationEntity(
                        booking.PassengerId.Value,
                        "Driver Assigned",
                        $"A driver has been assigned to booking #{booking.BookingId}. Waiting for driver acceptance.",
                        "DRIVER"
                    );
                }

                AddActivityLogEntity(
                    GetCurrentUserId(),
                    "BOOKING_ASSIGNED",
                    $"Booking #{booking.BookingId} assigned to driver #{driver.DriverId} and vehicle #{vehicle.VehicleId}."
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        "Driver and vehicle assigned successfully.",
                    booking
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // =========================================================
        // PUT: api/bookings/1/accept
        // =========================================================
        [HttpPut("{id}/accept")]
        [Authorize(Policy = "DriverOnly")]
        public async Task<IActionResult> AcceptBooking(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);

            if (booking == null)
            {
                return NotFound(new
                {
                    message = "Booking not found."
                });
            }

            var currentDriver = await GetCurrentDriverAsync();
            if (currentDriver == null) return NotFound(new { message = "Driver profile not found." });
            if (booking.AssignedDriverId != currentDriver.DriverId)
                return StatusCode(403, new { message = "This booking is not assigned to the logged-in driver." });

            if (booking.BookingStatus != "WAITING_FOR_DRIVER")
            {
                return BadRequest(new
                {
                    message =
                        "Only a WAITING_FOR_DRIVER booking can be accepted."
                });
            }

            if (booking.AssignedDriverId == null ||
                booking.AssignedVehicleId == null)
            {
                return BadRequest(new
                {
                    message =
                        "Driver and vehicle must be assigned before accepting."
                });
            }

            var driver = await _context.Drivers.FindAsync(
                booking.AssignedDriverId.Value);

            var vehicle = await _context.Vehicles.FindAsync(
                booking.AssignedVehicleId.Value);

            if (driver == null || vehicle == null)
            {
                return BadRequest(new
                {
                    message =
                        "Assigned driver or vehicle could not be found."
                });
            }

            if (driver.VerificationStatus != "APPROVED")
            {
                return BadRequest(new
                {
                    message =
                        "Assigned driver is not approved."
                });
            }

            if (driver.OperationalStatus != "AVAILABLE")
            {
                return BadRequest(new
                {
                    message =
                        "Driver is no longer available."
                });
            }

            if (vehicle.OperationalStatus != "AVAILABLE" ||
                vehicle.AccountStatus != "ACTIVE")
            {
                return BadRequest(new
                {
                    message =
                        "Assigned vehicle is no longer available."
                });
            }

            var oldStatus = booking.BookingStatus;

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                booking.BookingStatus = "ACCEPTED";
                booking.UpdatedAt = DateTime.Now;

                AddBookingHistoryEntity(
                    booking.BookingId,
                    oldStatus,
                    "ACCEPTED",
                    driver.UserId,
                    "Driver accepted booking"
                );

                if (booking.PassengerId != null)
                {
                    AddNotificationEntity(
                        booking.PassengerId.Value,
                        "Booking Accepted",
                        $"Your booking #{booking.BookingId} has been accepted by the driver.",
                        "BOOKING"
                    );
                }

                AddActivityLogEntity(
                    driver.UserId,
                    "BOOKING_ACCEPTED",
                    $"Driver #{driver.DriverId} accepted booking #{booking.BookingId}."
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Booking accepted successfully.",
                    booking
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // =========================================================
        // PUT: api/bookings/1/reject
        // =========================================================
        [HttpPut("{id}/reject")]
        [Authorize(Policy = "DriverOnly")]
        public async Task<IActionResult> RejectBooking(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);

            if (booking == null)
            {
                return NotFound(new
                {
                    message = "Booking not found."
                });
            }

            var currentDriver = await GetCurrentDriverAsync();
            if (currentDriver == null) return NotFound(new { message = "Driver profile not found." });
            if (booking.AssignedDriverId != currentDriver.DriverId)
                return StatusCode(403, new { message = "This booking is not assigned to the logged-in driver." });

            if (booking.BookingStatus != "WAITING_FOR_DRIVER")
            {
                return BadRequest(new
                {
                    message =
                        "Only a WAITING_FOR_DRIVER booking can be rejected by a driver."
                });
            }

            var rejectingDriverUserId =
                await GetAssignedDriverUserId(booking);

            var oldStatus = booking.BookingStatus;
            var previousDriverId = booking.AssignedDriverId;
            var previousVehicleId = booking.AssignedVehicleId;

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                booking.BookingStatus = "REJECTED";
                booking.AssignedDriverId = null;
                booking.AssignedVehicleId = null;
                booking.UpdatedAt = DateTime.Now;

                AddBookingHistoryEntity(
                    booking.BookingId,
                    oldStatus,
                    "REJECTED",
                    rejectingDriverUserId,
                    "Driver rejected booking"
                );

                if (booking.PassengerId != null)
                {
                    AddNotificationEntity(
                        booking.PassengerId.Value,
                        "Driver Assignment Update",
                        $"The assigned driver could not accept booking #{booking.BookingId}. MMC Taxi Operations will reassign your booking.",
                        "BOOKING"
                    );
                }

                AddActivityLogEntity(
                    rejectingDriverUserId,
                    "BOOKING_REJECTED",
                    $"Booking #{booking.BookingId} was rejected. Previous driver #{previousDriverId}, vehicle #{previousVehicleId}."
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        "Booking rejected. It can now be reassigned by Taxi Operations.",
                    booking
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // =========================================================
        // PUT: api/bookings/1/arriving
        // =========================================================
        [HttpPut("{id}/arriving")]
        [Authorize(Policy = "DriverOnly")]
        public async Task<IActionResult> DriverArriving(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);

            if (booking == null)
            {
                return NotFound(new
                {
                    message = "Booking not found."
                });
            }

            var currentDriver = await GetCurrentDriverAsync();
            if (currentDriver == null) return NotFound(new { message = "Driver profile not found." });
            if (booking.AssignedDriverId != currentDriver.DriverId)
                return StatusCode(403, new { message = "This booking is not assigned to the logged-in driver." });

            if (booking.BookingStatus != "ACCEPTED")
            {
                return BadRequest(new
                {
                    message =
                        "Booking must be ACCEPTED first."
                });
            }

            var driverUserId =
                await GetAssignedDriverUserId(booking);

            var oldStatus = booking.BookingStatus;

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                booking.BookingStatus = "DRIVER_ARRIVING";
                booking.UpdatedAt = DateTime.Now;

                AddBookingHistoryEntity(
                    booking.BookingId,
                    oldStatus,
                    "DRIVER_ARRIVING",
                    driverUserId,
                    "Driver is arriving at pickup location"
                );

                if (booking.PassengerId != null)
                {
                    AddNotificationEntity(
                        booking.PassengerId.Value,
                        "Driver Arriving",
                        $"The driver for booking #{booking.BookingId} is arriving at your pickup location.",
                        "DRIVER"
                    );
                }

                AddActivityLogEntity(
                    driverUserId,
                    "DRIVER_ARRIVING",
                    $"Driver is arriving for booking #{booking.BookingId}."
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Driver is arriving.",
                    booking
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // =========================================================
        // PUT: api/bookings/1/start
        // =========================================================
        [HttpPut("{id}/start")]
        [Authorize(Policy = "DriverOnly")]
        public async Task<IActionResult> StartRide(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);

            if (booking == null)
            {
                return NotFound(new
                {
                    message = "Booking not found."
                });
            }

            var currentDriver = await GetCurrentDriverAsync();
            if (currentDriver == null) return NotFound(new { message = "Driver profile not found." });
            if (booking.AssignedDriverId != currentDriver.DriverId)
                return StatusCode(403, new { message = "This booking is not assigned to the logged-in driver." });

            if (booking.AssignedDriverId == null ||
                booking.AssignedVehicleId == null)
            {
                return BadRequest(new
                {
                    message =
                        "Driver and vehicle are required."
                });
            }

            if (booking.BookingStatus != "DRIVER_ARRIVING")
            {
                return BadRequest(new
                {
                    message =
                        "Driver must mark the booking as DRIVER_ARRIVING before starting the ride."
                });
            }

            var driver = await _context.Drivers.FindAsync(
                booking.AssignedDriverId.Value);

            var vehicle = await _context.Vehicles.FindAsync(
                booking.AssignedVehicleId.Value);

            if (driver == null || vehicle == null)
            {
                return BadRequest(new
                {
                    message =
                        "Assigned driver or vehicle could not be found."
                });
            }

            var oldStatus = booking.BookingStatus;

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                booking.BookingStatus = "ON_RIDE";
                booking.UpdatedAt = DateTime.Now;

                driver.OperationalStatus = "ON_RIDE";
                vehicle.OperationalStatus = "ON_RIDE";

                AddBookingHistoryEntity(
                    booking.BookingId,
                    oldStatus,
                    "ON_RIDE",
                    driver.UserId,
                    "Ride started"
                );

                if (booking.PassengerId != null)
                {
                    AddNotificationEntity(
                        booking.PassengerId.Value,
                        "Ride Started",
                        $"Your ride for booking #{booking.BookingId} has started.",
                        "BOOKING"
                    );
                }

                AddActivityLogEntity(
                    driver.UserId,
                    "RIDE_STARTED",
                    $"Ride started for booking #{booking.BookingId}."
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Ride started successfully.",
                    booking
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // =========================================================
        // PUT: api/bookings/1/complete
        // =========================================================
        [HttpPut("{id}/complete")]
        [Authorize(Policy = "DriverOnly")]
        public async Task<IActionResult> CompleteRide(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);

            if (booking == null)
            {
                return NotFound(new
                {
                    message = "Booking not found."
                });
            }

            var currentDriver = await GetCurrentDriverAsync();
            if (currentDriver == null) return NotFound(new { message = "Driver profile not found." });
            if (booking.AssignedDriverId != currentDriver.DriverId)
                return StatusCode(403, new { message = "This booking is not assigned to the logged-in driver." });

            if (booking.BookingStatus != "ON_RIDE")
            {
                return BadRequest(new
                {
                    message =
                        "Only an ON_RIDE booking can be completed."
                });
            }

            Driver? driver = null;
            Vehicle? vehicle = null;

            if (booking.AssignedDriverId != null)
            {
                driver = await _context.Drivers.FindAsync(
                    booking.AssignedDriverId.Value);
            }

            if (booking.AssignedVehicleId != null)
            {
                vehicle = await _context.Vehicles.FindAsync(
                    booking.AssignedVehicleId.Value);
            }

            var oldStatus = booking.BookingStatus;

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                booking.BookingStatus = "COMPLETED";
                booking.UpdatedAt = DateTime.Now;

                if (driver != null)
                {
                    driver.OperationalStatus = "AVAILABLE";
                }

                if (vehicle != null)
                {
                    vehicle.OperationalStatus = "AVAILABLE";
                }

                AddBookingHistoryEntity(
                    booking.BookingId,
                    oldStatus,
                    "COMPLETED",
                    driver?.UserId,
                    "Ride completed successfully"
                );

                if (booking.PassengerId != null)
                {
                    AddNotificationEntity(
                        booking.PassengerId.Value,
                        "Ride Completed",
                        $"Your booking #{booking.BookingId} has been completed successfully. You can now rate your driver.",
                        "BOOKING"
                    );
                }

                AddActivityLogEntity(
                    driver?.UserId,
                    "BOOKING_COMPLETED",
                    $"Booking #{booking.BookingId} was completed successfully."
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Ride completed successfully.",
                    booking
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // =========================================================
        // PUT: api/bookings/{id}/cancel
        // Passenger can cancel own booking before ride starts.
        // Operations can cancel pre-ride bookings.
        // =========================================================
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelBooking(int id)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized(new { message = "Unable to identify logged-in user." });
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound(new { message = "Booking not found." });

            var ownPassenger = User.IsInRole("PASSENGER") && booking.PassengerId == userId.Value;
            if (!ownPassenger && !IsOperationsUser())
                return StatusCode(403, new { message = "You do not have permission to cancel this booking." });

            var cancellable = new[] { "PENDING", "WAITING_FOR_DRIVER", "ACCEPTED" };
            if (!cancellable.Contains(booking.BookingStatus))
                return BadRequest(new { message = "This booking can no longer be cancelled." });

            var oldStatus = booking.BookingStatus;
            var driverId = booking.AssignedDriverId;
            booking.BookingStatus = "CANCELLED";
            booking.AssignedDriverId = null;
            booking.AssignedVehicleId = null;
            booking.UpdatedAt = DateTime.Now;

            AddBookingHistoryEntity(booking.BookingId, oldStatus, "CANCELLED", userId.Value, "Booking cancelled");
            AddActivityLogEntity(userId.Value, "BOOKING_CANCELLED", $"Booking #{booking.BookingId} was cancelled.");

            if (driverId != null)
            {
                var driverUserId = await _context.Drivers.Where(d => d.DriverId == driverId.Value).Select(d => (int?)d.UserId).FirstOrDefaultAsync();
                if (driverUserId != null) AddNotificationEntity(driverUserId.Value, "Booking Cancelled", $"Booking #{booking.BookingId} has been cancelled.", "BOOKING");
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Booking cancelled successfully.", bookingId = booking.BookingId, bookingStatus = booking.BookingStatus });
        }

        // =========================================================
        // Helpers
        // =========================================================

        private void AddBookingHistoryEntity(
            int bookingId,
            string? oldStatus,
            string newStatus,
            int? changedByUserId,
            string? remarks)
        {
            _context.BookingStatusHistories.Add(
                new BookingStatusHistory
                {
                    BookingId = bookingId,
                    OldStatus = oldStatus,
                    NewStatus = newStatus,
                    ChangedByUserId = changedByUserId,
                    Remarks = remarks,
                    ChangedAt = DateTime.Now
                }
            );
        }

        private void AddNotificationEntity(
            int userId,
            string title,
            string message,
            string notificationType)
        {
            _context.Notifications.Add(
                new Notification
                {
                    UserId = userId,
                    Title = title,
                    Message = message,
                    NotificationType = notificationType,
                    IsRead = false,
                    CreatedAt = DateTime.Now
                }
            );
        }

        private void AddActivityLogEntity(
            int? userId,
            string activityType,
            string description)
        {
            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = userId,
                    ActivityType = activityType,
                    Description = description,
                    CreatedAt = DateTime.Now
                }
            );
        }

        private async Task<int?> GetAssignedDriverUserId(
            Booking booking)
        {
            if (booking.AssignedDriverId == null)
            {
                return null;
            }

            return await _context.Drivers
                .Where(d =>
                    d.DriverId ==
                    booking.AssignedDriverId.Value)
                .Select(d => (int?)d.UserId)
                .FirstOrDefaultAsync();
        }
    }

    public class AssignBookingRequest
    {
        public int DriverId { get; set; }

        public int VehicleId { get; set; }

    }
}