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
    public class DriverDocumentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        private static readonly string[] AllowedDocumentTypes =
        {
            "DRIVING_LICENSE",
            "NIC",
            "POLICE_REPORT",
            "VEHICLE_REGISTRATION",
            "OTHER"
        };

        private static readonly string[] AllowedExtensions =
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".pdf"
        };

        private const long MaxFileSize = 5 * 1024 * 1024;

        public DriverDocumentsController(
            ApplicationDbContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // =========================================================
        // HELPER - Get logged-in user ID from JWT
        // =========================================================
        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (claim == null)
            {
                return null;
            }

            if (!int.TryParse(claim.Value, out var userId))
            {
                return null;
            }

            return userId;
        }

        // =========================================================
        // HELPER - Admin / Super Admin
        // =========================================================
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

        // =========================================================
        // HELPER - Check whether current user owns driver profile
        // =========================================================
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
        // GET: api/driverdocuments
        // Admin / Super Admin only
        // =========================================================
        [HttpGet]
        [HasPermission("VERIFY_DRIVERS")]
        public async Task<ActionResult> GetDocuments()
        {
            var documents = await _context.DriverDocuments
                .OrderByDescending(d => d.UploadedAt)
                .Select(d => new
                {
                    d.DocumentId,
                    d.DriverId,
                    d.DocumentType,
                    d.VerificationStatus,
                    d.UploadedAt
                })
                .ToListAsync();

            return Ok(documents);
        }

        // =========================================================
        // GET: api/driverdocuments/5
        // Driver can view own document.
        // Admin / Super Admin can view any document metadata.
        // =========================================================
        [HttpGet("{id}")]
        public async Task<ActionResult> GetDocument(int id)
        {
            var document = await _context.DriverDocuments
                .FirstOrDefaultAsync(d =>
                    d.DocumentId == id);

            if (document == null)
            {
                return NotFound(new
                {
                    message = "Driver document not found."
                });
            }

            if (!await IsOwnDriverAsync(document.DriverId))
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

            return Ok(new
            {
                document.DocumentId,
                document.DriverId,
                document.DocumentType,
                document.VerificationStatus,
                document.UploadedAt
            });
        }

        // =========================================================
        // GET: api/driverdocuments/driver/1
        // Driver can view own documents.
        // Admin / Super Admin can view any driver's documents.
        // =========================================================
        [HttpGet("driver/{driverId}")]
        public async Task<ActionResult> GetDriverDocuments(
            int driverId)
        {
            var driverExists = await _context.Drivers
                .AnyAsync(d =>
                    d.DriverId == driverId);

            if (!driverExists)
            {
                return NotFound(new
                {
                    message = "Driver not found."
                });
            }

            if (!await IsOwnDriverAsync(driverId))
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
                .Where(d =>
                    d.DriverId == driverId)
                .OrderByDescending(d =>
                    d.UploadedAt)
                .Select(d => new
                {
                    d.DocumentId,
                    d.DriverId,
                    d.DocumentType,
                    d.VerificationStatus,
                    d.UploadedAt
                })
                .ToListAsync();

            return Ok(documents);
        }

        // =========================================================
        // POST: api/driverdocuments/upload
        //
        // DRIVER:
        // Can upload only own documents.
        //
        // ADMIN / SUPER ADMIN:
        // Can upload for a driver if required.
        // =========================================================
        [HttpPost("upload")]
        public async Task<ActionResult> UploadDocument(
            [FromForm] int driverId,
            [FromForm] string documentType,
            [FromForm] IFormFile file)
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
                return BadRequest(new
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
                            "You can upload documents only for your own driver account unless you have MANAGE_DRIVERS permission."
                    });
                }
            }

            if (file == null ||
                file.Length == 0)
            {
                return BadRequest(new
                {
                    message =
                        "Please select a document file."
                });
            }

            if (file.Length > MaxFileSize)
            {
                return BadRequest(new
                {
                    message =
                        "Maximum file size is 5 MB."
                });
            }

            var normalizedType =
                documentType?
                    .Trim()
                    .ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(normalizedType) ||
                !AllowedDocumentTypes.Contains(normalizedType))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid document type. Allowed types: DRIVING_LICENSE, NIC, POLICE_REPORT, VEHICLE_REGISTRATION, OTHER."
                });
            }

            var extension = Path
                .GetExtension(file.FileName)
                .ToLowerInvariant();

            if (!AllowedExtensions.Contains(extension))
            {
                return BadRequest(new
                {
                    message =
                        "Only JPG, JPEG, PNG and PDF files are allowed."
                });
            }

            // -----------------------------------------------------
            // Basic MIME type validation
            // -----------------------------------------------------
            var allowedContentTypes = new[]
            {
                "image/jpeg",
                "image/png",
                "application/pdf"
            };

            if (string.IsNullOrWhiteSpace(file.ContentType) ||
                !allowedContentTypes.Contains(
                    file.ContentType.ToLowerInvariant()))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid file content type."
                });
            }

            var uploadDirectory = Path.Combine(
                _environment.ContentRootPath,
                "Uploads",
                "DriverDocuments",
                driverId.ToString()
            );

            Directory.CreateDirectory(uploadDirectory);

            var safeFileName =
                $"{Guid.NewGuid():N}{extension}";

            var fullPath = Path.Combine(
                uploadDirectory,
                safeFileName
            );

            try
            {
                await using var stream =
                    new FileStream(
                        fullPath,
                        FileMode.CreateNew,
                        FileAccess.Write,
                        FileShare.None
                    );

                await file.CopyToAsync(stream);
            }
            catch
            {
                return StatusCode(500, new
                {
                    message =
                        "Unable to save the document file."
                });
            }

            var relativePath = Path.Combine(
                    "Uploads",
                    "DriverDocuments",
                    driverId.ToString(),
                    safeFileName
                )
                .Replace("\\", "/");

            var document = new DriverDocument
            {
                DriverId = driverId,
                DocumentType = normalizedType,
                FilePath = relativePath,
                VerificationStatus = "PENDING",
                UploadedAt = DateTime.Now
            };

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                _context.DriverDocuments.Add(document);

                // Any new document requires verification again.
                driver.VerificationStatus = "PENDING";
                driver.VerifiedAt = null;

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,
                        ActivityType =
                            "DRIVER_DOCUMENT_UPLOADED",
                        Description =
                            $"Document {normalizedType} uploaded for driver #{driverId}.",
                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return CreatedAtAction(
                    nameof(GetDocument),
                    new
                    {
                        id = document.DocumentId
                    },
                    new
                    {
                        message =
                            "Driver document uploaded successfully.",
                        document = new
                        {
                            document.DocumentId,
                            document.DriverId,
                            document.DocumentType,
                            document.VerificationStatus,
                            document.UploadedAt
                        }
                    }
                );
            }
            catch
            {
                await transaction.RollbackAsync();

                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }

                return StatusCode(500, new
                {
                    message =
                        "An error occurred while saving the document."
                });
            }
        }

        // =========================================================
        // GET: api/driverdocuments/5/file
        //
        // Secure document file viewing/downloading.
        //
        // Driver -> own document
        // Admin/Super Admin -> any driver document
        // =========================================================
        [HttpGet("{id}/file")]
        public async Task<IActionResult> GetDocumentFile(int id)
        {
            var document = await _context.DriverDocuments
                .FirstOrDefaultAsync(d =>
                    d.DocumentId == id);

            if (document == null)
            {
                return NotFound(new
                {
                    message =
                        "Driver document not found."
                });
            }

            if (!await IsOwnDriverAsync(document.DriverId))
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

            if (string.IsNullOrWhiteSpace(document.FilePath))
            {
                return NotFound(new
                {
                    message =
                        "Document file path is not available."
                });
            }

            var normalizedRelativePath =
                document.FilePath.Replace(
                    "/",
                    Path.DirectorySeparatorChar.ToString()
                );

            var fullPath = Path.GetFullPath(
                Path.Combine(
                    _environment.ContentRootPath,
                    normalizedRelativePath
                )
            );

            var allowedRoot = Path.GetFullPath(
                Path.Combine(
                    _environment.ContentRootPath,
                    "Uploads",
                    "DriverDocuments"
                )
            );

            // Prevent path traversal.
            if (!fullPath.StartsWith(
                    allowedRoot,
                    StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new
                {
                    message =
                        "Invalid document path."
                });
            }

            if (!System.IO.File.Exists(fullPath))
            {
                return NotFound(new
                {
                    message =
                        "Document file was not found."
                });
            }

            var extension =
                Path.GetExtension(fullPath)
                    .ToLowerInvariant();

            var contentType = extension switch
            {
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".pdf" => "application/pdf",
                _ => "application/octet-stream"
            };

            var fileBytes =
                await System.IO.File
                    .ReadAllBytesAsync(fullPath);

            return File(
                fileBytes,
                contentType
            );
        }

        // =========================================================
        // PUT: api/driverdocuments/5/approve
        //
        // Admin / Super Admin only
        // =========================================================
        [HttpPut("{id}/approve")]
        [HasPermission("VERIFY_DRIVERS")]
        public async Task<IActionResult> ApproveDocument(
            int id)
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

            var document = await _context.DriverDocuments
                .FirstOrDefaultAsync(d =>
                    d.DocumentId == id);

            if (document == null)
            {
                return NotFound(new
                {
                    message =
                        "Driver document not found."
                });
            }

            if (document.VerificationStatus == "APPROVED")
            {
                return BadRequest(new
                {
                    message =
                        "Document is already approved."
                });
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.DriverId == document.DriverId);

            if (driver == null)
            {
                return NotFound(new
                {
                    message =
                        "Driver associated with this document was not found."
                });
            }

            document.VerificationStatus = "APPROVED";

            _context.Notifications.Add(
                new Notification
                {
                    UserId = driver.UserId,
                    Title = "Document Approved",
                    Message =
                        $"Your {FormatDocumentType(document.DocumentType)} document has been approved.",
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
                        "DRIVER_DOCUMENT_APPROVED",
                    Description =
                        $"Document #{document.DocumentId} ({document.DocumentType}) for driver #{driver.DriverId} was approved.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Document approved successfully.",
                document = new
                {
                    document.DocumentId,
                    document.DriverId,
                    document.DocumentType,
                    document.VerificationStatus
                }
            });
        }

        // =========================================================
        // PUT: api/driverdocuments/5/reject
        //
        // Admin / Super Admin only
        // =========================================================
        [HttpPut("{id}/reject")]
        [HasPermission("VERIFY_DRIVERS")]
        public async Task<IActionResult> RejectDocument(
            int id,
            [FromBody] RejectDocumentRequest request)
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

            var document = await _context.DriverDocuments
                .FirstOrDefaultAsync(d =>
                    d.DocumentId == id);

            if (document == null)
            {
                return NotFound(new
                {
                    message =
                        "Driver document not found."
                });
            }

            if (document.VerificationStatus == "REJECTED")
            {
                return BadRequest(new
                {
                    message =
                        "Document is already rejected."
                });
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.DriverId == document.DriverId);

            if (driver == null)
            {
                return NotFound(new
                {
                    message =
                        "Driver associated with this document was not found."
                });
            }

            var reason =
                string.IsNullOrWhiteSpace(request.Reason)
                    ? "Please upload a valid document."
                    : request.Reason.Trim();

            if (reason.Length > 500)
            {
                return BadRequest(new
                {
                    message =
                        "Rejection reason cannot exceed 500 characters."
                });
            }

            document.VerificationStatus = "REJECTED";

            driver.VerificationStatus = "PENDING";
            driver.VerifiedAt = null;
            driver.OperationalStatus = "OFFLINE";

            _context.Notifications.Add(
                new Notification
                {
                    UserId = driver.UserId,
                    Title = "Document Rejected",
                    Message =
                        $"Your {FormatDocumentType(document.DocumentType)} document was rejected. Reason: {reason}",
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
                        "DRIVER_DOCUMENT_REJECTED",
                    Description =
                        $"Document #{document.DocumentId} ({document.DocumentType}) for driver #{driver.DriverId} was rejected. Reason: {reason}",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Document rejected successfully.",
                document = new
                {
                    document.DocumentId,
                    document.DriverId,
                    document.DocumentType,
                    document.VerificationStatus
                }
            });
        }

        // =========================================================
        // GET: api/driverdocuments/driver/1/status
        //
        // Driver -> own status
        // Admin/Super Admin -> any driver
        // =========================================================
        [HttpGet("driver/{driverId}/status")]
        public async Task<IActionResult> GetVerificationStatus(
            int driverId)
        {
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

            if (!await IsOwnDriverAsync(driverId))
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
                .Where(d =>
                    d.DriverId == driverId)
                .ToListAsync();

            var requiredTypes = new[]
            {
                "DRIVING_LICENSE",
                "NIC",
                "POLICE_REPORT",
                "VEHICLE_REGISTRATION"
            };

            var results = requiredTypes
                .Select(type =>
                {
                    var latestDocument = documents
                        .Where(d =>
                            d.DocumentType == type)
                        .OrderByDescending(d =>
                            d.UploadedAt)
                        .FirstOrDefault();

                    return new
                    {
                        documentType = type,

                        uploaded =
                            latestDocument != null,

                        verificationStatus =
                            latestDocument?
                                .VerificationStatus
                            ?? "NOT_UPLOADED",

                        documentId =
                            latestDocument?
                                .DocumentId
                    };
                })
                .ToList();

            var allRequiredApproved =
                requiredTypes.All(type =>
                    documents
                        .Where(d =>
                            d.DocumentType == type)
                        .OrderByDescending(d =>
                            d.UploadedAt)
                        .FirstOrDefault()
                        ?.VerificationStatus
                    == "APPROVED"
                );

            return Ok(new
            {
                driverId,

                driverVerificationStatus =
                    driver.VerificationStatus,

                allRequiredDocumentsApproved =
                    allRequiredApproved,

                documents = results
            });
        }

        // =========================================================
        // FORMAT DOCUMENT TYPE
        // =========================================================
        private static string FormatDocumentType(
            string documentType)
        {
            return documentType
                .Replace("_", " ")
                .ToLowerInvariant();
        }
    }

    // =============================================================
    // REJECT DOCUMENT DTO
    // =============================================================
    public class RejectDocumentRequest
    {
        public string Reason { get; set; } =
            string.Empty;
    }
}