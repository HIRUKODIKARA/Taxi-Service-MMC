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
    public class VehiclePhotosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        private const long MaxFileSize = 5 * 1024 * 1024;

        private static readonly string[] AllowedPhotoTypes =
        {
            "FRONT",
            "REAR",
            "SIDE",
            "OTHER"
        };

        private static readonly string[] AllowedExtensions =
        {
            ".jpg",
            ".jpeg",
            ".png"
        };

        private static readonly string[] AllowedMimeTypes =
        {
            "image/jpeg",
            "image/png"
        };

        public VehiclePhotosController(
            ApplicationDbContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

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

        private async Task<bool> HasPermissionAsync(string permissionName)
        {
            if (User.IsInRole("SUPER_ADMIN"))
            {
                return true;
            }

            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return false;
            }

            return await (
                from userRole in _context.UserRoles
                join rolePermission in _context.RolePermissions
                    on userRole.RoleId equals rolePermission.RoleId
                join permission in _context.Permissions
                    on rolePermission.PermissionId equals permission.PermissionId
                where userRole.UserId == userId.Value &&
                      permission.PermissionName == permissionName
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
                .FirstOrDefaultAsync(d => d.UserId == userId.Value);
        }

        private async Task<bool> CanAccessVehicleAsync(
            Vehicle vehicle,
            string managementPermission)
        {
            if (await HasPermissionAsync(managementPermission))
            {
                return true;
            }

            var driver = await GetCurrentDriverAsync();

            return driver != null &&
                   vehicle.DriverId == driver.DriverId;
        }

        // GET: api/vehiclephotos/vehicle/5
        [HttpGet("vehicle/{vehicleId:int}")]
        public async Task<ActionResult> GetVehiclePhotos(int vehicleId)
        {
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == vehicleId);

            if (vehicle == null)
            {
                return NotFound(new { message = "Vehicle not found." });
            }

            if (!await CanAccessVehicleAsync(vehicle, "VIEW_VEHICLES"))
            {
                return StatusCode(403, new
                {
                    message = "You do not have permission to view these vehicle photos."
                });
            }

            var photos = await _context.VehiclePhotos
                .Where(p => p.VehicleId == vehicleId)
                .OrderBy(p => p.PhotoType)
                .ThenByDescending(p => p.UploadedAt)
                .Select(p => new
                {
                    p.VehiclePhotoId,
                    p.VehicleId,
                    p.PhotoType,
                    p.UploadedAt,
                    fileUrl = $"/api/vehiclephotos/{p.VehiclePhotoId}/file"
                })
                .ToListAsync();

            return Ok(photos);
        }

        // GET: api/vehiclephotos/10/file
        [HttpGet("{id:int}/file")]
        public async Task<IActionResult> GetPhotoFile(int id)
        {
            var photo = await _context.VehiclePhotos
                .FirstOrDefaultAsync(p => p.VehiclePhotoId == id);

            if (photo == null)
            {
                return NotFound(new { message = "Vehicle photo not found." });
            }

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == photo.VehicleId);

            if (vehicle == null)
            {
                return NotFound(new { message = "Vehicle not found." });
            }

            if (!await CanAccessVehicleAsync(vehicle, "VIEW_VEHICLES"))
            {
                return StatusCode(403, new
                {
                    message = "You do not have permission to view this vehicle photo."
                });
            }

            var uploadsRoot = Path.GetFullPath(
                Path.Combine(_environment.ContentRootPath, "Uploads", "VehiclePhotos"));

            var fullPath = Path.GetFullPath(
                Path.Combine(_environment.ContentRootPath, photo.FilePath));

            if (!fullPath.StartsWith(
                    uploadsRoot + Path.DirectorySeparatorChar,
                    StringComparison.OrdinalIgnoreCase) ||
                !System.IO.File.Exists(fullPath))
            {
                return NotFound(new { message = "Vehicle photo file not found." });
            }

            var extension = Path.GetExtension(fullPath).ToLowerInvariant();

            var contentType = extension switch
            {
                ".png" => "image/png",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                _ => "application/octet-stream"
            };

            return PhysicalFile(fullPath, contentType);
        }

        // POST: api/vehiclephotos/vehicle/5
        // multipart/form-data: PhotoType + File
        [HttpPost("vehicle/{vehicleId:int}")]
        [RequestSizeLimit(MaxFileSize + 1024 * 1024)]
        public async Task<ActionResult> UploadVehiclePhoto(
            int vehicleId,
            [FromForm] UploadVehiclePhotoRequest request)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == vehicleId);

            if (vehicle == null)
            {
                return NotFound(new { message = "Vehicle not found." });
            }

            if (!await CanAccessVehicleAsync(vehicle, "MANAGE_VEHICLES"))
            {
                return StatusCode(403, new
                {
                    message = "You do not have permission to upload photos for this vehicle."
                });
            }

            var photoType = request.PhotoType?
                .Trim()
                .ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(photoType) ||
                !AllowedPhotoTypes.Contains(photoType))
            {
                return BadRequest(new
                {
                    message = "Invalid photo type. Allowed types: FRONT, REAR, SIDE, OTHER."
                });
            }

            if (request.File == null || request.File.Length == 0)
            {
                return BadRequest(new { message = "Photo file is required." });
            }

            if (request.File.Length > MaxFileSize)
            {
                return BadRequest(new
                {
                    message = "Photo file cannot exceed 5 MB."
                });
            }

            var extension = Path.GetExtension(request.File.FileName)
                .ToLowerInvariant();

            if (!AllowedExtensions.Contains(extension))
            {
                return BadRequest(new
                {
                    message = "Only JPG, JPEG and PNG vehicle photos are allowed."
                });
            }

            var mimeType = request.File.ContentType?
                .Trim()
                .ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(mimeType) ||
                !AllowedMimeTypes.Contains(mimeType))
            {
                return BadRequest(new
                {
                    message = "Invalid image content type. Only JPEG and PNG are allowed."
                });
            }

            // FRONT / REAR / SIDE are single-slot photos.
            // Uploading again safely replaces the previous one.
            VehiclePhoto? oldPhoto = null;

            if (photoType != "OTHER")
            {
                oldPhoto = await _context.VehiclePhotos
                    .Where(p =>
                        p.VehicleId == vehicleId &&
                        p.PhotoType == photoType)
                    .OrderByDescending(p => p.UploadedAt)
                    .FirstOrDefaultAsync();
            }

            var vehicleFolder = Path.Combine(
                _environment.ContentRootPath,
                "Uploads",
                "VehiclePhotos",
                vehicleId.ToString());

            Directory.CreateDirectory(vehicleFolder);

            var safeFileName = $"{Guid.NewGuid():N}{extension}";
            var physicalPath = Path.Combine(vehicleFolder, safeFileName);

            var relativePath = Path.Combine(
                "Uploads",
                "VehiclePhotos",
                vehicleId.ToString(),
                safeFileName);

            await using (var stream =
                new FileStream(physicalPath, FileMode.CreateNew))
            {
                await request.File.CopyToAsync(stream);
            }

            var newPhoto = new VehiclePhoto
            {
                VehicleId = vehicleId,
                PhotoType = photoType,
                FilePath = relativePath,
                UploadedAt = DateTime.Now
            };

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                _context.VehiclePhotos.Add(newPhoto);

                if (oldPhoto != null)
                {
                    _context.VehiclePhotos.Remove(oldPhoto);
                }

                _context.ActivityLogs.Add(new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType = "VEHICLE_PHOTO_UPLOADED",
                    Description =
                        $"{photoType} photo uploaded for vehicle '{vehicle.RegistrationNumber}'.",
                    CreatedAt = DateTime.Now
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();

                if (System.IO.File.Exists(physicalPath))
                {
                    System.IO.File.Delete(physicalPath);
                }

                throw;
            }

            // Delete old physical file only after DB transaction succeeds.
            if (oldPhoto != null)
            {
                DeletePhysicalFileSafely(oldPhoto.FilePath);
            }

            return Ok(new
            {
                message = "Vehicle photo uploaded successfully.",
                photo = new
                {
                    newPhoto.VehiclePhotoId,
                    newPhoto.VehicleId,
                    newPhoto.PhotoType,
                    newPhoto.UploadedAt,
                    fileUrl =
                        $"/api/vehiclephotos/{newPhoto.VehiclePhotoId}/file"
                }
            });
        }

        // DELETE: api/vehiclephotos/10
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteVehiclePhoto(int id)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            var photo = await _context.VehiclePhotos
                .FirstOrDefaultAsync(p => p.VehiclePhotoId == id);

            if (photo == null)
            {
                return NotFound(new { message = "Vehicle photo not found." });
            }

            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.VehicleId == photo.VehicleId);

            if (vehicle == null)
            {
                return NotFound(new { message = "Vehicle not found." });
            }

            if (!await CanAccessVehicleAsync(vehicle, "MANAGE_VEHICLES"))
            {
                return StatusCode(403, new
                {
                    message = "You do not have permission to delete this vehicle photo."
                });
            }

            _context.VehiclePhotos.Remove(photo);

            _context.ActivityLogs.Add(new ActivityLog
            {
                UserId = currentUserId.Value,
                ActivityType = "VEHICLE_PHOTO_DELETED",
                Description =
                    $"{photo.PhotoType} photo deleted for vehicle '{vehicle.RegistrationNumber}'.",
                CreatedAt = DateTime.Now
            });

            await _context.SaveChangesAsync();

            DeletePhysicalFileSafely(photo.FilePath);

            return Ok(new
            {
                message = "Vehicle photo deleted successfully."
            });
        }

        private void DeletePhysicalFileSafely(string relativePath)
        {
            try
            {
                var uploadsRoot = Path.GetFullPath(
                    Path.Combine(
                        _environment.ContentRootPath,
                        "Uploads",
                        "VehiclePhotos"));

                var fullPath = Path.GetFullPath(
                    Path.Combine(_environment.ContentRootPath, relativePath));

                if (fullPath.StartsWith(
                        uploadsRoot + Path.DirectorySeparatorChar,
                        StringComparison.OrdinalIgnoreCase) &&
                    System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }
            }
            catch
            {
                // A DB operation should not fail just because an old
                // physical photo could not be cleaned up.
            }
        }
    }

    public class UploadVehiclePhotoRequest
    {
        public string PhotoType { get; set; } = string.Empty;

        public IFormFile? File { get; set; }
    }
}
