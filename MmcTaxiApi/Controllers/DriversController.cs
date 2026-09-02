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
    public class DriversController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private static readonly string[] RequiredDocumentTypes =
        {
            "DRIVING_LICENSE",
            "NIC",
            "VEHICLE_REGISTRATION"
        };

        public DriversController(ApplicationDbContext context)
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

        private bool IsAdminOrSuperAdmin()
        {
            return User.IsInRole("SUPER_ADMIN") ||
                   User.IsInRole("ADMIN");
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

        private async Task<bool> IsOwnDriverAsync(int driverId)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return false;
            }

            return await _context.Drivers.AnyAsync(d =>
                d.DriverId == driverId &&
                d.UserId == currentUserId.Value
            );
        }

        // =========================================================
        // GET: api/drivers
        // Admin / Super Admin / Taxi Operations
        // =========================================================
        [HttpGet]
        [HasPermission("VIEW_DRIVERS")]
        public async Task<ActionResult> GetDrivers()
        {
            var drivers = await _context.Drivers
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new
                {
                    d.DriverId,
                    d.UserId,
                    d.DrivingLicenseNo,
                    d.VerificationStatus,
                    d.OperationalStatus,
                    d.GpsEnabled,
                    d.VerifiedAt,
                    d.CreatedAt
                })
                .ToListAsync();

            return Ok(drivers);
        }

        // =========================================================
        // GET: api/drivers/me
        // Driver gets own driver profile
        // =========================================================
        [HttpGet("me")]
        [Authorize(Policy = "DriverOnly")]
        public async Task<ActionResult> GetMyDriverProfile()
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
                .Where(d => d.UserId == currentUserId.Value)
                .Select(d => new
                {
                    d.DriverId,
                    d.UserId,
                    d.DrivingLicenseNo,
                    d.VerificationStatus,
                    d.OperationalStatus,
                    d.GpsEnabled,
                    d.VerifiedAt,
                    d.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (driver == null)
            {
                return NotFound(new
                {
                    message =
                        "Driver profile not found for the logged-in user."
                });
            }

            return Ok(driver);
        }

        // =========================================================
        // GET: api/drivers/5
        // Driver can view own profile.
        // Admin / Super Admin / Operations can view driver.
        // =========================================================
        [HttpGet("{id}")]
        public async Task<ActionResult> GetDriver(int id)
        {
            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.DriverId == id);

            if (driver == null)
            {
                return NotFound(new
                {
                    message = "Driver not found."
                });
            }

            var canView =
                await IsOwnDriverAsync(id) ||
                await HasPermissionAsync("VIEW_DRIVERS");

            if (!canView)
            {
                return StatusCode(403, new
                {
                    message =
                        "You do not have VIEW_DRIVERS permission."
                });
            }

            return Ok(new
            {
                driver.DriverId,
                driver.UserId,
                driver.DrivingLicenseNo,
                driver.VerificationStatus,
                driver.OperationalStatus,
                driver.GpsEnabled,
                driver.VerifiedAt,
                driver.CreatedAt
            });
        }

        // =========================================================
        // GET: api/drivers/user/5
        //
        // Admin / Super Admin / Operations can query by user ID.
        // Driver can only query own user ID.
        // =========================================================
        [HttpGet("user/{userId}")]
        public async Task<ActionResult> GetDriverByUserId(int userId)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            if (currentUserId.Value != userId)
            {
                var canViewDrivers =
                    await HasPermissionAsync("VIEW_DRIVERS");

                if (!canViewDrivers)
                {
                    return StatusCode(403, new
                    {
                        message =
                            "You do not have VIEW_DRIVERS permission."
                    });
                }
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (driver == null)
            {
                return NotFound(new
                {
                    message =
                        "Driver profile not found for this user."
                });
            }

            return Ok(new
            {
                driver.DriverId,
                driver.UserId,
                driver.DrivingLicenseNo,
                driver.VerificationStatus,
                driver.OperationalStatus,
                driver.GpsEnabled,
                driver.VerifiedAt,
                driver.CreatedAt
            });
        }

        // =========================================================
        // GET: api/drivers/5/verification
        //
        // Driver -> own verification
        // Admin / Super Admin -> any driver
        // =========================================================
        [HttpGet("{id}/verification")]
        public async Task<IActionResult> GetDriverVerification(int id)
        {
            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.DriverId == id);

            if (driver == null)
            {
                return NotFound(new
                {
                    message = "Driver not found."
                });
            }

            if (!await IsOwnDriverAsync(id))
            {
                var canVerifyDrivers =
                    await HasPermissionAsync("VERIFY_DRIVERS");

                if (!canVerifyDrivers)
                {
                    return StatusCode(403, new
                    {
                        message =
                            "You do not have VERIFY_DRIVERS permission."
                    });
                }
            }

            var documents = await _context.DriverDocuments
                .Where(d => d.DriverId == id)
                .OrderByDescending(d => d.UploadedAt)
                .ToListAsync();

            var documentStatus =
                RequiredDocumentTypes.Select(type =>
                {
                    var latest = documents
                        .Where(d => d.DocumentType == type)
                        .OrderByDescending(d => d.UploadedAt)
                        .FirstOrDefault();

                    return new
                    {
                        documentType = type,
                        uploaded = latest != null,
                        verificationStatus =
                            latest?.VerificationStatus
                            ?? "NOT_UPLOADED",
                        documentId = latest?.DocumentId
                    };
                })
                .ToList();

            var allApproved =
                RequiredDocumentTypes.All(type =>
                {
                    var latest = documents
                        .Where(d => d.DocumentType == type)
                        .OrderByDescending(d => d.UploadedAt)
                        .FirstOrDefault();

                    return latest != null &&
                           latest.VerificationStatus == "APPROVED";
                });

            return Ok(new
            {
                driverId = driver.DriverId,
                driverVerificationStatus =
                    driver.VerificationStatus,
                verifiedAt = driver.VerifiedAt,
                allRequiredDocumentsApproved = allApproved,
                documents = documentStatus
            });
        }

        // =========================================================
        // POST: api/drivers
        //
        // Admin / Super Admin creates driver profile.
        //
        // Driver registration through public application can later
        // use a separate controlled registration workflow.
        // =========================================================
        [HttpPost]
        [HasPermission("MANAGE_DRIVERS")]
        public async Task<ActionResult> CreateDriver(
            [FromBody] CreateDriverRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            if (request.UserId <= 0)
            {
                return BadRequest(new
                {
                    message = "User is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    request.DrivingLicenseNo))
            {
                return BadRequest(new
                {
                    message =
                        "Driving license number is required."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.UserId == request.UserId);

            if (user == null)
            {
                return BadRequest(new
                {
                    message =
                        "Selected user does not exist."
                });
            }

            if (user.AccountStatus != "ACTIVE")
            {
                return BadRequest(new
                {
                    message =
                        "Only active users can create a driver profile."
                });
            }

            var existingDriver =
                await _context.Drivers
                    .AnyAsync(d =>
                        d.UserId == request.UserId);

            if (existingDriver)
            {
                return BadRequest(new
                {
                    message =
                        "This user already has a driver profile."
                });
            }

            var normalizedLicense =
                request.DrivingLicenseNo
                    .Trim()
                    .ToUpperInvariant();

            var licenseExists =
                await _context.Drivers
                    .AnyAsync(d =>
                        d.DrivingLicenseNo ==
                        normalizedLicense);

            if (licenseExists)
            {
                return BadRequest(new
                {
                    message =
                        "Driving license number already exists."
                });
            }

            var driver = new Driver
            {
                UserId = request.UserId,
                DrivingLicenseNo = normalizedLicense,
                VerificationStatus = "PENDING",
                OperationalStatus = "OFFLINE",
                GpsEnabled = false,
                VerifiedAt = null,
                CreatedAt = DateTime.Now
            };

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                _context.Drivers.Add(driver);

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,
                        ActivityType =
                            "DRIVER_PROFILE_CREATED",
                        Description =
                            $"Driver profile created for user #{request.UserId}.",
                        CreatedAt = DateTime.Now
                    }
                );

                _context.Notifications.Add(
                    new Notification
                    {
                        UserId = request.UserId,
                        Title =
                            "Driver Registration Started",
                        Message =
                            "Your driver profile has been created. Please upload the required documents for verification.",
                        NotificationType = "DRIVER",
                        IsRead = false,
                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(
                    nameof(GetDriver),
                    new { id = driver.DriverId },
                    new
                    {
                        message =
                            "Driver profile created successfully.",
                        driver = new
                        {
                            driver.DriverId,
                            driver.UserId,
                            driver.DrivingLicenseNo,
                            driver.VerificationStatus,
                            driver.OperationalStatus,
                            driver.GpsEnabled,
                            driver.CreatedAt
                        }
                    }
                );
            }
            catch
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "An error occurred while creating the driver profile."
                });
            }
        }

        // =========================================================
        // PUT: api/drivers/5
        //
        // Driver -> own licence
        // Admin / Super Admin -> driver licence
        // =========================================================
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateDriver(
            int id,
            [FromBody] UpdateDriverRequest request)
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
                .FirstOrDefaultAsync(d => d.DriverId == id);

            if (driver == null)
            {
                return NotFound(new
                {
                    message = "Driver not found."
                });
            }

            if (driver.UserId != currentUserId.Value)
            {
                var canManageDrivers =
                    await HasPermissionAsync("MANAGE_DRIVERS");

                if (!canManageDrivers)
                {
                    return StatusCode(403, new
                    {
                        message =
                            "You do not have MANAGE_DRIVERS permission."
                    });
                }
            }

            if (string.IsNullOrWhiteSpace(
                    request.DrivingLicenseNo))
            {
                return BadRequest(new
                {
                    message =
                        "Driving license number is required."
                });
            }

            var normalizedLicense =
                request.DrivingLicenseNo
                    .Trim()
                    .ToUpperInvariant();

            var duplicateLicense =
                await _context.Drivers.AnyAsync(d =>
                    d.DriverId != id &&
                    d.DrivingLicenseNo == normalizedLicense
                );

            if (duplicateLicense)
            {
                return BadRequest(new
                {
                    message =
                        "Driving license number already belongs to another driver."
                });
            }

            var oldLicense = driver.DrivingLicenseNo;

            driver.DrivingLicenseNo = normalizedLicense;

            // Changing licence requires verification again.
            if (!string.Equals(
                    oldLicense,
                    normalizedLicense,
                    StringComparison.OrdinalIgnoreCase))
            {
                driver.VerificationStatus = "PENDING";
                driver.VerifiedAt = null;
                driver.OperationalStatus = "OFFLINE";
            }

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType =
                        "DRIVER_PROFILE_UPDATED",
                    Description =
                        $"Driver #{driver.DriverId} profile was updated.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Driver profile updated successfully.",
                driver = new
                {
                    driver.DriverId,
                    driver.UserId,
                    driver.DrivingLicenseNo,
                    driver.VerificationStatus,
                    driver.OperationalStatus,
                    driver.GpsEnabled,
                    driver.VerifiedAt
                }
            });
        }

        // =========================================================
        // PUT: api/drivers/5/status
        //
        // Driver can control own AVAILABLE / OFFLINE status.
        // ON_RIDE is controlled by booking lifecycle.
        // =========================================================
        [HttpPut("{id}/status")]
        public async Task<ActionResult> UpdateDriverStatus(
            int id,
            [FromBody] DriverStatusRequest request)
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
                .FirstOrDefaultAsync(d => d.DriverId == id);

            if (driver == null)
            {
                return NotFound(new
                {
                    message = "Driver not found."
                });
            }

            if (driver.UserId != currentUserId.Value)
            {
                var canManageDrivers =
                    await HasPermissionAsync("MANAGE_DRIVERS");

                if (!canManageDrivers)
                {
                    return StatusCode(403, new
                    {
                        message =
                            "You do not have MANAGE_DRIVERS permission."
                    });
                }
            }

            var requestedStatus =
                request.Status?
                    .Trim()
                    .ToUpperInvariant();

            var allowedManualStatuses = new[]
            {
                "AVAILABLE",
                "OFFLINE"
            };

            if (string.IsNullOrWhiteSpace(requestedStatus) ||
                !allowedManualStatuses.Contains(requestedStatus))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid manual driver status. Allowed values: AVAILABLE, OFFLINE."
                });
            }

            if (requestedStatus == "AVAILABLE" &&
                driver.VerificationStatus != "APPROVED")
            {
                return BadRequest(new
                {
                    message =
                        "Only approved drivers can become available."
                });
            }

            var hasActiveRide =
                await _context.Bookings.AnyAsync(b =>
                    b.AssignedDriverId == id &&
                    b.BookingStatus == "ON_RIDE");

            if (hasActiveRide)
            {
                return BadRequest(new
                {
                    message =
                        "Driver status cannot be changed while a ride is active."
                });
            }

            var oldStatus = driver.OperationalStatus;

            driver.OperationalStatus = requestedStatus;

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType =
                        "DRIVER_STATUS_CHANGED",
                    Description =
                        $"Driver #{driver.DriverId} status changed from {oldStatus} to {requestedStatus}.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    $"Driver status changed to {requestedStatus}.",
                driverId = driver.DriverId,
                operationalStatus =
                    driver.OperationalStatus
            });
        }

        // =========================================================
        // PUT: api/drivers/5/gps
        //
        // Driver controls own GPS.
        // Admin/Super Admin may disable it if required.
        // =========================================================
        [HttpPut("{id}/gps")]
        public async Task<ActionResult> UpdateGpsStatus(
            int id,
            [FromBody] DriverGpsRequest request)
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
                .FirstOrDefaultAsync(d => d.DriverId == id);

            if (driver == null)
            {
                return NotFound(new
                {
                    message = "Driver not found."
                });
            }

            if (driver.UserId != currentUserId.Value)
            {
                var canManageDrivers =
                    await HasPermissionAsync("MANAGE_DRIVERS");

                if (!canManageDrivers)
                {
                    return StatusCode(403, new
                    {
                        message =
                            "You do not have MANAGE_DRIVERS permission."
                    });
                }
            }

            if (request.Enabled &&
                driver.VerificationStatus != "APPROVED")
            {
                return BadRequest(new
                {
                    message =
                        "GPS can only be enabled after driver approval."
                });
            }

            driver.GpsEnabled = request.Enabled;

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType =
                        "DRIVER_GPS_CHANGED",
                    Description =
                        $"Driver #{driver.DriverId} GPS was {(request.Enabled ? "enabled" : "disabled")}.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    $"Driver GPS {(request.Enabled ? "enabled" : "disabled")} successfully.",
                driverId = driver.DriverId,
                gpsEnabled = driver.GpsEnabled
            });
        }

        // =========================================================
        // PUT: api/drivers/5/approve
        // Admin / Super Admin only
        // =========================================================
        [HttpPut("{id}/approve")]
        [HasPermission("VERIFY_DRIVERS")]
        public async Task<ActionResult> ApproveDriver(int id)
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
                .FirstOrDefaultAsync(d => d.DriverId == id);

            if (driver == null)
            {
                return NotFound(new
                {
                    message = "Driver not found."
                });
            }

            if (driver.VerificationStatus == "APPROVED")
            {
                return BadRequest(new
                {
                    message =
                        "Driver is already approved."
                });
            }

            var documents =
                await _context.DriverDocuments
                    .Where(d => d.DriverId == id)
                    .OrderByDescending(d => d.UploadedAt)
                    .ToListAsync();

            var missingDocuments =
                new List<string>();

            var unapprovedDocuments =
                new List<string>();

            foreach (var type in RequiredDocumentTypes)
            {
                var latestDocument =
                    documents
                        .Where(d =>
                            d.DocumentType == type)
                        .OrderByDescending(d =>
                            d.UploadedAt)
                        .FirstOrDefault();

                if (latestDocument == null)
                {
                    missingDocuments.Add(type);
                }
                else if (
                    latestDocument.VerificationStatus
                    != "APPROVED")
                {
                    unapprovedDocuments.Add(type);
                }
            }

            if (missingDocuments.Count > 0)
            {
                return BadRequest(new
                {
                    message =
                        "Driver cannot be approved because required documents are missing.",
                    missingDocuments
                });
            }

            if (unapprovedDocuments.Count > 0)
            {
                return BadRequest(new
                {
                    message =
                        "Driver cannot be approved until all required documents are approved.",
                    unapprovedDocuments
                });
            }

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                driver.VerificationStatus = "APPROVED";
                driver.VerifiedAt = DateTime.Now;
                driver.OperationalStatus = "OFFLINE";

                _context.Notifications.Add(
                    new Notification
                    {
                        UserId = driver.UserId,
                        Title =
                            "Driver Verification Approved",
                        Message =
                            "Your driver account has been approved. You can now go online and receive bookings.",
                        NotificationType = "DRIVER",
                        IsRead = false,
                        CreatedAt = DateTime.Now
                    }
                );

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,
                        ActivityType =
                            "DRIVER_APPROVED",
                        Description =
                            $"Driver #{driver.DriverId} was approved after document verification.",
                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        "Driver approved successfully.",
                    driver = new
                    {
                        driver.DriverId,
                        driver.UserId,
                        driver.VerificationStatus,
                        driver.OperationalStatus,
                        driver.VerifiedAt
                    }
                });
            }
            catch
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "An error occurred while approving the driver."
                });
            }
        }

        // =========================================================
        // PUT: api/drivers/5/reject
        // Admin / Super Admin only
        // =========================================================
        [HttpPut("{id}/reject")]
        [HasPermission("VERIFY_DRIVERS")]
        public async Task<ActionResult> RejectDriver(
            int id,
            [FromBody] RejectDriverRequest request)
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
                .FirstOrDefaultAsync(d => d.DriverId == id);

            if (driver == null)
            {
                return NotFound(new
                {
                    message = "Driver not found."
                });
            }

            if (driver.VerificationStatus == "REJECTED")
            {
                return BadRequest(new
                {
                    message =
                        "Driver verification is already rejected."
                });
            }

            var reason =
                string.IsNullOrWhiteSpace(request.Reason)
                    ? "Driver verification requirements were not satisfied."
                    : request.Reason.Trim();

            if (reason.Length > 500)
            {
                return BadRequest(new
                {
                    message =
                        "Rejection reason cannot exceed 500 characters."
                });
            }

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                driver.VerificationStatus = "REJECTED";
                driver.VerifiedAt = DateTime.Now;
                driver.OperationalStatus = "OFFLINE";
                driver.GpsEnabled = false;

                _context.Notifications.Add(
                    new Notification
                    {
                        UserId = driver.UserId,
                        Title =
                            "Driver Verification Rejected",
                        Message =
                            $"Your driver verification was rejected. Reason: {reason}",
                        NotificationType = "DRIVER",
                        IsRead = false,
                        CreatedAt = DateTime.Now
                    }
                );

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,
                        ActivityType =
                            "DRIVER_REJECTED",
                        Description =
                            $"Driver #{driver.DriverId} verification rejected. Reason: {reason}",
                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        "Driver verification rejected.",
                    driverId = driver.DriverId,
                    verificationStatus =
                        driver.VerificationStatus,
                    reason
                });
            }
            catch
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "An error occurred while rejecting the driver."
                });
            }
        }
    }

    // =============================================================
    // DTOs
    // =============================================================

    public class CreateDriverRequest
    {
        public int UserId { get; set; }

        public string DrivingLicenseNo { get; set; } =
            string.Empty;
    }

    public class UpdateDriverRequest
    {
        public string DrivingLicenseNo { get; set; } =
            string.Empty;
    }

    public class DriverStatusRequest
    {
        public string Status { get; set; } =
            string.Empty;
    }

    public class DriverGpsRequest
    {
        public bool Enabled { get; set; }
    }

    public class RejectDriverRequest
    {
        public string Reason { get; set; } =
            string.Empty;
    }
}