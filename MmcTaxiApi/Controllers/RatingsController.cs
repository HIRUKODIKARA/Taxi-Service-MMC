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
    public class RatingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RatingsController(ApplicationDbContext context)
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

        // =========================================================
        // GET: api/ratings
        //
        // Management only
        // =========================================================
        [HttpGet]
        [Authorize(Policy = "OperationsOnly")]
        public async Task<ActionResult> GetRatings()
        {
            var ratings = await _context.Ratings
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.RatingId,
                    r.BookingId,
                    r.PassengerId,
                    r.DriverId,
                    r.RatingValue,
                    r.Feedback,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(ratings);
        }

        // =========================================================
        // GET: api/ratings/my
        //
        // Passenger gets own submitted ratings
        // =========================================================
        [HttpGet("my")]
        [Authorize(Policy = "PassengerOnly")]
        public async Task<ActionResult> GetMyRatings()
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

            var ratings = await _context.Ratings
                .Where(r =>
                    r.PassengerId == currentUserId.Value)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.RatingId,
                    r.BookingId,
                    r.PassengerId,
                    r.DriverId,
                    r.RatingValue,
                    r.Feedback,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(ratings);
        }

        // =========================================================
        // GET: api/ratings/5
        //
        // Passenger -> own rating
        // Driver -> rating received by own driver profile
        // Management -> any rating
        // =========================================================
        [HttpGet("{id}")]
        public async Task<ActionResult> GetRating(int id)
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

            var rating = await _context.Ratings
                .FirstOrDefaultAsync(r =>
                    r.RatingId == id);

            if (rating == null)
            {
                return NotFound(new
                {
                    message = "Rating not found."
                });
            }

            var allowed = IsManagementUser();

            if (!allowed &&
                User.IsInRole("PASSENGER"))
            {
                allowed =
                    rating.PassengerId ==
                    currentUserId.Value;
            }

            if (!allowed &&
                User.IsInRole("DRIVER"))
            {
                allowed = await _context.Drivers
                    .AnyAsync(d =>
                        d.DriverId == rating.DriverId &&
                        d.UserId == currentUserId.Value);
            }

            if (!allowed)
            {
                return StatusCode(403, new
                {
                    message =
                        "You do not have permission to view this rating."
                });
            }

            return Ok(new
            {
                rating.RatingId,
                rating.BookingId,
                rating.PassengerId,
                rating.DriverId,
                rating.RatingValue,
                rating.Feedback,
                rating.CreatedAt
            });
        }

        // =========================================================
        // GET: api/ratings/booking/5
        //
        // Passenger -> own booking
        // Driver -> assigned driver
        // Management -> any
        // =========================================================
        [HttpGet("booking/{bookingId}")]
        public async Task<ActionResult> GetRatingByBooking(
            int bookingId)
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

            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b =>
                    b.BookingId == bookingId);

            if (booking == null)
            {
                return NotFound(new
                {
                    message = "Booking not found."
                });
            }

            var allowed = IsManagementUser();

            if (!allowed &&
                User.IsInRole("PASSENGER"))
            {
                allowed =
                    booking.PassengerId ==
                    currentUserId.Value;
            }

            if (!allowed &&
                User.IsInRole("DRIVER") &&
                booking.AssignedDriverId != null)
            {
                allowed = await _context.Drivers
                    .AnyAsync(d =>
                        d.DriverId ==
                            booking.AssignedDriverId.Value &&
                        d.UserId ==
                            currentUserId.Value);
            }

            if (!allowed)
            {
                return StatusCode(403, new
                {
                    message =
                        "You do not have permission to view this booking rating."
                });
            }

            var rating = await _context.Ratings
                .FirstOrDefaultAsync(r =>
                    r.BookingId == bookingId);

            if (rating == null)
            {
                return NotFound(new
                {
                    message =
                        "No rating found for this booking."
                });
            }

            return Ok(new
            {
                rating.RatingId,
                rating.BookingId,
                rating.PassengerId,
                rating.DriverId,
                rating.RatingValue,
                rating.Feedback,
                rating.CreatedAt
            });
        }

        // =========================================================
        // GET: api/ratings/driver/5
        //
        // Management -> any driver
        // Driver -> own ratings
        // =========================================================
        [HttpGet("driver/{driverId}")]
        public async Task<ActionResult> GetRatingsByDriver(
            int driverId)
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

            if (!IsManagementUser() &&
                driver.UserId != currentUserId.Value)
            {
                return StatusCode(403, new
                {
                    message =
                        "You do not have permission to view these ratings."
                });
            }

            var ratings = await _context.Ratings
                .Where(r =>
                    r.DriverId == driverId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.RatingId,
                    r.BookingId,
                    r.DriverId,
                    r.RatingValue,
                    r.Feedback,
                    r.CreatedAt
                })
                .ToListAsync();

            var averageRating =
                ratings.Count > 0
                    ? Math.Round(
                        ratings.Average(r =>
                            r.RatingValue), 2)
                    : 0;

            return Ok(new
            {
                driverId,
                averageRating,
                totalRatings = ratings.Count,
                ratings
            });
        }

        // =========================================================
        // GET: api/ratings/my-driver-ratings
        //
        // Driver gets own ratings without sending DriverId
        // =========================================================
        [HttpGet("my-driver-ratings")]
        [Authorize(Policy = "DriverOnly")]
        public async Task<ActionResult>
            GetMyDriverRatings()
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
                    d.UserId == currentUserId.Value);

            if (driver == null)
            {
                return NotFound(new
                {
                    message =
                        "Driver profile not found."
                });
            }

            var ratings = await _context.Ratings
                .Where(r =>
                    r.DriverId == driver.DriverId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.RatingId,
                    r.BookingId,
                    r.DriverId,
                    r.RatingValue,
                    r.Feedback,
                    r.CreatedAt
                })
                .ToListAsync();

            var averageRating =
                ratings.Count > 0
                    ? Math.Round(
                        ratings.Average(r =>
                            r.RatingValue), 2)
                    : 0;

            return Ok(new
            {
                driverId = driver.DriverId,
                averageRating,
                totalRatings = ratings.Count,
                ratings
            });
        }

        // =========================================================
        // GET: api/ratings/passenger/5
        //
        // Management only
        // Passenger should use /my
        // =========================================================
        [HttpGet("passenger/{passengerId}")]
        [Authorize(Policy = "OperationsOnly")]
        public async Task<ActionResult>
            GetRatingsByPassenger(int passengerId)
        {
            var passengerExists =
                await _context.Users.AnyAsync(u =>
                    u.UserId == passengerId);

            if (!passengerExists)
            {
                return NotFound(new
                {
                    message =
                        "Passenger not found."
                });
            }

            var ratings = await _context.Ratings
                .Where(r =>
                    r.PassengerId == passengerId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.RatingId,
                    r.BookingId,
                    r.PassengerId,
                    r.DriverId,
                    r.RatingValue,
                    r.Feedback,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(ratings);
        }

        // =========================================================
        // POST: api/ratings
        //
        // PASSENGER ONLY
        // PassengerId comes from JWT
        // =========================================================
        [HttpPost]
        [Authorize(Policy = "PassengerOnly")]
        public async Task<ActionResult> CreateRating(
            [FromBody] CreateRatingRequest request)
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

            if (request.BookingId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Valid booking ID is required."
                });
            }

            if (request.RatingValue < 1 ||
                request.RatingValue > 5)
            {
                return BadRequest(new
                {
                    message =
                        "Rating must be between 1 and 5."
                });
            }

            if (!string.IsNullOrWhiteSpace(
                    request.Feedback) &&
                request.Feedback.Length > 500)
            {
                return BadRequest(new
                {
                    message =
                        "Feedback cannot exceed 500 characters."
                });
            }

            var passenger = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.UserId == currentUserId.Value);

            if (passenger == null ||
                passenger.AccountStatus != "ACTIVE")
            {
                return BadRequest(new
                {
                    message =
                        "Passenger account not found or inactive."
                });
            }

            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b =>
                    b.BookingId == request.BookingId);

            if (booking == null)
            {
                return NotFound(new
                {
                    message = "Booking not found."
                });
            }

            if (booking.PassengerId !=
                currentUserId.Value)
            {
                return StatusCode(403, new
                {
                    message =
                        "You can only rate your own booking."
                });
            }

            if (booking.BookingStatus != "COMPLETED")
            {
                return BadRequest(new
                {
                    message =
                        "Only completed trips can be rated."
                });
            }

            if (booking.AssignedDriverId == null)
            {
                return BadRequest(new
                {
                    message =
                        "No driver is assigned to this booking."
                });
            }

            var duplicateRating =
                await _context.Ratings.AnyAsync(r =>
                    r.BookingId == request.BookingId);

            if (duplicateRating)
            {
                return BadRequest(new
                {
                    message =
                        "A rating has already been submitted for this booking."
                });
            }

            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d =>
                    d.DriverId ==
                    booking.AssignedDriverId.Value);

            if (driver == null)
            {
                return BadRequest(new
                {
                    message =
                        "Assigned driver not found."
                });
            }

            var rating = new Rating
            {
                BookingId = booking.BookingId,
                PassengerId =
                    currentUserId.Value,
                DriverId = driver.DriverId,
                RatingValue =
                    request.RatingValue,
                Feedback =
                    string.IsNullOrWhiteSpace(
                        request.Feedback)
                        ? null
                        : request.Feedback.Trim(),
                CreatedAt = DateTime.Now
            };

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                _context.Ratings.Add(rating);

                _context.Notifications.Add(
                    new Notification
                    {
                        UserId = driver.UserId,
                        Title =
                            "New Rating Received",
                        Message =
                            $"You received a {rating.RatingValue}-star rating for booking #{booking.BookingId}.",
                        NotificationType =
                            "DRIVER",
                        IsRead = false,
                        CreatedAt = DateTime.Now
                    }
                );

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId =
                            currentUserId.Value,
                        ActivityType =
                            "RATING_SUBMITTED",
                        Description =
                            $"Passenger #{currentUserId.Value} submitted a {rating.RatingValue}-star rating for booking #{booking.BookingId} and driver #{driver.DriverId}.",
                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(
                    nameof(GetRating),
                    new { id = rating.RatingId },
                    new
                    {
                        message =
                            "Rating submitted successfully.",

                        rating = new
                        {
                            rating.RatingId,
                            rating.BookingId,
                            rating.DriverId,
                            rating.RatingValue,
                            rating.Feedback,
                            rating.CreatedAt
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
                        "An error occurred while submitting the rating."
                });
            }
        }

        // =========================================================
        // PUT: api/ratings/5
        //
        // PASSENGER ONLY
        // Only owner can update
        // =========================================================
        [HttpPut("{id}")]
        [Authorize(Policy = "PassengerOnly")]
        public async Task<IActionResult> UpdateRating(
            int id,
            [FromBody] UpdateRatingRequest request)
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

            var rating = await _context.Ratings
                .FirstOrDefaultAsync(r =>
                    r.RatingId == id);

            if (rating == null)
            {
                return NotFound(new
                {
                    message =
                        "Rating not found."
                });
            }

            if (rating.PassengerId !=
                currentUserId.Value)
            {
                return StatusCode(403, new
                {
                    message =
                        "Only the passenger who submitted this rating can update it."
                });
            }

            if (request.RatingValue < 1 ||
                request.RatingValue > 5)
            {
                return BadRequest(new
                {
                    message =
                        "Rating must be between 1 and 5."
                });
            }

            if (!string.IsNullOrWhiteSpace(
                    request.Feedback) &&
                request.Feedback.Length > 500)
            {
                return BadRequest(new
                {
                    message =
                        "Feedback cannot exceed 500 characters."
                });
            }

            var oldRatingValue =
                rating.RatingValue;

            rating.RatingValue =
                request.RatingValue;

            rating.Feedback =
                string.IsNullOrWhiteSpace(
                    request.Feedback)
                    ? null
                    : request.Feedback.Trim();

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId =
                        currentUserId.Value,
                    ActivityType =
                        "RATING_UPDATED",
                    Description =
                        $"Rating #{rating.RatingId} for booking #{rating.BookingId} changed from {oldRatingValue} to {rating.RatingValue} stars.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Rating updated successfully.",

                rating = new
                {
                    rating.RatingId,
                    rating.BookingId,
                    rating.DriverId,
                    rating.RatingValue,
                    rating.Feedback,
                    rating.CreatedAt
                }
            });
        }
    }

    // =============================================================
    // DTOs
    // PassengerId deliberately removed.
    // =============================================================

    public class CreateRatingRequest
    {
        public int BookingId { get; set; }

        public int RatingValue { get; set; }

        public string? Feedback { get; set; }
    }

    public class UpdateRatingRequest
    {
        public int RatingValue { get; set; }

        public string? Feedback { get; set; }
    }
}