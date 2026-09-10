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
    public class VehiclesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private static readonly string[] AllowedOperationalStatuses =
        {
            "AVAILABLE",
            "OFFLINE"
        };

        public VehiclesController(ApplicationDbContext context)
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

        private bool IsManagementUser()
        {
            return User.IsInRole("SUPER_ADMIN") ||
                   User.IsInRole("ADMIN") ||
                   User.IsInRole("TAXI_OPERATIONS");
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

        private async Task<Driver?> GetCurrentDriverAsync()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return null;
            }

            return await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.UserId == userId.Value);
        }

        private async Task<bool> HasActiveBookingAsync(
            int vehicleId)
        {
            return await _context.Bookings.AnyAsync(b =>
                b.AssignedVehicleId == vehicleId &&
                (
                    b.BookingStatus == "WAITING_FOR_DRIVER" ||
                    b.BookingStatus == "ACCEPTED" ||
                    b.BookingStatus == "DRIVER_ARRIVING" ||
                    b.BookingStatus == "ON_RIDE"
                ));
        }

        // =========================================================
        // GET: api/vehicles
        //
        // Super Admin / Admin / Taxi Operations
        // =========================================================
        [HttpGet]
        [HasPermission("VIEW_VEHICLES")]
        public async Task<ActionResult> GetVehicles()
        {
            var vehicles = await _context.Vehicles
                .OrderBy(v => v.RegistrationNumber)
                .Select(v => new
                {
                    v.VehicleId,
                    v.DriverId,
                    v.VehicleTypeId,
                    v.RegistrationNumber,
                    v.Make,
                    v.Model,
                    v.Color,
                    v.ManufactureYear,
                    v.GpsAvailable,
                    v.OperationalStatus,
                    v.AccountStatus,
                    v.CreatedAt
                })
                .ToListAsync();

            return Ok(vehicles);
        }

        // =========================================================
        // GET: api/vehicles/available
        //
        // Used when Taxi Operations assigns a booking.
        // =========================================================
        [HttpGet("available")]
        [HasPermission("VIEW_VEHICLES")]
        public async Task<ActionResult> GetAvailableVehicles()
        {
            var vehicles = await _context.Vehicles
                .Where(v =>
                    v.AccountStatus == "ACTIVE" &&
                    v.OperationalStatus == "AVAILABLE")
                .OrderBy(v => v.RegistrationNumber)
                .Select(v => new
                {
                    v.VehicleId,
                    v.DriverId,
                    v.VehicleTypeId,
                    v.RegistrationNumber,
                    v.Make,
                    v.Model,
                    v.Color,
                    v.ManufactureYear,
                    v.GpsAvailable,
                    v.OperationalStatus,
                    v.AccountStatus,
                    v.CreatedAt
                })
                .ToListAsync();

            return Ok(vehicles);
        }

        // =========================================================
        // GET: api/vehicles/5
        //
        // Management -> any vehicle
        // Driver -> own assigned vehicle
        // =========================================================
        [HttpGet("{id:int}")]
        public async Task<ActionResult> GetVehicle(int id)
        {
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v =>
                    v.VehicleId == id);

            if (vehicle == null)
            {
                return NotFound(new
                {
                    message = "Vehicle not found."
                });
            }

            var hasViewPermission =
                await HasPermissionAsync("VIEW_VEHICLES");

            if (!hasViewPermission)
            {
                var currentDriver =
                    await GetCurrentDriverAsync();

                if (currentDriver == null ||
                    vehicle.DriverId != currentDriver.DriverId)
                {
                    return StatusCode(403, new
                    {
                        message =
                            "You do not have VIEW_VEHICLES permission and this is not your assigned vehicle."
                    });
                }
            }

            return Ok(new
            {
                vehicle.VehicleId,
                vehicle.DriverId,
                vehicle.VehicleTypeId,
                vehicle.RegistrationNumber,
                vehicle.Make,
                vehicle.Model,
                vehicle.Color,
                vehicle.ManufactureYear,
                vehicle.GpsAvailable,
                vehicle.OperationalStatus,
                vehicle.AccountStatus,
                vehicle.CreatedAt
            });
        }

        // =========================================================
        // GET: api/vehicles/my
        //
        // Driver gets own assigned vehicle(s)
        // =========================================================
        [HttpGet("my")]
        [Authorize(Policy = "DriverOnly")]
        public async Task<ActionResult> GetMyVehicles()
        {
            var driver = await GetCurrentDriverAsync();

            if (driver == null)
            {
                return NotFound(new
                {
                    message = "Driver profile not found."
                });
            }

            var vehicles = await _context.Vehicles
                .Where(v =>
                    v.DriverId == driver.DriverId)
                .OrderBy(v => v.RegistrationNumber)
                .Select(v => new
                {
                    v.VehicleId,
                    v.DriverId,
                    v.VehicleTypeId,
                    v.RegistrationNumber,
                    v.Make,
                    v.Model,
                    v.Color,
                    v.ManufactureYear,
                    v.GpsAvailable,
                    v.OperationalStatus,
                    v.AccountStatus,
                    v.CreatedAt
                })
                .ToListAsync();

            return Ok(vehicles);
        }

        // =========================================================
        // GET: api/vehicles/driver/5
        //
        // Management only
        // =========================================================
        [HttpGet("driver/{driverId:int}")]
        [HasPermission("VIEW_VEHICLES")]
        public async Task<ActionResult> GetVehiclesByDriver(
            int driverId)
        {
            var driverExists =
                await _context.Drivers.AnyAsync(d =>
                    d.DriverId == driverId);

            if (!driverExists)
            {
                return NotFound(new
                {
                    message = "Driver not found."
                });
            }

            var vehicles = await _context.Vehicles
                .Where(v =>
                    v.DriverId == driverId)
                .OrderBy(v => v.RegistrationNumber)
                .Select(v => new
                {
                    v.VehicleId,
                    v.DriverId,
                    v.VehicleTypeId,
                    v.RegistrationNumber,
                    v.Make,
                    v.Model,
                    v.Color,
                    v.ManufactureYear,
                    v.GpsAvailable,
                    v.OperationalStatus,
                    v.AccountStatus,
                    v.CreatedAt
                })
                .ToListAsync();

            return Ok(vehicles);
        }

        // =========================================================
        // POST: api/vehicles
        //
        // Super Admin / Admin
        // =========================================================
        [HttpPost]
        [HasPermission("MANAGE_VEHICLES")]
        public async Task<ActionResult> CreateVehicle(
            [FromBody] CreateVehicleRequest request)
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

            var registrationNumber =
                request.RegistrationNumber?
                    .Trim()
                    .ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(
                    registrationNumber))
            {
                return BadRequest(new
                {
                    message =
                        "Vehicle registration number is required."
                });
            }

            if (registrationNumber.Length > 50)
            {
                return BadRequest(new
                {
                    message =
                        "Registration number cannot exceed 50 characters."
                });
            }

            if (request.VehicleTypeId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Valid vehicle type is required."
                });
            }

            var duplicateExists =
                await _context.Vehicles.AnyAsync(v =>
                    v.RegistrationNumber ==
                    registrationNumber);

            if (duplicateExists)
            {
                return BadRequest(new
                {
                    message =
                        "A vehicle with this registration number already exists."
                });
            }


            if (request.ManufactureYear != null)
            {
                var currentYear = DateTime.Now.Year;

                if (request.ManufactureYear < 1900 ||
                    request.ManufactureYear > currentYear + 1)
                {
                    return BadRequest(new
                    {
                        message =
                            $"Manufacture year must be between 1900 and {currentYear + 1}."
                    });
                }
            }

            if ((request.Make?.Trim().Length ?? 0) > 100 ||
                (request.Model?.Trim().Length ?? 0) > 100 ||
                (request.Color?.Trim().Length ?? 0) > 50)
            {
                return BadRequest(new
                {
                    message =
                        "Make/Model cannot exceed 100 characters and Color cannot exceed 50 characters."
                });
            }

            var vehicleType =
                await _context.VehicleTypes
                    .FirstOrDefaultAsync(v =>
                        v.VehicleTypeId ==
                            request.VehicleTypeId);

            if (vehicleType == null)
            {
                return BadRequest(new
                {
                    message =
                        "Vehicle type not found."
                });
            }

            if (vehicleType.Status != "ACTIVE")
            {
                return BadRequest(new
                {
                    message =
                        "Cannot create a vehicle using an inactive vehicle type."
                });
            }

            Driver? driver = null;

            if (request.DriverId != null)
            {
                driver = await _context.Drivers
                    .FirstOrDefaultAsync(d =>
                        d.DriverId ==
                            request.DriverId.Value);

                if (driver == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Driver not found."
                    });
                }

                if (driver.VerificationStatus !=
                    "APPROVED")
                {
                    return BadRequest(new
                    {
                        message =
                            "Only an approved driver can be assigned to a vehicle."
                    });
                }

                var driverUser =
                    await _context.Users
                        .FirstOrDefaultAsync(u =>
                            u.UserId ==
                            driver.UserId);

                if (driverUser == null ||
                    driverUser.AccountStatus != "ACTIVE")
                {
                    return BadRequest(new
                    {
                        message =
                            "Driver account is not active."
                    });
                }
            }

            var vehicle = new Vehicle
            {
                DriverId = request.DriverId,
                VehicleTypeId =
                    request.VehicleTypeId,
                RegistrationNumber =
                    registrationNumber,
                Make = CleanOptional(request.Make, 100),
                Model = CleanOptional(request.Model, 100),
                Color = CleanOptional(request.Color, 50),
                ManufactureYear = request.ManufactureYear,
                GpsAvailable =
                    request.GpsAvailable,
                OperationalStatus = "OFFLINE",
                AccountStatus = "ACTIVE",
                CreatedAt = DateTime.Now
            };

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                _context.Vehicles.Add(vehicle);

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,
                        ActivityType =
                            "VEHICLE_CREATED",
                        Description =
                            $"Vehicle '{registrationNumber}' was created.",
                        CreatedAt = DateTime.Now
                    }
                );

                if (driver != null)
                {
                    _context.Notifications.Add(
                        new Notification
                        {
                            UserId = driver.UserId,
                            Title =
                                "Vehicle Assigned",
                            Message =
                                $"Vehicle {registrationNumber} has been assigned to you.",
                            NotificationType =
                                "VEHICLE",
                            IsRead = false,
                            CreatedAt = DateTime.Now
                        }
                    );
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(
                    nameof(GetVehicle),
                    new { id = vehicle.VehicleId },
                    new
                    {
                        message =
                            "Vehicle created successfully.",

                        vehicle = new
                        {
                            vehicle.VehicleId,
                            vehicle.DriverId,
                            vehicle.VehicleTypeId,
                            vehicle.RegistrationNumber,
                            vehicle.GpsAvailable,
                            vehicle.OperationalStatus,
                            vehicle.AccountStatus,
                            vehicle.CreatedAt
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
        // PUT: api/vehicles/5
        //
        // Super Admin / Admin
        // =========================================================
        [HttpPut("{id:int}")]
        [HasPermission("MANAGE_VEHICLES")]
        public async Task<IActionResult> UpdateVehicle(
            int id,
            [FromBody] UpdateVehicleRequest request)
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

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v =>
                    v.VehicleId == id);

            if (vehicle == null)
            {
                return NotFound(new
                {
                    message = "Vehicle not found."
                });
            }

            if (await HasActiveBookingAsync(id))
            {
                return BadRequest(new
                {
                    message =
                        "Vehicle details cannot be changed while the vehicle has an active booking."
                });
            }

            var registrationNumber =
                request.RegistrationNumber?
                    .Trim()
                    .ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(
                    registrationNumber))
            {
                return BadRequest(new
                {
                    message =
                        "Vehicle registration number is required."
                });
            }

            if (registrationNumber.Length > 50)
            {
                return BadRequest(new
                {
                    message =
                        "Registration number cannot exceed 50 characters."
                });
            }

            var duplicateExists =
                await _context.Vehicles.AnyAsync(v =>
                    v.VehicleId != id &&
                    v.RegistrationNumber ==
                    registrationNumber);

            if (duplicateExists)
            {
                return BadRequest(new
                {
                    message =
                        "Another vehicle with this registration number already exists."
                });
            }


            if (request.ManufactureYear != null)
            {
                var currentYear = DateTime.Now.Year;

                if (request.ManufactureYear < 1900 ||
                    request.ManufactureYear > currentYear + 1)
                {
                    return BadRequest(new
                    {
                        message =
                            $"Manufacture year must be between 1900 and {currentYear + 1}."
                    });
                }
            }

            if ((request.Make?.Trim().Length ?? 0) > 100 ||
                (request.Model?.Trim().Length ?? 0) > 100 ||
                (request.Color?.Trim().Length ?? 0) > 50)
            {
                return BadRequest(new
                {
                    message =
                        "Make/Model cannot exceed 100 characters and Color cannot exceed 50 characters."
                });
            }

            var vehicleType =
                await _context.VehicleTypes
                    .FirstOrDefaultAsync(v =>
                        v.VehicleTypeId ==
                            request.VehicleTypeId);

            if (vehicleType == null)
            {
                return BadRequest(new
                {
                    message =
                        "Vehicle type not found."
                });
            }

            if (vehicleType.Status != "ACTIVE")
            {
                return BadRequest(new
                {
                    message =
                        "Inactive vehicle type cannot be assigned."
                });
            }

            Driver? newDriver = null;

            if (request.DriverId != null)
            {
                newDriver = await _context.Drivers
                    .FirstOrDefaultAsync(d =>
                        d.DriverId ==
                            request.DriverId.Value);

                if (newDriver == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Driver not found."
                    });
                }

                if (newDriver.VerificationStatus !=
                    "APPROVED")
                {
                    return BadRequest(new
                    {
                        message =
                            "Only an approved driver can be assigned."
                    });
                }

                var driverUser =
                    await _context.Users
                        .FirstOrDefaultAsync(u =>
                            u.UserId ==
                            newDriver.UserId);

                if (driverUser == null ||
                    driverUser.AccountStatus != "ACTIVE")
                {
                    return BadRequest(new
                    {
                        message =
                            "Driver account is not active."
                    });
                }
            }

            var oldDriverId = vehicle.DriverId;
            var oldRegistration =
                vehicle.RegistrationNumber;

            vehicle.DriverId =
                request.DriverId;

            vehicle.VehicleTypeId =
                request.VehicleTypeId;

            vehicle.RegistrationNumber =
                registrationNumber;

            vehicle.Make = CleanOptional(request.Make, 100);
            vehicle.Model = CleanOptional(request.Model, 100);
            vehicle.Color = CleanOptional(request.Color, 50);
            vehicle.ManufactureYear = request.ManufactureYear;

            vehicle.GpsAvailable =
                request.GpsAvailable;

            if (vehicle.AccountStatus == "INACTIVE")
            {
                vehicle.OperationalStatus = "OFFLINE";
            }

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType =
                        "VEHICLE_UPDATED",
                    Description =
                        $"Vehicle '{oldRegistration}' was updated to '{registrationNumber}'.",
                    CreatedAt = DateTime.Now
                }
            );

            if (newDriver != null &&
                oldDriverId != newDriver.DriverId)
            {
                _context.Notifications.Add(
                    new Notification
                    {
                        UserId = newDriver.UserId,
                        Title =
                            "Vehicle Assigned",
                        Message =
                            $"Vehicle {registrationNumber} has been assigned to you.",
                        NotificationType =
                            "VEHICLE",
                        IsRead = false,
                        CreatedAt = DateTime.Now
                    }
                );
            }

            if (oldDriverId != null &&
                oldDriverId != request.DriverId)
            {
                var oldDriver =
                    await _context.Drivers
                        .FirstOrDefaultAsync(d =>
                            d.DriverId ==
                            oldDriverId.Value);

                if (oldDriver != null)
                {
                    _context.Notifications.Add(
                        new Notification
                        {
                            UserId = oldDriver.UserId,
                            Title =
                                "Vehicle Assignment Changed",
                            Message =
                                $"Vehicle {registrationNumber} is no longer assigned to you.",
                            NotificationType =
                                "VEHICLE",
                            IsRead = false,
                            CreatedAt = DateTime.Now
                        }
                    );
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Vehicle updated successfully.",

                vehicle = new
                {
                    vehicle.VehicleId,
                    vehicle.DriverId,
                    vehicle.VehicleTypeId,
                    vehicle.RegistrationNumber,
                    vehicle.GpsAvailable,
                    vehicle.OperationalStatus,
                    vehicle.AccountStatus,
                    vehicle.CreatedAt
                }
            });
        }

        // =========================================================
        // PUT: api/vehicles/5/driver
        //
        // Assign / change / remove driver
        // Super Admin / Admin
        // =========================================================
        [HttpPut("{id:int}/driver")]
        [HasPermission("MANAGE_VEHICLES")]
        public async Task<IActionResult> AssignDriver(
            int id,
            [FromBody] AssignVehicleDriverRequest request)
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

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v =>
                    v.VehicleId == id);

            if (vehicle == null)
            {
                return NotFound(new
                {
                    message = "Vehicle not found."
                });
            }

            if (await HasActiveBookingAsync(id))
            {
                return BadRequest(new
                {
                    message =
                        "Driver assignment cannot be changed while this vehicle has an active booking."
                });
            }

            Driver? newDriver = null;

            if (request.DriverId != null)
            {
                newDriver = await _context.Drivers
                    .FirstOrDefaultAsync(d =>
                        d.DriverId ==
                            request.DriverId.Value);

                if (newDriver == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Driver not found."
                    });
                }

                if (newDriver.VerificationStatus !=
                    "APPROVED")
                {
                    return BadRequest(new
                    {
                        message =
                            "Only an approved driver can be assigned."
                    });
                }

                var driverUser =
                    await _context.Users
                        .FirstOrDefaultAsync(u =>
                            u.UserId ==
                            newDriver.UserId);

                if (driverUser == null ||
                    driverUser.AccountStatus != "ACTIVE")
                {
                    return BadRequest(new
                    {
                        message =
                            "Driver account is not active."
                    });
                }
            }

            var oldDriverId = vehicle.DriverId;

            if (oldDriverId == request.DriverId)
            {
                return Ok(new
                {
                    message =
                        "Vehicle already has this driver assignment."
                });
            }

            vehicle.DriverId =
                request.DriverId;

            vehicle.OperationalStatus =
                "OFFLINE";

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType =
                        "VEHICLE_DRIVER_CHANGED",
                    Description =
                        request.DriverId == null
                            ? $"Driver was removed from vehicle '{vehicle.RegistrationNumber}'."
                            : $"Driver #{request.DriverId.Value} was assigned to vehicle '{vehicle.RegistrationNumber}'.",
                    CreatedAt = DateTime.Now
                }
            );

            if (oldDriverId != null)
            {
                var oldDriver =
                    await _context.Drivers
                        .FirstOrDefaultAsync(d =>
                            d.DriverId ==
                            oldDriverId.Value);

                if (oldDriver != null)
                {
                    _context.Notifications.Add(
                        new Notification
                        {
                            UserId = oldDriver.UserId,
                            Title =
                                "Vehicle Assignment Changed",
                            Message =
                                $"Vehicle {vehicle.RegistrationNumber} is no longer assigned to you.",
                            NotificationType =
                                "VEHICLE",
                            IsRead = false,
                            CreatedAt = DateTime.Now
                        }
                    );
                }
            }

            if (newDriver != null)
            {
                _context.Notifications.Add(
                    new Notification
                    {
                        UserId = newDriver.UserId,
                        Title =
                            "Vehicle Assigned",
                        Message =
                            $"Vehicle {vehicle.RegistrationNumber} has been assigned to you.",
                        NotificationType =
                            "VEHICLE",
                        IsRead = false,
                        CreatedAt = DateTime.Now
                    }
                );
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Vehicle driver assignment updated successfully.",
                vehicleId = vehicle.VehicleId,
                driverId = vehicle.DriverId
            });
        }

        // =========================================================
        // PUT: api/vehicles/5/status
        //
        // Manual status:
        // AVAILABLE / OFFLINE
        //
        // ON_RIDE must ONLY be controlled by booking lifecycle.
        // =========================================================
        [HttpPut("{id:int}/status")]
        [HasPermission("MANAGE_VEHICLES")]
        public async Task<IActionResult>
            ChangeOperationalStatus(
                int id,
                [FromBody]
                ChangeVehicleOperationalStatusRequest request)
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

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v =>
                    v.VehicleId == id);

            if (vehicle == null)
            {
                return NotFound(new
                {
                    message = "Vehicle not found."
                });
            }

            var status = request.Status?
                .Trim()
                .ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(status) ||
                !AllowedOperationalStatuses.Contains(status))
            {
                return BadRequest(new
                {
                    message =
                        "Manual vehicle status must be AVAILABLE or OFFLINE. ON_RIDE is controlled by the booking lifecycle."
                });
            }

            if (vehicle.AccountStatus != "ACTIVE" &&
                status == "AVAILABLE")
            {
                return BadRequest(new
                {
                    message =
                        "An inactive vehicle cannot be made available."
                });
            }

            if (status == "AVAILABLE")
            {
                if (vehicle.DriverId == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "A vehicle must have an assigned driver before becoming available."
                    });
                }

                var driver =
                    await _context.Drivers
                        .FirstOrDefaultAsync(d =>
                            d.DriverId ==
                            vehicle.DriverId.Value);

                if (driver == null ||
                    driver.VerificationStatus !=
                        "APPROVED")
                {
                    return BadRequest(new
                    {
                        message =
                            "Vehicle requires an approved driver before becoming available."
                    });
                }
            }

            if (await HasActiveBookingAsync(id))
            {
                return BadRequest(new
                {
                    message =
                        "Vehicle status cannot be changed manually while it has an active booking."
                });
            }

            var oldStatus =
                vehicle.OperationalStatus;

            vehicle.OperationalStatus =
                status;

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType =
                        "VEHICLE_OPERATIONAL_STATUS_CHANGED",
                    Description =
                        $"Vehicle '{vehicle.RegistrationNumber}' changed from {oldStatus} to {status}.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Vehicle operational status updated successfully.",
                vehicleId = vehicle.VehicleId,
                operationalStatus =
                    vehicle.OperationalStatus
            });
        }

        // =========================================================
        // PUT: api/vehicles/5/gps
        // =========================================================
        [HttpPut("{id:int}/gps")]
        [HasPermission("MANAGE_VEHICLES")]
        public async Task<IActionResult> ChangeGpsAvailability(
            int id,
            [FromBody] ChangeVehicleGpsRequest request)
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

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v =>
                    v.VehicleId == id);

            if (vehicle == null)
            {
                return NotFound(new
                {
                    message = "Vehicle not found."
                });
            }

            vehicle.GpsAvailable =
                request.GpsAvailable;

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType =
                        "VEHICLE_GPS_CHANGED",
                    Description =
                        $"Vehicle '{vehicle.RegistrationNumber}' GPS availability changed to {request.GpsAvailable}.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Vehicle GPS availability updated successfully.",
                vehicleId = vehicle.VehicleId,
                gpsAvailable =
                    vehicle.GpsAvailable
            });
        }

        // =========================================================
        // PUT: api/vehicles/5/activate
        //
        // No DELETE - preserve booking/history records
        // =========================================================
        [HttpPut("{id:int}/activate")]
        [HasPermission("MANAGE_VEHICLES")]
        public async Task<IActionResult> ActivateVehicle(int id)
        {
            return await ChangeAccountStatusInternal(
                id,
                "ACTIVE"
            );
        }

        // =========================================================
        // PUT: api/vehicles/5/deactivate
        // =========================================================
        [HttpPut("{id:int}/deactivate")]
        [HasPermission("MANAGE_VEHICLES")]
        public async Task<IActionResult> DeactivateVehicle(
            int id)
        {
            return await ChangeAccountStatusInternal(
                id,
                "INACTIVE"
            );
        }

        private async Task<IActionResult>
            ChangeAccountStatusInternal(
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

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v =>
                    v.VehicleId == id);

            if (vehicle == null)
            {
                return NotFound(new
                {
                    message = "Vehicle not found."
                });
            }

            if (vehicle.AccountStatus == newStatus)
            {
                return Ok(new
                {
                    message =
                        $"Vehicle is already {newStatus}.",
                    vehicleId = vehicle.VehicleId,
                    accountStatus =
                        vehicle.AccountStatus
                });
            }

            if (newStatus == "INACTIVE" &&
                await HasActiveBookingAsync(id))
            {
                return BadRequest(new
                {
                    message =
                        "Vehicle cannot be deactivated while it has an active booking."
                });
            }

            var oldStatus =
                vehicle.AccountStatus;

            vehicle.AccountStatus =
                newStatus;

            if (newStatus == "INACTIVE")
            {
                vehicle.OperationalStatus =
                    "OFFLINE";
            }

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType =
                        "VEHICLE_ACCOUNT_STATUS_CHANGED",
                    Description =
                        $"Vehicle '{vehicle.RegistrationNumber}' account status changed from {oldStatus} to {newStatus}.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    $"Vehicle {newStatus.ToLowerInvariant()} successfully.",
                vehicleId = vehicle.VehicleId,
                accountStatus =
                    vehicle.AccountStatus,
                operationalStatus =
                    vehicle.OperationalStatus
            });
        }

        private static string? CleanOptional(string? value, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var cleaned = value.Trim();
            return cleaned.Length <= maxLength
                ? cleaned
                : cleaned[..maxLength];
        }
    }

    // =============================================================
    // DTOs
    // =============================================================

    public class CreateVehicleRequest
    {
        public int? DriverId { get; set; }

        public int VehicleTypeId { get; set; }

        public string RegistrationNumber { get; set; } =
            string.Empty;

        public string? Make { get; set; }

        public string? Model { get; set; }

        public string? Color { get; set; }

        public int? ManufactureYear { get; set; }

        public bool GpsAvailable { get; set; } = true;
    }

    public class UpdateVehicleRequest
    {
        public int? DriverId { get; set; }

        public int VehicleTypeId { get; set; }

        public string RegistrationNumber { get; set; } =
            string.Empty;

        public string? Make { get; set; }

        public string? Model { get; set; }

        public string? Color { get; set; }

        public int? ManufactureYear { get; set; }

        public bool GpsAvailable { get; set; } = true;
    }

    public class AssignVehicleDriverRequest
    {
        public int? DriverId { get; set; }
    }

    public class ChangeVehicleOperationalStatusRequest
    {
        public string Status { get; set; } =
            string.Empty;
    }

    public class ChangeVehicleGpsRequest
    {
        public bool GpsAvailable { get; set; }
    }
}