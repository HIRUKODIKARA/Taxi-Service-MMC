using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
        private readonly IWebHostEnvironment _environment;

        private static readonly string[] RequiredDocumentTypes =
        {
            "DRIVING_LICENSE",
            "NIC",
            "POLICE_REPORT",
            "VEHICLE_REGISTRATION"
        };

        public DriversController(
            ApplicationDbContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
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
                    d.Address,
                    d.DateOfBirth,
                    d.DrivingLicenseExpiry,
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
                    d.Address,
                    d.DateOfBirth,
                    d.DrivingLicenseExpiry,
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
                driver.Address,
                driver.DateOfBirth,
                driver.DrivingLicenseExpiry,
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
                driver.Address,
                driver.DateOfBirth,
                driver.DrivingLicenseExpiry,
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
        // POST: api/drivers/public-register
        //
        // Public self-registration.
        // Creates User + DRIVER role + Driver + Vehicle + Documents + Photos.
        // Everything remains PENDING until Admin/Super Admin verification.
        // =========================================================
        [AllowAnonymous]
        [HttpPost("public-register")]
        [RequestSizeLimit(40 * 1024 * 1024)]
        public async Task<ActionResult> PublicRegisterDriver(
            [FromForm] PublicDriverRegistrationRequest request)
        {
            var savedFiles = new List<string>();

            try
            {
                if (string.IsNullOrWhiteSpace(request.FullName))
                    return BadRequest(new { message = "Full name is required." });

                if (string.IsNullOrWhiteSpace(request.Email))
                    return BadRequest(new { message = "Email is required." });

                if (string.IsNullOrWhiteSpace(request.Phone))
                    return BadRequest(new { message = "Phone number is required." });

                if (string.IsNullOrWhiteSpace(request.Nic))
                    return BadRequest(new { message = "NIC is required." });

                if (string.IsNullOrWhiteSpace(request.Address))
                    return BadRequest(new { message = "Address is required." });

                if (request.DateOfBirth == null)
                    return BadRequest(new { message = "Date of birth is required." });

                if (request.DateOfBirth.Value.Date >= DateTime.Today)
                    return BadRequest(new { message = "Date of birth must be a past date." });

                if (string.IsNullOrWhiteSpace(request.Password))
                    return BadRequest(new { message = "Password is required." });

                if (request.Password != request.ConfirmPassword)
                    return BadRequest(new
                    {
                        message = "Password and confirm password do not match."
                    });

                if (request.Password.Length < 8 ||
                    request.Password.Length > 100 ||
                    !request.Password.Any(char.IsUpper) ||
                    !request.Password.Any(char.IsLower) ||
                    !request.Password.Any(char.IsDigit))
                {
                    return BadRequest(new
                    {
                        message =
                            "Password must be 8-100 characters and contain uppercase, lowercase and number."
                    });
                }

                if (string.IsNullOrWhiteSpace(request.DrivingLicenseNo))
                    return BadRequest(new
                    {
                        message = "Driving licence number is required."
                    });

                if (request.DrivingLicenseExpiry == null ||
                    request.DrivingLicenseExpiry.Value.Date <= DateTime.Today)
                {
                    return BadRequest(new
                    {
                        message = "A valid future driving licence expiry date is required."
                    });
                }

                if (request.VehicleTypeId <= 0)
                    return BadRequest(new { message = "Vehicle type is required." });

                if (string.IsNullOrWhiteSpace(request.RegistrationNumber))
                    return BadRequest(new
                    {
                        message = "Vehicle registration number is required."
                    });

                if (string.IsNullOrWhiteSpace(request.Make) ||
                    string.IsNullOrWhiteSpace(request.Model) ||
                    string.IsNullOrWhiteSpace(request.Color) ||
                    request.ManufactureYear == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Vehicle Make, Model, Color and Manufacture Year are required."
                    });
                }

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

                var requiredDocuments = new Dictionary<string, IFormFile?>
                {
                    ["NIC"] = request.NicDocument,
                    ["DRIVING_LICENSE"] = request.DrivingLicenseDocument,
                    ["POLICE_REPORT"] = request.PoliceReportDocument,
                    ["VEHICLE_REGISTRATION"] = request.VehicleRegistrationDocument
                };

                foreach (var item in requiredDocuments)
                {
                    var validation = ValidateDocumentFile(item.Value);
                    if (validation != null)
                        return BadRequest(new
                        {
                            message = $"{item.Key}: {validation}"
                        });
                }

                var requiredPhotos = new Dictionary<string, IFormFile?>
                {
                    ["FRONT"] = request.FrontPhoto,
                    ["REAR"] = request.RearPhoto,
                    ["SIDE"] = request.SidePhoto
                };

                foreach (var item in requiredPhotos)
                {
                    var validation = ValidateVehiclePhotoFile(item.Value);
                    if (validation != null)
                        return BadRequest(new
                        {
                            message = $"{item.Key} photo: {validation}"
                        });
                }

                if (request.OtherPhoto != null &&
                    request.OtherPhoto.Length > 0)
                {
                    var otherValidation =
                        ValidateVehiclePhotoFile(request.OtherPhoto);

                    if (otherValidation != null)
                        return BadRequest(new
                        {
                            message = $"OTHER photo: {otherValidation}"
                        });
                }

                var email = request.Email.Trim().ToLowerInvariant();
                var phone = request.Phone.Trim();
                var nic = request.Nic.Trim().ToUpperInvariant();
                var licence =
                    request.DrivingLicenseNo.Trim().ToUpperInvariant();
                var registration =
                    request.RegistrationNumber.Trim().ToUpperInvariant();

                if (await _context.Users.AnyAsync(u =>
                        u.Email.ToLower() == email))
                    return BadRequest(new
                    {
                        message = "This email address is already registered."
                    });

                if (await _context.Users.AnyAsync(u => u.Phone == phone))
                    return BadRequest(new
                    {
                        message = "This phone number is already registered."
                    });

                if (await _context.Users.AnyAsync(u =>
                        u.Nic != null &&
                        u.Nic.ToUpper() == nic))
                    return BadRequest(new
                    {
                        message = "This NIC is already registered."
                    });

                if (await _context.Drivers.AnyAsync(d =>
                        d.DrivingLicenseNo == licence))
                    return BadRequest(new
                    {
                        message = "Driving licence number already exists."
                    });

                if (await _context.Vehicles.AnyAsync(v =>
                        v.RegistrationNumber == registration))
                    return BadRequest(new
                    {
                        message = "Vehicle registration number already exists."
                    });

                var driverRole = await _context.Roles
                    .FirstOrDefaultAsync(r => r.RoleName == "DRIVER");

                if (driverRole == null)
                    return BadRequest(new
                    {
                        message = "DRIVER role is not configured in the database."
                    });

                var vehicleType = await _context.VehicleTypes
                    .FirstOrDefaultAsync(vt =>
                        vt.VehicleTypeId == request.VehicleTypeId);

                if (vehicleType == null ||
                    vehicleType.Status != "ACTIVE")
                {
                    return BadRequest(new
                    {
                        message = "Selected vehicle type is not available."
                    });
                }

                await using var transaction =
                    await _context.Database.BeginTransactionAsync();

                try
                {
                    var user = new User
                    {
                        FullName = request.FullName.Trim(),
                        Email = email,
                        Phone = phone,
                        Nic = nic,
                        AccountStatus = "ACTIVE",
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };

                    var passwordHasher = new PasswordHasher<User>();
                    user.PasswordHash =
                        passwordHasher.HashPassword(user, request.Password);

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();

                    _context.UserRoles.Add(new UserRole
                    {
                        UserId = user.UserId,
                        RoleId = driverRole.RoleId
                    });

                    var driver = new Driver
                    {
                        UserId = user.UserId,
                        DrivingLicenseNo = licence,
                        Address = request.Address.Trim(),
                        DateOfBirth = request.DateOfBirth,
                        DrivingLicenseExpiry =
                            request.DrivingLicenseExpiry,
                        VerificationStatus = "PENDING",
                        OperationalStatus = "OFFLINE",
                        GpsEnabled = false,
                        VerifiedAt = null,
                        CreatedAt = DateTime.Now
                    };

                    _context.Drivers.Add(driver);
                    await _context.SaveChangesAsync();

                    var vehicle = new Vehicle
                    {
                        DriverId = driver.DriverId,
                        VehicleTypeId = request.VehicleTypeId,
                        RegistrationNumber = registration,
                        Make = CleanOptional(request.Make, 100),
                        Model = CleanOptional(request.Model, 100),
                        Color = CleanOptional(request.Color, 50),
                        ManufactureYear = request.ManufactureYear,
                        GpsAvailable = request.GpsAvailable,
                        OperationalStatus = "OFFLINE",
                        AccountStatus = "ACTIVE",
                        CreatedAt = DateTime.Now
                    };

                    _context.Vehicles.Add(vehicle);
                    await _context.SaveChangesAsync();

                    foreach (var item in requiredDocuments)
                    {
                        var relativePath = await SavePublicUploadAsync(
                            item.Value!,
                            "DriverDocuments",
                            driver.DriverId.ToString());

                        savedFiles.Add(relativePath);

                        _context.DriverDocuments.Add(
                            new DriverDocument
                            {
                                DriverId = driver.DriverId,
                                DocumentType = item.Key,
                                FilePath = relativePath,
                                VerificationStatus = "PENDING",
                                UploadedAt = DateTime.Now
                            });
                    }

                    foreach (var item in requiredPhotos)
                    {
                        var relativePath = await SavePublicUploadAsync(
                            item.Value!,
                            "VehiclePhotos",
                            vehicle.VehicleId.ToString());

                        savedFiles.Add(relativePath);

                        _context.VehiclePhotos.Add(
                            new VehiclePhoto
                            {
                                VehicleId = vehicle.VehicleId,
                                PhotoType = item.Key,
                                FilePath = relativePath,
                                UploadedAt = DateTime.Now
                            });
                    }

                    if (request.OtherPhoto != null &&
                        request.OtherPhoto.Length > 0)
                    {
                        var relativePath = await SavePublicUploadAsync(
                            request.OtherPhoto,
                            "VehiclePhotos",
                            vehicle.VehicleId.ToString());

                        savedFiles.Add(relativePath);

                        _context.VehiclePhotos.Add(
                            new VehiclePhoto
                            {
                                VehicleId = vehicle.VehicleId,
                                PhotoType = "OTHER",
                                FilePath = relativePath,
                                UploadedAt = DateTime.Now
                            });
                    }

                    _context.Notifications.Add(
                        new Notification
                        {
                            UserId = user.UserId,
                            Title = "Driver Registration Submitted",
                            Message =
                                "Your driver registration was submitted successfully and is pending verification.",
                            NotificationType = "DRIVER",
                            IsRead = false,
                            CreatedAt = DateTime.Now
                        });

                    _context.ActivityLogs.Add(
                        new ActivityLog
                        {
                            UserId = user.UserId,
                            ActivityType =
                                "PUBLIC_DRIVER_REGISTRATION_SUBMITTED",
                            Description =
                                $"Driver self-registration submitted for '{user.Email}' with vehicle '{registration}'.",
                            CreatedAt = DateTime.Now
                        });

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        message =
                            "Driver registration submitted successfully. Your account is pending verification.",
                        driverId = driver.DriverId,
                        vehicleId = vehicle.VehicleId,
                        verificationStatus =
                            driver.VerificationStatus
                    });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();

                    foreach (var relativePath in savedFiles)
                    {
                        DeleteUploadedFile(relativePath);
                    }

                    return StatusCode(500, new
                    {
                        message =
                            "An error occurred while submitting driver registration.",
                        detail =
                            ex.InnerException?.Message ?? ex.Message
                    });
                }
            }
            catch (Exception ex)
            {
                foreach (var relativePath in savedFiles)
                {
                    DeleteUploadedFile(relativePath);
                }

                return StatusCode(500, new
                {
                    message =
                        "An unexpected error occurred during driver registration.",
                    detail =
                        ex.InnerException?.Message ?? ex.Message
                });
            }
        }

        private static string? ValidateDocumentFile(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return "File is required.";

            if (file.Length > 5 * 1024 * 1024)
                return "Maximum file size is 5 MB.";

            var extension =
                Path.GetExtension(file.FileName).ToLowerInvariant();

            var allowedExtensions =
                new[] { ".jpg", ".jpeg", ".png", ".pdf" };

            if (!allowedExtensions.Contains(extension))
                return "Only JPG, JPEG, PNG and PDF files are allowed.";

            var allowedMimeTypes =
                new[] { "image/jpeg", "image/png", "application/pdf" };

            if (string.IsNullOrWhiteSpace(file.ContentType) ||
                !allowedMimeTypes.Contains(
                    file.ContentType.ToLowerInvariant()))
            {
                return "Invalid document content type.";
            }

            return null;
        }

        private static string? ValidateVehiclePhotoFile(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return "File is required.";

            if (file.Length > 5 * 1024 * 1024)
                return "Maximum file size is 5 MB.";

            var extension =
                Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!new[] { ".jpg", ".jpeg", ".png" }
                .Contains(extension))
            {
                return "Only JPG, JPEG and PNG files are allowed.";
            }

            if (string.IsNullOrWhiteSpace(file.ContentType) ||
                !new[] { "image/jpeg", "image/png" }
                    .Contains(file.ContentType.ToLowerInvariant()))
            {
                return "Invalid image content type.";
            }

            return null;
        }

        private async Task<string> SavePublicUploadAsync(
            IFormFile file,
            string category,
            string ownerId)
        {
            var extension =
                Path.GetExtension(file.FileName).ToLowerInvariant();

            var folder = Path.Combine(
                _environment.ContentRootPath,
                "Uploads",
                category,
                ownerId);

            Directory.CreateDirectory(folder);

            var safeFileName = $"{Guid.NewGuid():N}{extension}";
            var fullPath = Path.Combine(folder, safeFileName);

            await using (var stream =
                new FileStream(fullPath, FileMode.CreateNew))
            {
                await file.CopyToAsync(stream);
            }

            return Path.Combine(
                    "Uploads",
                    category,
                    ownerId,
                    safeFileName)
                .Replace("\\", "/");
        }

        private void DeleteUploadedFile(string relativePath)
        {
            try
            {
                var normalized =
                    relativePath.Replace(
                        "/",
                        Path.DirectorySeparatorChar.ToString());

                var fullPath =
                    Path.GetFullPath(
                        Path.Combine(
                            _environment.ContentRootPath,
                            normalized));

                var uploadsRoot =
                    Path.GetFullPath(
                        Path.Combine(
                            _environment.ContentRootPath,
                            "Uploads"));

                if (fullPath.StartsWith(
                        uploadsRoot,
                        StringComparison.OrdinalIgnoreCase) &&
                    System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }
            }
            catch
            {
            }
        }

        // =========================================================
        // POST: api/drivers/register
        //
        // Admin / Super Admin complete driver registration.
        // Creates User + DRIVER role + Driver + Vehicle atomically.
        // Documents and vehicle photos are uploaded after this call.
        // =========================================================
        [HttpPost("register")]
        [HasPermission("MANAGE_DRIVERS")]
        public async Task<ActionResult> RegisterDriver(
            [FromBody] RegisterDriverRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
                return BadRequest(new { message = "Full name is required." });

            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "Email is required." });

            if (string.IsNullOrWhiteSpace(request.Phone))
                return BadRequest(new { message = "Phone number is required." });

            if (string.IsNullOrWhiteSpace(request.Nic))
                return BadRequest(new { message = "NIC is required." });

            if (string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Password is required." });

            if (request.Password != request.ConfirmPassword)
                return BadRequest(new
                {
                    message = "Password and confirm password do not match."
                });

            if (request.Password.Length < 8 ||
                request.Password.Length > 100 ||
                !request.Password.Any(char.IsUpper) ||
                !request.Password.Any(char.IsLower) ||
                !request.Password.Any(char.IsDigit))
            {
                return BadRequest(new
                {
                    message =
                        "Password must be 8-100 characters and contain uppercase, lowercase and number."
                });
            }

            if (string.IsNullOrWhiteSpace(request.DrivingLicenseNo))
                return BadRequest(new
                {
                    message = "Driving licence number is required."
                });

            if (request.DrivingLicenseExpiry == null)
                return BadRequest(new
                {
                    message = "Driving licence expiry date is required."
                });

            if (request.DrivingLicenseExpiry.Value.Date <= DateTime.Today)
                return BadRequest(new
                {
                    message = "Driving licence expiry date must be a future date."
                });

            if (request.VehicleTypeId <= 0)
                return BadRequest(new { message = "Vehicle type is required." });

            if (string.IsNullOrWhiteSpace(request.RegistrationNumber))
                return BadRequest(new
                {
                    message = "Vehicle registration number is required."
                });

            if (string.IsNullOrWhiteSpace(request.Make) ||
                string.IsNullOrWhiteSpace(request.Model) ||
                string.IsNullOrWhiteSpace(request.Color) ||
                request.ManufactureYear == null)
            {
                return BadRequest(new
                {
                    message =
                        "Vehicle Make, Model, Color and Manufacture Year are required."
                });
            }

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

            var email = request.Email.Trim().ToLowerInvariant();
            var phone = request.Phone.Trim();
            var nic = request.Nic.Trim().ToUpperInvariant();
            var licence = request.DrivingLicenseNo.Trim().ToUpperInvariant();
            var registration =
                request.RegistrationNumber.Trim().ToUpperInvariant();

            if (await _context.Users.AnyAsync(u =>
                    u.Email.ToLower() == email))
                return BadRequest(new
                {
                    message = "This email address is already registered."
                });

            if (await _context.Users.AnyAsync(u => u.Phone == phone))
                return BadRequest(new
                {
                    message = "This phone number is already registered."
                });

            if (await _context.Users.AnyAsync(u =>
                    u.Nic != null && u.Nic.ToUpper() == nic))
                return BadRequest(new
                {
                    message = "This NIC is already registered."
                });

            if (await _context.Drivers.AnyAsync(d =>
                    d.DrivingLicenseNo == licence))
                return BadRequest(new
                {
                    message = "Driving licence number already exists."
                });

            if (await _context.Vehicles.AnyAsync(v =>
                    v.RegistrationNumber == registration))
                return BadRequest(new
                {
                    message = "Vehicle registration number already exists."
                });

            var driverRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleName == "DRIVER");

            if (driverRole == null)
                return BadRequest(new
                {
                    message = "DRIVER role is not configured in the database."
                });

            var vehicleType = await _context.VehicleTypes
                .FirstOrDefaultAsync(vt =>
                    vt.VehicleTypeId == request.VehicleTypeId);

            if (vehicleType == null)
                return BadRequest(new
                {
                    message = "Selected vehicle type does not exist."
                });

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var user = new User
                {
                    FullName = request.FullName.Trim(),
                    Email = email,
                    Phone = phone,
                    Nic = nic,
                    AccountStatus = "ACTIVE",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                var passwordHasher = new PasswordHasher<User>();
                user.PasswordHash =
                    passwordHasher.HashPassword(user, request.Password);

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _context.UserRoles.Add(new UserRole
                {
                    UserId = user.UserId,
                    RoleId = driverRole.RoleId
                });

                var driver = new Driver
                {
                    UserId = user.UserId,
                    DrivingLicenseNo = licence,
                    Address = CleanOptional(request.Address, 255),
                    DateOfBirth = request.DateOfBirth,
                    DrivingLicenseExpiry = request.DrivingLicenseExpiry,
                    VerificationStatus = "PENDING",
                    OperationalStatus = "OFFLINE",
                    GpsEnabled = false,
                    VerifiedAt = null,
                    CreatedAt = DateTime.Now
                };

                _context.Drivers.Add(driver);
                await _context.SaveChangesAsync();

                var vehicle = new Vehicle
                {
                    DriverId = driver.DriverId,
                    VehicleTypeId = request.VehicleTypeId,
                    RegistrationNumber = registration,
                    Make = CleanOptional(request.Make, 100),
                    Model = CleanOptional(request.Model, 100),
                    Color = CleanOptional(request.Color, 50),
                    ManufactureYear = request.ManufactureYear,
                    GpsAvailable = request.GpsAvailable,
                    OperationalStatus = "OFFLINE",
                    AccountStatus = "ACTIVE",
                    CreatedAt = DateTime.Now
                };

                _context.Vehicles.Add(vehicle);

                _context.ActivityLogs.Add(new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType = "DRIVER_REGISTERED",
                    Description =
                        $"Driver '{user.Email}' registered with vehicle '{registration}' and is pending verification.",
                    CreatedAt = DateTime.Now
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        "Driver registration created successfully. Upload the required documents and vehicle photos before approval.",
                    userId = user.UserId,
                    driverId = driver.DriverId,
                    vehicleId = vehicle.VehicleId,
                    verificationStatus = driver.VerificationStatus,
                    operationalStatus = driver.OperationalStatus
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "An error occurred while registering the driver.",
                    detail = ex.InnerException?.Message ?? ex.Message
                });
            }
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
                Address = CleanOptional(request.Address, 255),
                DateOfBirth = request.DateOfBirth,
                DrivingLicenseExpiry = request.DrivingLicenseExpiry,
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
            driver.Address = CleanOptional(request.Address, 255);
            driver.DateOfBirth = request.DateOfBirth;
            driver.DrivingLicenseExpiry = request.DrivingLicenseExpiry;

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

            if (driver.DrivingLicenseExpiry == null)
            {
                return BadRequest(new
                {
                    message = "Driver cannot be approved because driving licence expiry date is missing."
                });
            }

            if (driver.DrivingLicenseExpiry.Value.Date <= DateTime.Today)
            {
                return BadRequest(new
                {
                    message = "Driver cannot be approved because the driving licence is expired."
                });
            }

            var vehicles = await _context.Vehicles
                .Where(v => v.DriverId == id && v.AccountStatus == "ACTIVE")
                .ToListAsync();

            if (vehicles.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Driver cannot be approved because no active vehicle is assigned."
                });
            }

            var eligibleVehicle = vehicles.FirstOrDefault(v =>
                !string.IsNullOrWhiteSpace(v.Make) &&
                !string.IsNullOrWhiteSpace(v.Model) &&
                !string.IsNullOrWhiteSpace(v.Color) &&
                v.ManufactureYear != null);

            if (eligibleVehicle == null)
            {
                return BadRequest(new
                {
                    message = "Driver cannot be approved until vehicle Make, Model, Color and Manufacture Year are completed."
                });
            }

            var requiredPhotoTypes = new[] { "FRONT", "REAR", "SIDE" };

            var uploadedPhotoTypes = await _context.VehiclePhotos
                .Where(p => p.VehicleId == eligibleVehicle.VehicleId &&
                            requiredPhotoTypes.Contains(p.PhotoType))
                .Select(p => p.PhotoType)
                .Distinct()
                .ToListAsync();

            var missingVehiclePhotos = requiredPhotoTypes
                .Where(type => !uploadedPhotoTypes.Contains(type))
                .ToList();

            if (missingVehiclePhotos.Count > 0)
            {
                return BadRequest(new
                {
                    message = "Driver cannot be approved because required vehicle photos are missing.",
                    vehicleId = eligibleVehicle.VehicleId,
                    missingVehiclePhotos
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

        private static string? CleanOptional(string? value, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            var cleaned = value.Trim();
            return cleaned.Length <= maxLength ? cleaned : cleaned[..maxLength];
        }
    }

    // =============================================================
    // DTOs
    // =============================================================

    public class PublicDriverRegistrationRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Nic { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;

        public DateTime? DateOfBirth { get; set; }

        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;

        public string DrivingLicenseNo { get; set; } = string.Empty;
        public DateTime? DrivingLicenseExpiry { get; set; }

        public int VehicleTypeId { get; set; }
        public string RegistrationNumber { get; set; } = string.Empty;
        public string? Make { get; set; }
        public string? Model { get; set; }
        public string? Color { get; set; }
        public int? ManufactureYear { get; set; }
        public bool GpsAvailable { get; set; } = true;

        public IFormFile? NicDocument { get; set; }
        public IFormFile? DrivingLicenseDocument { get; set; }
        public IFormFile? PoliceReportDocument { get; set; }
        public IFormFile? VehicleRegistrationDocument { get; set; }

        public IFormFile? FrontPhoto { get; set; }
        public IFormFile? RearPhoto { get; set; }
        public IFormFile? SidePhoto { get; set; }
        public IFormFile? OtherPhoto { get; set; }
    }

    public class RegisterDriverRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Nic { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;

        public string? Address { get; set; }
        public DateTime? DateOfBirth { get; set; }

        public string DrivingLicenseNo { get; set; } = string.Empty;
        public DateTime? DrivingLicenseExpiry { get; set; }

        public int VehicleTypeId { get; set; }
        public string RegistrationNumber { get; set; } = string.Empty;
        public string? Make { get; set; }
        public string? Model { get; set; }
        public string? Color { get; set; }
        public int? ManufactureYear { get; set; }

        public bool GpsAvailable { get; set; } = true;
    }

    public class CreateDriverRequest
    {
        public int UserId { get; set; }

        public string DrivingLicenseNo { get; set; } =
            string.Empty;

        public string? Address { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public DateTime? DrivingLicenseExpiry { get; set; }
    }

    public class UpdateDriverRequest
    {
        public string DrivingLicenseNo { get; set; } =
            string.Empty;

        public string? Address { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public DateTime? DrivingLicenseExpiry { get; set; }
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