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
            var userId = GetCurrentUserId();
            if (userId == null) return null;
            return await _context.Drivers.FirstOrDefaultAsync(d => d.UserId == userId.Value);
        }

        private async Task<bool> CanViewBookingAsync(Booking booking)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return false;
            if (IsOperationsUser() &&
                await HasPermissionAsync("VIEW_BOOKINGS"))
            {
                return true;
            }

            if (User.IsInRole("PASSENGER") &&
                booking.PassengerId == userId.Value &&
                await HasPermissionAsync("VIEW_BOOKINGS"))
            {
                return true;
            }
            if (User.IsInRole("DRIVER") && booking.AssignedDriverId != null)
            {
                var driver = await GetCurrentDriverAsync();

                return driver != null &&
                       booking.AssignedDriverId == driver.DriverId &&
                       await HasPermissionAsync("VIEW_TRIP_REQUESTS");
            }
            return false;
        }

        // =========================================================
        // GET: api/bookings
        // =========================================================
        [HttpGet]
        [HasPermission("VIEW_BOOKINGS")]
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
            if (userId == null)
                return Unauthorized(new { message = "Unable to identify logged-in user." });

            if (User.IsInRole("PASSENGER"))
            {
                var items = await (
                    from b in _context.Bookings
                    where b.PassengerId == userId.Value
                    join d0 in _context.Drivers on b.AssignedDriverId equals (int?)d0.DriverId into driverJoin
                    from d in driverJoin.DefaultIfEmpty()
                    join u0 in _context.Users on d.UserId equals u0.UserId into userJoin
                    from du in userJoin.DefaultIfEmpty()
                    join v0 in _context.Vehicles on b.AssignedVehicleId equals (int?)v0.VehicleId into vehicleJoin
                    from v in vehicleJoin.DefaultIfEmpty()
                    orderby b.CreatedAt descending
                    select new
                    {
                        b.BookingId, b.PassengerId, b.PassengerName, b.PassengerPhone, b.BookingSource,
                        b.TripDirection, b.OperationalAreaId, b.PickupLocation, b.PickupLatitude,
                        b.PickupLongitude, b.Destination, b.DestinationLatitude, b.DestinationLongitude,
                        b.BookingDate, b.BookingTime, b.VehicleTypeId, b.AssignedDriverId,
                        b.AssignedVehicleId, b.BookingStatus, b.DistanceKm, b.NormalFare,
                        b.RouteDiscountAmount, b.EstimatedFare, b.DriverArrivedAt, b.TripStartedAt,
                        b.WaitingMinutes, b.WaitingChargePerMinute, b.WaitingCharge, b.FinalFare,
                        b.DriverPercentage, b.MmcPercentage, b.DriverShare, b.MmcShare,
                        b.CreatedByUserId, b.CreatedAt, b.UpdatedAt,
                        DriverName = du != null ? du.FullName : null,
                        DriverPhone = du != null ? du.Phone : null,
                        DriverOperationalStatus = d != null ? d.OperationalStatus : null,
                        VehicleRegistrationNumber = v != null ? v.RegistrationNumber : null,
                        VehicleMake = v != null ? v.Make : null,
                        VehicleModel = v != null ? v.Model : null,
                        VehicleColor = v != null ? v.Color : null
                    }
                ).ToListAsync();

                return Ok(items);
            }

            if (User.IsInRole("DRIVER"))
            {
                if (!await HasPermissionAsync("VIEW_TRIP_REQUESTS"))
                    return StatusCode(403, new { message = "You do not have VIEW_TRIP_REQUESTS permission." });

                var driver = await GetCurrentDriverAsync();
                if (driver == null)
                    return NotFound(new { message = "Driver profile not found." });

                var items = await _context.Bookings
                    .Where(b => b.AssignedDriverId == driver.DriverId)
                    .OrderByDescending(b => b.CreatedAt)
                    .ToListAsync();

                return Ok(items);
            }

            if (await HasPermissionAsync("VIEW_BOOKINGS"))
                return Ok(await _context.Bookings.OrderByDescending(b => b.CreatedAt).ToListAsync());

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
        //
        // PASSENGER:
        //   Frontend sends only journey details.
        //   Passenger identity/name/phone/source are taken securely
        //   from the logged-in JWT user.
        //
        // OPERATIONS / ADMIN:
        //   Can also create PHONE / ON_SITE bookings and provide
        //   passenger details explicitly.
        // =========================================================
        [HttpPost]
        public async Task<ActionResult<Booking>> CreateBooking(
            [FromBody] CreateBookingRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            if (!await HasPermissionAsync("CREATE_BOOKING"))
            {
                return StatusCode(403, new
                {
                    message = "You do not have CREATE_BOOKING permission."
                });
            }

            if (string.IsNullOrWhiteSpace(request.PickupLocation) ||
                string.IsNullOrWhiteSpace(request.Destination))
            {
                return BadRequest(new
                {
                    message = "Pickup location and destination are required."
                });
            }

            if (request.VehicleTypeId <= 0)
            {
                return BadRequest(new
                {
                    message = "A valid vehicle type is required."
                });
            }

            var vehicleTypeExists = await _context.VehicleTypes
                .AnyAsync(v =>
                    v.VehicleTypeId == request.VehicleTypeId &&
                    v.Status == "ACTIVE");

            if (!vehicleTypeExists)
            {
                return BadRequest(new
                {
                    message =
                        "Selected vehicle type does not exist or is inactive."
                });
            }

            // =========================================================
            // FARE SNAPSHOT
            // Recalculate on the backend. Do not trust a fare amount sent
            // by the browser.
            // =========================================================
            if (request.DistanceKm == null || request.DistanceKm < 0)
            {
                return BadRequest(new
                {
                    message = "A valid road distance is required to create the booking."
                });
            }

            var fareSetting = await _context.FareSettings
                .Include(x => x.FareSlabs)
                .FirstOrDefaultAsync(x =>
                    x.VehicleTypeId == request.VehicleTypeId &&
                    x.Status == "ACTIVE");

            if (fareSetting == null)
            {
                return BadRequest(new
                {
                    message = "No active fare setting was found for the selected vehicle type."
                });
            }

            var distanceKm = request.DistanceKm.Value;
            var normalFare = CalculateBookingDistanceFare(
                distanceKm,
                fareSetting.BaseDistanceKm,
                fareSetting.BaseFare,
                fareSetting.FareSlabs
                    .Where(x => x.IsActive)
                    .OrderBy(x => x.SortOrder)
                    .ToList()
            );

            decimal routeDiscountAmount = 0m;

            // Current booking model stores one operational area. For
            // OTHER_TO_MMC, that is the external pickup area. A route
            // discount needs two configured operational-area IDs, so it
            // is applied here only when both IDs are supplied.
            if (request.PickupOperationalAreaId.HasValue &&
                request.DestinationOperationalAreaId.HasValue &&
                request.PickupOperationalAreaId.Value !=
                request.DestinationOperationalAreaId.Value)
            {
                var fromId = request.PickupOperationalAreaId.Value;
                var toId = request.DestinationOperationalAreaId.Value;

                var routeDiscount = await _context.SpecialRouteDiscounts
                    .Where(x => x.Status == "ACTIVE")
                    .FirstOrDefaultAsync(x =>
                        (x.FromOperationalAreaId == fromId &&
                         x.ToOperationalAreaId == toId) ||
                        (x.BothDirections &&
                         x.FromOperationalAreaId == toId &&
                         x.ToOperationalAreaId == fromId));

                if (routeDiscount != null)
                {
                    routeDiscountAmount = CalculateBookingDiscount(
                        normalFare,
                        routeDiscount.DiscountType,
                        routeDiscount.DiscountValue
                    );
                }
            }

            var estimatedFare =
                Math.Max(0m, normalFare - routeDiscountAmount);

            var booking = new Booking
            {
                BookingId = 0,

                TripDirection = string.IsNullOrWhiteSpace(request.TripDirection)
                    ? null
                    : request.TripDirection.Trim().ToUpperInvariant(),

                OperationalAreaId = request.OperationalAreaId,

                PickupLocation = request.PickupLocation.Trim(),
                PickupLatitude = request.PickupLatitude,
                PickupLongitude = request.PickupLongitude,

                Destination = request.Destination.Trim(),
                DestinationLatitude = request.DestinationLatitude,
                DestinationLongitude = request.DestinationLongitude,

                BookingDate = request.BookingDate,
                BookingTime = request.BookingTime,

                VehicleTypeId = request.VehicleTypeId,

                AssignedDriverId = null,
                AssignedVehicleId = null,

                BookingStatus = "PENDING",

                // Fare values are stored as a snapshot so later Super Admin
                // rate changes do not alter old bookings.
                DistanceKm = RoundBookingMoney(distanceKm),
                NormalFare = RoundBookingMoney(normalFare),
                RouteDiscountAmount = RoundBookingMoney(routeDiscountAmount),
                EstimatedFare = RoundBookingMoney(estimatedFare),

                WaitingMinutes = 0,
                WaitingChargePerMinute = fareSetting.WaitingChargePerMinute,
                WaitingCharge = 0.00m,

                // At booking time there is no waiting charge yet, therefore
                // the current final fare starts as the estimated fare.
                FinalFare = RoundBookingMoney(estimatedFare),

                DriverPercentage = fareSetting.DriverPercentage,
                MmcPercentage = fareSetting.MmcPercentage,
                DriverShare = RoundBookingMoney(
                    estimatedFare * (fareSetting.DriverPercentage / 100m)),
                MmcShare = RoundBookingMoney(
                    estimatedFare * (fareSetting.MmcPercentage / 100m)),

                CreatedByUserId = currentUserId.Value,

                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            // ---------------------------------------------------------
            // Passenger website booking:
            // derive passenger identity from JWT / database.
            // ---------------------------------------------------------
            if (User.IsInRole("PASSENGER") && !IsOperationsUser())
            {
                var passenger = await _context.Users
                    .FirstOrDefaultAsync(u =>
                        u.UserId == currentUserId.Value &&
                        u.AccountStatus == "ACTIVE");

                if (passenger == null)
                {
                    return BadRequest(new
                    {
                        message = "Passenger account is not active."
                    });
                }

                if (string.IsNullOrWhiteSpace(passenger.FullName) ||
                    string.IsNullOrWhiteSpace(passenger.Phone))
                {
                    return BadRequest(new
                    {
                        message =
                            "Your passenger profile must contain a name and phone number before booking."
                    });
                }

                booking.PassengerId = passenger.UserId;
                booking.PassengerName = passenger.FullName.Trim();
                booking.PassengerPhone = passenger.Phone.Trim();
                booking.BookingSource = "WEBSITE";
            }
            // ---------------------------------------------------------
            // Taxi Operator / Admin / Super Admin booking:
            // PHONE or ON_SITE passenger details can be supplied.
            // ---------------------------------------------------------
            else if (await HasPermissionAsync("MANAGE_BOOKINGS"))
            {
                var source = string.IsNullOrWhiteSpace(request.BookingSource)
                    ? "PHONE"
                    : request.BookingSource.Trim().ToUpperInvariant();

                var validSources = new[]
                {
                    "WEBSITE",
                    "PHONE",
                    "ON_SITE"
                };

                if (!validSources.Contains(source))
                {
                    return BadRequest(new
                    {
                        message = "Invalid booking source."
                    });
                }

                if (request.PassengerId != null)
                {
                    var passenger = await _context.Users
                        .FirstOrDefaultAsync(u =>
                            u.UserId == request.PassengerId.Value &&
                            u.AccountStatus == "ACTIVE");

                    if (passenger == null)
                    {
                        return BadRequest(new
                        {
                            message =
                                "Passenger account does not exist or is inactive."
                        });
                    }

                    booking.PassengerId = passenger.UserId;
                    booking.PassengerName =
                        string.IsNullOrWhiteSpace(request.PassengerName)
                            ? passenger.FullName
                            : request.PassengerName.Trim();

                    booking.PassengerPhone =
                        string.IsNullOrWhiteSpace(request.PassengerPhone)
                            ? passenger.Phone ?? string.Empty
                            : request.PassengerPhone.Trim();
                }
                else
                {
                    booking.PassengerId = null;
                    booking.PassengerName =
                        request.PassengerName?.Trim() ?? string.Empty;
                    booking.PassengerPhone =
                        request.PassengerPhone?.Trim() ?? string.Empty;
                }

                if (string.IsNullOrWhiteSpace(booking.PassengerName) ||
                    string.IsNullOrWhiteSpace(booking.PassengerPhone))
                {
                    return BadRequest(new
                    {
                        message =
                            "Passenger name and phone are required for phone/on-site bookings."
                    });
                }

                booking.BookingSource = source;
            }
            else
            {
                return StatusCode(403, new
                {
                    message =
                        "You do not have permission to create bookings."
                });
            }

            // If the frontend did not send date/time, use current values.
            if (booking.BookingDate == null)
            {
                booking.BookingDate = DateTime.Today;
            }

            if (booking.BookingTime == null)
            {
                booking.BookingTime = DateTime.Now.TimeOfDay;
            }

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

                // Booking stays PENDING until Taxi Operations dispatches it to drivers.

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
        // PUT: api/bookings/1/send-to-drivers
        // Taxi Operations dispatches a PENDING booking to matching drivers
        // =========================================================
        [HttpPut("{id}/send-to-drivers")]
        public async Task<IActionResult> SendToDrivers(int id)
        {
            if (!IsOperationsUser())
            {
                return StatusCode(403, new
                {
                    message = "Only Taxi Operations, Admin or Super Admin can send bookings to drivers."
                });
            }

            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized(new { message = "Unable to identify logged-in user." });

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var booking = await _context.Bookings
                    .FirstOrDefaultAsync(b => b.BookingId == id);

                if (booking == null)
                {
                    await transaction.RollbackAsync();
                    return NotFound(new { message = "Booking not found." });
                }

                if (booking.BookingStatus != "PENDING")
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new
                    {
                        message = $"Only PENDING bookings can be sent to drivers. Current status: {booking.BookingStatus}."
                    });
                }

                if (booking.AssignedDriverId != null || booking.AssignedVehicleId != null)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { message = "This booking already has an assigned driver or vehicle." });
                }

                var requestCount = await CreateDriverRequestsForBookingAsync(booking, currentUserId.Value);

                if (requestCount == 0)
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return BadRequest(new
                    {
                        message = "No matching APPROVED and AVAILABLE drivers were found. Booking remains PENDING.",
                        bookingId = booking.BookingId,
                        bookingStatus = booking.BookingStatus
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = $"Booking #{booking.BookingId} sent to {requestCount} available driver(s).",
                    bookingId = booking.BookingId,
                    bookingStatus = booking.BookingStatus,
                    requestCount
                });
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
        [HasPermission("ASSIGN_DRIVER")]
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
                        b.BookingStatus == "DRIVER_ARRIVED" ||
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
                        b.BookingStatus == "DRIVER_ARRIVED" ||
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
        // GET: api/bookings/driver/requests
        // Pending broadcast requests for the logged-in driver
        // =========================================================
        [HttpGet("driver/requests")]
        [HasPermission("VIEW_TRIP_REQUESTS")]
        public async Task<IActionResult> GetDriverRequests()
        {
            var driver = await GetCurrentDriverAsync();
            if (driver == null)
                return NotFound(new { message = "Driver profile not found." });

            var requests = await (
                from request in _context.BookingDriverRequests
                join booking in _context.Bookings on request.BookingId equals booking.BookingId
                join vehicle in _context.Vehicles on request.VehicleId equals vehicle.VehicleId
                where request.DriverId == driver.DriverId
                      && request.RequestStatus == "PENDING"
                      && booking.BookingStatus == "WAITING_FOR_DRIVER"
                      && booking.AssignedDriverId == null
                orderby request.SentAt descending
                select new
                {
                    requestId = request.RequestId,
                    bookingId = booking.BookingId,
                    passengerName = booking.PassengerName,
                    passengerPhone = booking.PassengerPhone,
                    pickupLocation = booking.PickupLocation,
                    pickupLatitude = booking.PickupLatitude,
                    pickupLongitude = booking.PickupLongitude,
                    destination = booking.Destination,
                    destinationLatitude = booking.DestinationLatitude,
                    destinationLongitude = booking.DestinationLongitude,
                    distanceKm = booking.DistanceKm,
                    estimatedFare = booking.EstimatedFare,
                    bookingSource = booking.BookingSource,
                    bookingDate = booking.BookingDate,
                    bookingTime = booking.BookingTime,
                    vehicleId = vehicle.VehicleId,
                    vehicleTypeId = vehicle.VehicleTypeId,
                    requestStatus = request.RequestStatus,
                    sentAt = request.SentAt
                }
            ).ToListAsync();

            return Ok(requests);
        }

        // =========================================================
        // PUT: api/bookings/1/accept
        // =========================================================
        [HttpPut("{id}/accept")]
        [HasPermission("ACCEPT_TRIP")]
        public async Task<IActionResult> AcceptBooking(int id)
        {
            var currentDriver = await GetCurrentDriverAsync();
            if (currentDriver == null)
                return NotFound(new { message = "Driver profile not found." });

            await using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

            try
            {
                var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingId == id);
                if (booking == null)
                {
                    await transaction.RollbackAsync();
                    return NotFound(new { message = "Booking not found." });
                }

                if (booking.BookingStatus != "WAITING_FOR_DRIVER" || booking.AssignedDriverId != null)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { message = "This booking has already been accepted or is no longer available." });
                }

                var request = await _context.BookingDriverRequests.FirstOrDefaultAsync(r =>
                    r.BookingId == id &&
                    r.DriverId == currentDriver.DriverId &&
                    r.RequestStatus == "PENDING");

                if (request == null)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(403, new { message = "You do not have an active request for this booking." });
                }

                if (currentDriver.VerificationStatus != "APPROVED" || currentDriver.OperationalStatus != "AVAILABLE")
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { message = "Your driver account is not currently available to accept trips." });
                }

                var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v =>
                    v.VehicleId == request.VehicleId && v.DriverId == currentDriver.DriverId);

                if (vehicle == null || vehicle.AccountStatus != "ACTIVE" ||
                    vehicle.OperationalStatus != "AVAILABLE" || vehicle.VehicleTypeId != booking.VehicleTypeId)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { message = "Your requested vehicle is no longer available for this booking." });
                }

                var driverBusy = await _context.Bookings.AnyAsync(b =>
                    b.BookingId != booking.BookingId &&
                    b.AssignedDriverId == currentDriver.DriverId &&
                    (b.BookingStatus == "ACCEPTED" || b.BookingStatus == "DRIVER_ARRIVING" ||
                     b.BookingStatus == "DRIVER_ARRIVED" || b.BookingStatus == "ON_RIDE"));

                if (driverBusy)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { message = "You already have an active trip." });
                }

                var now = DateTime.Now;
                var oldStatus = booking.BookingStatus;

                booking.AssignedDriverId = currentDriver.DriverId;
                booking.AssignedVehicleId = vehicle.VehicleId;
                booking.BookingStatus = "ACCEPTED";
                booking.UpdatedAt = now;

                request.RequestStatus = "ACCEPTED";
                request.RespondedAt = now;

                var otherRequests = await _context.BookingDriverRequests
                    .Where(r => r.BookingId == booking.BookingId &&
                                r.RequestId != request.RequestId &&
                                r.RequestStatus == "PENDING")
                    .ToListAsync();

                foreach (var other in otherRequests)
                {
                    other.RequestStatus = "EXPIRED";
                    other.RespondedAt = now;
                }

                AddBookingHistoryEntity(
                    booking.BookingId, oldStatus, "ACCEPTED", currentDriver.UserId,
                    $"Driver #{currentDriver.DriverId} accepted the booking."
                );

                if (booking.PassengerId != null)
                {
                    var driverName = await _context.Users
                        .Where(u => u.UserId == currentDriver.UserId)
                        .Select(u => u.FullName)
                        .FirstOrDefaultAsync() ?? "Your driver";

                    AddNotificationEntity(
                        booking.PassengerId.Value,
                        "Driver Found",
                        $"{driverName} accepted booking #{booking.BookingId}. Driver and vehicle details are now available.",
                        "DRIVER"
                    );
                }

                AddActivityLogEntity(
                    currentDriver.UserId,
                    "BOOKING_ACCEPTED",
                    $"Driver #{currentDriver.DriverId} accepted booking #{booking.BookingId} using vehicle #{vehicle.VehicleId}."
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Trip accepted successfully.",
                    bookingId = booking.BookingId,
                    bookingStatus = booking.BookingStatus,
                    driverId = currentDriver.DriverId,
                    vehicleId = vehicle.VehicleId
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
        [HasPermission("REJECT_TRIP")]
        public async Task<IActionResult> RejectBooking(int id)
        {
            var currentDriver = await GetCurrentDriverAsync();
            if (currentDriver == null)
                return NotFound(new { message = "Driver profile not found." });

            var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.BookingId == id);
            if (booking == null)
                return NotFound(new { message = "Booking not found." });

            if (booking.BookingStatus != "WAITING_FOR_DRIVER" || booking.AssignedDriverId != null)
                return BadRequest(new { message = "This booking is no longer waiting for drivers." });

            var request = await _context.BookingDriverRequests.FirstOrDefaultAsync(r =>
                r.BookingId == id && r.DriverId == currentDriver.DriverId && r.RequestStatus == "PENDING");

            if (request == null)
                return NotFound(new { message = "Active trip request not found." });

            request.RequestStatus = "REJECTED";
            request.RespondedAt = DateTime.Now;

            AddActivityLogEntity(
                currentDriver.UserId,
                "TRIP_REQUEST_REJECTED",
                $"Driver #{currentDriver.DriverId} rejected request for booking #{id}."
            );

            await _context.SaveChangesAsync();

            return Ok(new { message = "Trip request rejected.", bookingId = id });
        }

        // =========================================================
        // PUT: api/bookings/1/arriving
        // =========================================================
        [HttpPut("{id}/arriving")]
        [HasPermission("UPDATE_TRIP_STATUS")]
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
        // PUT: api/bookings/1/arrived
        // Driver confirms arrival at the passenger pickup location.
        // =========================================================
        [HttpPut("{id}/arrived")]
        [HasPermission("UPDATE_TRIP_STATUS")]
        public async Task<IActionResult> DriverArrived(int id)
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

            if (currentDriver == null)
            {
                return NotFound(new
                {
                    message = "Driver profile not found."
                });
            }

            if (booking.AssignedDriverId != currentDriver.DriverId)
            {
                return StatusCode(403, new
                {
                    message = "This booking is not assigned to the logged-in driver."
                });
            }

            if (booking.BookingStatus != "DRIVER_ARRIVING")
            {
                return BadRequest(new
                {
                    message = "Driver must be in DRIVER_ARRIVING status before marking arrival."
                });
            }

            var driverUserId = await GetAssignedDriverUserId(booking);
            var oldStatus = booking.BookingStatus;

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var arrivedAt = DateTime.Now;

                booking.BookingStatus = "DRIVER_ARRIVED";
                booking.DriverArrivedAt = arrivedAt;
                booking.UpdatedAt = arrivedAt;

                AddBookingHistoryEntity(
                    booking.BookingId,
                    oldStatus,
                    "DRIVER_ARRIVED",
                    driverUserId,
                    "Driver arrived at pickup location"
                );

                if (booking.PassengerId != null)
                {
                    AddNotificationEntity(
                        booking.PassengerId.Value,
                        "Driver Arrived",
                        $"Your driver for booking #{booking.BookingId} has arrived at the pickup location.",
                        "DRIVER"
                    );
                }

                AddActivityLogEntity(
                    driverUserId,
                    "DRIVER_ARRIVED",
                    $"Driver arrived at the pickup location for booking #{booking.BookingId}."
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Driver arrival confirmed successfully.",
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
        [HasPermission("UPDATE_TRIP_STATUS")]
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

            if (booking.BookingStatus != "DRIVER_ARRIVED")
            {
                return BadRequest(new
                {
                    message =
                        "Driver must confirm DRIVER_ARRIVED before starting the ride."
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
                var tripStartedAt = DateTime.Now;

                booking.BookingStatus = "ON_RIDE";
                booking.TripStartedAt = tripStartedAt;

                // Waiting time starts when the driver confirms arrival and
                // stops when the driver starts the trip.
                //
                // MMC grace period:
                // The first 5 completed waiting minutes are FREE.
                // Waiting charge starts only from minute 6 onward.
                var waitingMinutes = 0;

                if (booking.DriverArrivedAt.HasValue)
                {
                    var waitingDuration =
                        tripStartedAt - booking.DriverArrivedAt.Value;

                    if (waitingDuration.TotalMinutes > 0)
                    {
                        // Store the passenger's TOTAL completed waiting time.
                        waitingMinutes = (int)Math.Floor(
                            waitingDuration.TotalMinutes);
                    }
                }

                const int waitingGraceMinutes = 5;

                var chargeableWaitingMinutes =
                    Math.Max(0, waitingMinutes - waitingGraceMinutes);

                var waitingRate =
                    booking.WaitingChargePerMinute ?? 0m;

                var waitingCharge =
                    RoundBookingMoney(
                        chargeableWaitingMinutes * waitingRate);

                var estimatedFare =
                    booking.EstimatedFare ??
                    booking.NormalFare ??
                    0m;

                var currentFinalFare =
                    RoundBookingMoney(estimatedFare + waitingCharge);

                var driverPercentage =
                    booking.DriverPercentage ?? 90m;

                var mmcPercentage =
                    booking.MmcPercentage ?? 10m;

                booking.WaitingMinutes = waitingMinutes;
                booking.WaitingCharge = waitingCharge;
                booking.FinalFare = currentFinalFare;

                booking.DriverShare = RoundBookingMoney(
                    currentFinalFare * (driverPercentage / 100m));

                booking.MmcShare = RoundBookingMoney(
                    currentFinalFare * (mmcPercentage / 100m));

                booking.UpdatedAt = tripStartedAt;

                driver.OperationalStatus = "ON_RIDE";
                vehicle.OperationalStatus = "ON_RIDE";

                AddBookingHistoryEntity(
                    booking.BookingId,
                    oldStatus,
                    "ON_RIDE",
                    driver.UserId,
                    $"Ride started. Total waiting: {waitingMinutes} min; billable waiting after 5 min grace period: {chargeableWaitingMinutes} min."
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
        [HasPermission("UPDATE_TRIP_STATUS")]
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
                var completedAt = DateTime.Now;

                // Final fare = estimated fare after route discount
                //            + waiting charge captured when the trip started.
                var estimatedFare =
                    booking.EstimatedFare ??
                    booking.NormalFare ??
                    0m;

                var waitingCharge =
                    booking.WaitingCharge;

                var finalFare =
                    RoundBookingMoney(estimatedFare + waitingCharge);

                var driverPercentage =
                    booking.DriverPercentage ?? 90m;

                var mmcPercentage =
                    booking.MmcPercentage ?? 10m;

                booking.FinalFare = finalFare;
                booking.DriverShare = RoundBookingMoney(
                    finalFare * (driverPercentage / 100m));
                booking.MmcShare = RoundBookingMoney(
                    finalFare * (mmcPercentage / 100m));

                booking.BookingStatus = "COMPLETED";
                booking.UpdatedAt = completedAt;

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
                    booking,
                    fareSummary = new
                    {
                        distanceKm = booking.DistanceKm,
                        normalFare = booking.NormalFare,
                        routeDiscountAmount = booking.RouteDiscountAmount,
                        estimatedFare = booking.EstimatedFare,
                        waitingMinutes = booking.WaitingMinutes,
                        waitingGraceMinutes = 5,
                        chargeableWaitingMinutes = Math.Max(0, booking.WaitingMinutes - 5),
                        waitingChargePerMinute = booking.WaitingChargePerMinute,
                        waitingCharge = booking.WaitingCharge,
                        finalFare = booking.FinalFare,
                        driverPercentage = booking.DriverPercentage,
                        driverShare = booking.DriverShare,
                        mmcPercentage = booking.MmcPercentage,
                        mmcShare = booking.MmcShare
                    }
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

            var ownPassenger =
                User.IsInRole("PASSENGER") &&
                booking.PassengerId == userId.Value;

            if (!ownPassenger &&
                !await HasPermissionAsync("MANAGE_BOOKINGS"))
            {
                return StatusCode(403, new
                {
                    message =
                        "You do not have MANAGE_BOOKINGS permission."
                });
            }

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
        // FARE HELPERS
        // Keep the booking snapshot calculation consistent with FareController.
        // =========================================================

        private static decimal CalculateBookingDistanceFare(
            decimal distanceKm,
            decimal baseDistanceKm,
            decimal baseFare,
            List<FareSlab> slabs)
        {
            if (distanceKm <= baseDistanceKm)
                return baseFare;

            decimal fare = baseFare;

            foreach (var slab in slabs)
            {
                if (distanceKm <= slab.FromKm)
                    continue;

                var upper = slab.ToKm.HasValue
                    ? Math.Min(distanceKm, slab.ToKm.Value)
                    : distanceKm;

                var chargeableKm = upper - slab.FromKm;

                if (chargeableKm > 0)
                    fare += chargeableKm * slab.RatePerKm;
            }

            return fare;
        }

        private static decimal CalculateBookingDiscount(
            decimal amount,
            string discountType,
            decimal discountValue)
        {
            var type = (discountType ?? string.Empty)
                .Trim()
                .ToUpperInvariant();

            if (type == "FIXED")
                return Math.Min(amount, Math.Max(0m, discountValue));

            if (type == "PERCENTAGE")
            {
                var percentage = Math.Clamp(discountValue, 0m, 100m);
                return amount * (percentage / 100m);
            }

            return 0m;
        }

        private static decimal RoundBookingMoney(decimal value) =>
            Math.Round(value, 2, MidpointRounding.AwayFromZero);

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

        private async Task<int> CreateDriverRequestsForBookingAsync(Booking booking, int dispatchedByUserId)
        {
            var matches = await (
                from driver in _context.Drivers
                join vehicle in _context.Vehicles on driver.DriverId equals vehicle.DriverId
                where driver.VerificationStatus == "APPROVED"
                      && driver.OperationalStatus == "AVAILABLE"
                      && vehicle.AccountStatus == "ACTIVE"
                      && vehicle.OperationalStatus == "AVAILABLE"
                      && vehicle.VehicleTypeId == booking.VehicleTypeId
                select new { Driver = driver, Vehicle = vehicle }
            ).ToListAsync();

            var requestCount = 0;

            foreach (var match in matches)
            {
                var driverBusy = await _context.Bookings.AnyAsync(b =>
                    b.BookingId != booking.BookingId &&
                    b.AssignedDriverId == match.Driver.DriverId &&
                    (b.BookingStatus == "WAITING_FOR_DRIVER" || b.BookingStatus == "ACCEPTED" ||
                     b.BookingStatus == "DRIVER_ARRIVING" || b.BookingStatus == "DRIVER_ARRIVED" ||
                     b.BookingStatus == "ON_RIDE"));

                if (driverBusy) continue;

                var alreadyExists = await _context.BookingDriverRequests.AnyAsync(r =>
                    r.BookingId == booking.BookingId && r.DriverId == match.Driver.DriverId);

                if (alreadyExists) continue;

                _context.BookingDriverRequests.Add(new BookingDriverRequest
                {
                    BookingId = booking.BookingId,
                    DriverId = match.Driver.DriverId,
                    VehicleId = match.Vehicle.VehicleId,
                    RequestStatus = "PENDING",
                    SentAt = DateTime.Now,
                    RespondedAt = null
                });

                AddNotificationEntity(
                    match.Driver.UserId,
                    "New Trip Request",
                    $"New booking #{booking.BookingId}: {booking.PickupLocation} to {booking.Destination}. Open Trip Requests to accept.",
                    "BOOKING"
                );

                requestCount++;
            }

            if (requestCount > 0)
            {
                var oldStatus = booking.BookingStatus;
                booking.BookingStatus = "WAITING_FOR_DRIVER";
                booking.UpdatedAt = DateTime.Now;

                AddBookingHistoryEntity(
                    booking.BookingId, oldStatus, "WAITING_FOR_DRIVER", dispatchedByUserId,
                    $"Taxi Operations sent booking to {requestCount} available driver(s)."
                );

                AddActivityLogEntity(
                    dispatchedByUserId,
                    "DRIVER_REQUESTS_SENT",
                    $"Taxi Operations sent booking #{booking.BookingId} to {requestCount} available driver(s)."
                );
            }
            else
            {
                AddActivityLogEntity(
                    dispatchedByUserId,
                    "NO_AVAILABLE_DRIVERS",
                    $"Taxi Operations tried to dispatch booking #{booking.BookingId}, but no matching available drivers were found."
                );
            }

            return requestCount;
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

    public class CreateBookingRequest
    {
        // =========================================================
        // JOURNEY / LOCATION DETAILS
        // =========================================================

        public string PickupLocation { get; set; } = string.Empty;

        public string Destination { get; set; } = string.Empty;

        // Expected values:
        // MMC_TO_OTHER
        // OTHER_TO_MMC
        public string? TripDirection { get; set; }

        // Mainly used for OTHER_TO_MMC bookings.
        public int? OperationalAreaId { get; set; }

        // Exact pickup location selected from map.
        public decimal? PickupLatitude { get; set; }

        public decimal? PickupLongitude { get; set; }

        // Exact destination selected from map.
        public decimal? DestinationLatitude { get; set; }

        public decimal? DestinationLongitude { get; set; }

        // =========================================================
        // BOOKING DATE / TIME / VEHICLE
        // =========================================================

        public DateTime? BookingDate { get; set; }

        public TimeSpan? BookingTime { get; set; }

        public int VehicleTypeId { get; set; }

        // Road distance calculated by the frontend routing service.
        // The backend uses this distance with its own fare settings.
        public decimal? DistanceKm { get; set; }

        // Optional route endpoints for future/special route discounts.
        public int? PickupOperationalAreaId { get; set; }

        public int? DestinationOperationalAreaId { get; set; }

        // =========================================================
        // OPTIONAL TAXI OPERATOR / ADMIN BOOKING DETAILS
        // =========================================================

        public int? PassengerId { get; set; }

        public string? PassengerName { get; set; }

        public string? PassengerPhone { get; set; }

        public string? BookingSource { get; set; }
    }

    public class AssignBookingRequest
    {
        public int DriverId { get; set; }

        public int VehicleId { get; set; }

    }
}