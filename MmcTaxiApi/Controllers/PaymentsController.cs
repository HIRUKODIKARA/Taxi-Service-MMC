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
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private static readonly string[] AllowedMethods =
        {
            "CASH",
            "CARD",
            "ONLINE"
        };

        private static readonly string[] AllowedStatuses =
        {
            "PENDING",
            "PAID",
            "FAILED"
        };

        public PaymentsController(ApplicationDbContext context)
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

        private async Task<bool> CanViewPaymentAsync(
            Payment payment)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return false;
            }

            if (IsManagementUser())
            {
                return true;
            }

            if (!User.IsInRole("PASSENGER"))
            {
                return false;
            }

            return await _context.Bookings.AnyAsync(b =>
                b.BookingId == payment.BookingId &&
                b.PassengerId == currentUserId.Value
            );
        }

        // =========================================================
        // GET: api/payments
        //
        // Management only
        // =========================================================
        [HttpGet]
        [Authorize(Policy = "OperationsOnly")]
        public async Task<ActionResult> GetPayments()
        {
            var payments = await _context.Payments
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.PaymentId,
                    p.BookingId,
                    p.Amount,
                    p.PaymentMethod,
                    p.PaymentStatus,
                    p.PaidAt,
                    p.CreatedAt
                })
                .ToListAsync();

            return Ok(payments);
        }

        // =========================================================
        // GET: api/payments/my
        //
        // Passenger gets own payments
        // =========================================================
        [HttpGet("my")]
        [Authorize(Policy = "PassengerOnly")]
        public async Task<ActionResult> GetMyPayments()
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

            var payments = await (
                from payment in _context.Payments
                join booking in _context.Bookings
                    on payment.BookingId equals booking.BookingId
                where booking.PassengerId ==
                      currentUserId.Value
                orderby payment.CreatedAt descending
                select new
                {
                    payment.PaymentId,
                    payment.BookingId,
                    payment.Amount,
                    payment.PaymentMethod,
                    payment.PaymentStatus,
                    payment.PaidAt,
                    payment.CreatedAt
                }
            ).ToListAsync();

            return Ok(payments);
        }

        // =========================================================
        // GET: api/payments/5
        //
        // Passenger -> own payment
        // Management -> any payment
        // =========================================================
        [HttpGet("{id}")]
        public async Task<ActionResult> GetPayment(int id)
        {
            var payment = await _context.Payments
                .FirstOrDefaultAsync(p =>
                    p.PaymentId == id);

            if (payment == null)
            {
                return NotFound(new
                {
                    message = "Payment not found."
                });
            }

            if (!await CanViewPaymentAsync(payment))
            {
                return StatusCode(403, new
                {
                    message =
                        "You do not have permission to view this payment."
                });
            }

            return Ok(new
            {
                payment.PaymentId,
                payment.BookingId,
                payment.Amount,
                payment.PaymentMethod,
                payment.PaymentStatus,
                payment.PaidAt,
                payment.CreatedAt
            });
        }

        // =========================================================
        // GET: api/payments/booking/5
        //
        // Passenger -> own booking payment
        // Management -> any booking payment
        // =========================================================
        [HttpGet("booking/{bookingId}")]
        public async Task<ActionResult> GetPaymentByBooking(
            int bookingId)
        {
            var payment = await _context.Payments
                .FirstOrDefaultAsync(p =>
                    p.BookingId == bookingId);

            if (payment == null)
            {
                return NotFound(new
                {
                    message =
                        "Payment not found for this booking."
                });
            }

            if (!await CanViewPaymentAsync(payment))
            {
                return StatusCode(403, new
                {
                    message =
                        "You do not have permission to view this payment."
                });
            }

            return Ok(new
            {
                payment.PaymentId,
                payment.BookingId,
                payment.Amount,
                payment.PaymentMethod,
                payment.PaymentStatus,
                payment.PaidAt,
                payment.CreatedAt
            });
        }

        // =========================================================
        // POST: api/payments
        //
        // Taxi Operations / Admin / Super Admin
        // =========================================================
        [HttpPost]
        [Authorize(Policy = "OperationsOnly")]
        public async Task<ActionResult> CreatePayment(
            [FromBody] CreatePaymentRequest request)
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

            if (request.Amount <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Payment amount must be greater than zero."
                });
            }

            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b =>
                    b.BookingId == request.BookingId);

            if (booking == null)
            {
                return BadRequest(new
                {
                    message = "Booking not found."
                });
            }

            if (booking.BookingStatus != "COMPLETED")
            {
                return BadRequest(new
                {
                    message =
                        "Payment can only be recorded after the trip is completed."
                });
            }

            var existingPayment =
                await _context.Payments.AnyAsync(p =>
                    p.BookingId == request.BookingId);

            if (existingPayment)
            {
                return BadRequest(new
                {
                    message =
                        "A payment already exists for this booking."
                });
            }

            var method = request.PaymentMethod?
                .Trim()
                .ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(method) ||
                !AllowedMethods.Contains(method))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid payment method. Allowed values: CASH, CARD, ONLINE."
                });
            }

            var status =
                string.IsNullOrWhiteSpace(
                    request.PaymentStatus)
                    ? "PENDING"
                    : request.PaymentStatus
                        .Trim()
                        .ToUpperInvariant();

            if (!AllowedStatuses.Contains(status))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid payment status. Allowed values: PENDING, PAID, FAILED."
                });
            }

            var payment = new Payment
            {
                BookingId = request.BookingId,
                Amount = request.Amount,
                PaymentMethod = method,
                PaymentStatus = status,
                PaidAt = status == "PAID"
                    ? DateTime.Now
                    : null,
                CreatedAt = DateTime.Now
            };

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                _context.Payments.Add(payment);

                if (booking.PassengerId != null)
                {
                    _context.Notifications.Add(
                        new Notification
                        {
                            UserId =
                                booking.PassengerId.Value,

                            Title = status == "PAID"
                                ? "Payment Successful"
                                : "Payment Created",

                            Message = status == "PAID"
                                ? $"Payment of Rs. {payment.Amount:N2} for booking #{booking.BookingId} has been recorded successfully."
                                : $"Payment of Rs. {payment.Amount:N2} for booking #{booking.BookingId} is currently {status}.",

                            NotificationType = "BOOKING",
                            IsRead = false,
                            CreatedAt = DateTime.Now
                        }
                    );
                }

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,
                        ActivityType =
                            "PAYMENT_CREATED",
                        Description =
                            $"Payment created for booking #{booking.BookingId}. Amount: Rs. {payment.Amount:N2}, Method: {payment.PaymentMethod}, Status: {payment.PaymentStatus}.",
                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(
                    nameof(GetPayment),
                    new { id = payment.PaymentId },
                    new
                    {
                        message =
                            "Payment created successfully.",

                        payment = new
                        {
                            payment.PaymentId,
                            payment.BookingId,
                            payment.Amount,
                            payment.PaymentMethod,
                            payment.PaymentStatus,
                            payment.PaidAt,
                            payment.CreatedAt
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
                        "An error occurred while creating the payment."
                });
            }
        }

        // =========================================================
        // PUT: api/payments/5/status
        //
        // Operations / Admin / Super Admin
        // =========================================================
        [HttpPut("{id}/status")]
        [Authorize(Policy = "OperationsOnly")]
        public async Task<IActionResult> UpdatePaymentStatus(
            int id,
            [FromBody] UpdatePaymentStatusRequest request)
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

            var payment = await _context.Payments
                .FirstOrDefaultAsync(p =>
                    p.PaymentId == id);

            if (payment == null)
            {
                return NotFound(new
                {
                    message = "Payment not found."
                });
            }

            var newStatus = request.Status?
                .Trim()
                .ToUpperInvariant();

            if (string.IsNullOrWhiteSpace(newStatus) ||
                !AllowedStatuses.Contains(newStatus))
            {
                return BadRequest(new
                {
                    message =
                        "Invalid payment status. Allowed values: PENDING, PAID, FAILED."
                });
            }

            if (payment.PaymentStatus == "PAID" &&
                newStatus != "PAID")
            {
                return BadRequest(new
                {
                    message =
                        "A paid payment cannot be changed to another status."
                });
            }

            if (payment.PaymentStatus == newStatus)
            {
                return Ok(new
                {
                    message =
                        $"Payment is already {newStatus}.",
                    paymentId = payment.PaymentId,
                    paymentStatus =
                        payment.PaymentStatus
                });
            }

            var oldStatus = payment.PaymentStatus;

            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b =>
                    b.BookingId ==
                    payment.BookingId);

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                payment.PaymentStatus = newStatus;

                if (newStatus == "PAID")
                {
                    payment.PaidAt = DateTime.Now;
                }
                else
                {
                    payment.PaidAt = null;
                }

                if (booking?.PassengerId != null)
                {
                    _context.Notifications.Add(
                        new Notification
                        {
                            UserId =
                                booking.PassengerId.Value,

                            Title = newStatus == "PAID"
                                ? "Payment Confirmed"
                                : "Payment Status Updated",

                            Message = newStatus == "PAID"
                                ? $"Your payment of Rs. {payment.Amount:N2} for booking #{payment.BookingId} has been confirmed."
                                : $"Payment status for booking #{payment.BookingId} changed from {oldStatus} to {newStatus}.",

                            NotificationType = "BOOKING",
                            IsRead = false,
                            CreatedAt = DateTime.Now
                        }
                    );
                }

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,
                        ActivityType =
                            "PAYMENT_STATUS_CHANGED",
                        Description =
                            $"Payment #{payment.PaymentId} changed from {oldStatus} to {newStatus}.",
                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        "Payment status updated successfully.",

                    payment = new
                    {
                        payment.PaymentId,
                        payment.BookingId,
                        payment.Amount,
                        payment.PaymentMethod,
                        payment.PaymentStatus,
                        payment.PaidAt,
                        payment.CreatedAt
                    }
                });
            }
            catch
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "An error occurred while updating the payment."
                });
            }
        }

        // =========================================================
        // PUT: api/payments/5/mark-paid
        //
        // Operations / Admin / Super Admin
        // =========================================================
        [HttpPut("{id}/mark-paid")]
        [Authorize(Policy = "OperationsOnly")]
        public async Task<IActionResult> MarkPaymentAsPaid(
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

            var payment = await _context.Payments
                .FirstOrDefaultAsync(p =>
                    p.PaymentId == id);

            if (payment == null)
            {
                return NotFound(new
                {
                    message = "Payment not found."
                });
            }

            if (payment.PaymentStatus == "PAID")
            {
                return BadRequest(new
                {
                    message =
                        "Payment is already marked as paid."
                });
            }

            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b =>
                    b.BookingId ==
                    payment.BookingId);

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                payment.PaymentStatus = "PAID";
                payment.PaidAt = DateTime.Now;

                if (booking?.PassengerId != null)
                {
                    _context.Notifications.Add(
                        new Notification
                        {
                            UserId =
                                booking.PassengerId.Value,
                            Title = "Payment Confirmed",
                            Message =
                                $"Your payment of Rs. {payment.Amount:N2} for booking #{payment.BookingId} has been confirmed.",
                            NotificationType =
                                "BOOKING",
                            IsRead = false,
                            CreatedAt = DateTime.Now
                        }
                    );
                }

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = currentUserId.Value,
                        ActivityType =
                            "PAYMENT_PAID",
                        Description =
                            $"Payment #{payment.PaymentId} for booking #{payment.BookingId} was marked as PAID.",
                        CreatedAt = DateTime.Now
                    }
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        "Payment marked as paid successfully.",

                    payment = new
                    {
                        payment.PaymentId,
                        payment.BookingId,
                        payment.Amount,
                        payment.PaymentMethod,
                        payment.PaymentStatus,
                        payment.PaidAt,
                        payment.CreatedAt
                    }
                });
            }
            catch
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "An error occurred while marking the payment as paid."
                });
            }
        }
    }

    // =============================================================
    // DTOs
    // =============================================================

    public class CreatePaymentRequest
    {
        public int BookingId { get; set; }

        public decimal Amount { get; set; }

        public string PaymentMethod { get; set; } =
            "CASH";

        public string PaymentStatus { get; set; } =
            "PENDING";
    }

    public class UpdatePaymentStatusRequest
    {
        public string Status { get; set; } =
            string.Empty;
    }
}