using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MmcTaxiApi.Data;
using MmcTaxiApi.Models;

namespace MmcTaxiApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PasswordController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PasswordController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // HELPER - CURRENT USER ID
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


        // =========================================================
        // PASSWORD VALIDATION
        // =========================================================

        private string? ValidateNewPassword(string? password)
        {
            if (string.IsNullOrWhiteSpace(password))
            {
                return "New password is required.";
            }

            if (password.Length < 8)
            {
                return "Password must contain at least 8 characters.";
            }

            if (password.Length > 100)
            {
                return "Password cannot exceed 100 characters.";
            }

            if (!password.Any(char.IsUpper))
            {
                return "Password must contain at least one uppercase letter.";
            }

            if (!password.Any(char.IsLower))
            {
                return "Password must contain at least one lowercase letter.";
            }

            if (!password.Any(char.IsDigit))
            {
                return "Password must contain at least one number.";
            }

            return null;
        }


        // =========================================================
        // PUT: api/password/change
        //
        // Any logged-in user can change own password.
        // Requires current password.
        // =========================================================

        [HttpPut("change")]
        [Authorize]
        public async Task<IActionResult> ChangeMyPassword(
            [FromBody] ChangePasswordRequest request)
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

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.UserId == currentUserId.Value);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User account not found."
                });
            }

            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
            {
                return BadRequest(new
                {
                    message = "Current password is required."
                });
            }

            var validationMessage =
                ValidateNewPassword(request.NewPassword);

            if (validationMessage != null)
            {
                return BadRequest(new
                {
                    message = validationMessage
                });
            }

            if (request.NewPassword !=
                request.ConfirmPassword)
            {
                return BadRequest(new
                {
                    message =
                        "New password and confirm password do not match."
                });
            }

            if (user.PasswordHash == "TEMP_HASH")
            {
                return BadRequest(new
                {
                    message =
                        "This account still uses a temporary password setup. Please ask the Super Admin to reset the password first."
                });
            }

            var passwordHasher =
                new PasswordHasher<User>();

            var verificationResult =
                passwordHasher.VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    request.CurrentPassword
                );

            if (verificationResult ==
                PasswordVerificationResult.Failed)
            {
                return BadRequest(new
                {
                    message =
                        "Current password is incorrect."
                });
            }

            var samePasswordResult =
                passwordHasher.VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    request.NewPassword
                );

            if (samePasswordResult !=
                PasswordVerificationResult.Failed)
            {
                return BadRequest(new
                {
                    message =
                        "New password must be different from the current password."
                });
            }

            user.PasswordHash =
                passwordHasher.HashPassword(
                    user,
                    request.NewPassword
                );

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType =
                        "PASSWORD_CHANGED",
                    Description =
                        "User changed their account password.",
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Password changed successfully."
            });
        }


        // =========================================================
        // POST: api/password/forgot
        //
        // Public endpoint.
        // Always returns the same message to avoid account enumeration.
        // In development the reset token is returned so the frontend can
        // complete the workflow without an email provider.
        // =========================================================

        [HttpPost("forgot")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword(
            [FromBody] ForgotPasswordRequest request)
        {
            var email = request.Email?
                .Trim()
                .ToLowerInvariant();

            const string genericMessage =
                "If an active account exists for that email, a password reset request has been created.";

            if (string.IsNullOrWhiteSpace(email))
            {
                return Ok(new
                {
                    message = genericMessage
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == email);

            if (user == null ||
                user.AccountStatus != "ACTIVE")
            {
                return Ok(new
                {
                    message = genericMessage
                });
            }

            var now = DateTime.Now;

            var oldTokens = await _context.PasswordResetTokens
                .Where(t =>
                    t.UserId == user.UserId &&
                    t.UsedAt == null &&
                    t.ExpiresAt > now)
                .ToListAsync();

            foreach (var oldToken in oldTokens)
            {
                oldToken.UsedAt = now;
            }

            var rawToken = Convert.ToHexString(
                RandomNumberGenerator.GetBytes(32));

            var tokenHash = HashResetToken(rawToken);

            var resetToken = new PasswordResetToken
            {
                UserId = user.UserId,
                TokenHash = tokenHash,
                ExpiresAt = now.AddMinutes(30),
                UsedAt = null,
                CreatedAt = now
            };

            _context.PasswordResetTokens.Add(resetToken);

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = user.UserId,
                    ActivityType =
                        "PASSWORD_RESET_REQUESTED",
                    Description =
                        "A password reset request was created.",
                    CreatedAt = now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = genericMessage,

                // DEVELOPMENT ONLY:
                // Remove this field when a real email/SMS reset-link
                // delivery service is connected.
                resetToken = rawToken,

                expiresAt = resetToken.ExpiresAt
            });
        }


        // =========================================================
        // POST: api/password/reset
        //
        // Public endpoint.
        // Token expires after 30 minutes and can be used only once.
        // =========================================================

        [HttpPost("reset")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword(
            [FromBody] ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Token))
            {
                return BadRequest(new
                {
                    message =
                        "Password reset token is required."
                });
            }

            var validationMessage =
                ValidateNewPassword(request.NewPassword);

            if (validationMessage != null)
            {
                return BadRequest(new
                {
                    message = validationMessage
                });
            }

            if (request.NewPassword !=
                request.ConfirmPassword)
            {
                return BadRequest(new
                {
                    message =
                        "New password and confirm password do not match."
                });
            }

            var tokenHash =
                HashResetToken(request.Token.Trim());

            var now = DateTime.Now;

            var resetToken =
                await _context.PasswordResetTokens
                    .FirstOrDefaultAsync(t =>
                        t.TokenHash == tokenHash);

            if (resetToken == null ||
                resetToken.UsedAt != null ||
                resetToken.ExpiresAt <= now)
            {
                return BadRequest(new
                {
                    message =
                        "Password reset token is invalid, expired, or has already been used."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.UserId == resetToken.UserId);

            if (user == null ||
                user.AccountStatus != "ACTIVE")
            {
                return BadRequest(new
                {
                    message =
                        "Password reset request is no longer valid."
                });
            }

            var passwordHasher =
                new PasswordHasher<User>();

            if (user.PasswordHash != "TEMP_HASH")
            {
                var samePassword =
                    passwordHasher.VerifyHashedPassword(
                        user,
                        user.PasswordHash,
                        request.NewPassword
                    );

                if (samePassword !=
                    PasswordVerificationResult.Failed)
                {
                    return BadRequest(new
                    {
                        message =
                            "New password must be different from the current password."
                    });
                }
            }

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                user.PasswordHash =
                    passwordHasher.HashPassword(
                        user,
                        request.NewPassword
                    );

                resetToken.UsedAt = now;

                var otherActiveTokens =
                    await _context.PasswordResetTokens
                        .Where(t =>
                            t.UserId == user.UserId &&
                            t.PasswordResetTokenId !=
                                resetToken.PasswordResetTokenId &&
                            t.UsedAt == null)
                        .ToListAsync();

                foreach (var token in otherActiveTokens)
                {
                    token.UsedAt = now;
                }

                _context.ActivityLogs.Add(
                    new ActivityLog
                    {
                        UserId = user.UserId,
                        ActivityType =
                            "PASSWORD_RESET_COMPLETED",
                        Description =
                            "User reset their account password using a secure reset token.",
                        CreatedAt = now
                    }
                );

                _context.Notifications.Add(
                    new Notification
                    {
                        UserId = user.UserId,
                        Title = "Password Changed",
                        Message =
                            "Your account password was reset successfully.",
                        NotificationType = "SYSTEM",
                        IsRead = false,
                        CreatedAt = now
                    }
                );

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        "Password reset successfully. You can now log in with your new password."
                });
            }
            catch
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "An error occurred while resetting the password."
                });
            }
        }


        private static string HashResetToken(string token)
        {
            var bytes = SHA256.HashData(
                Encoding.UTF8.GetBytes(token));

            return Convert.ToHexString(bytes);
        }


        // =========================================================
        // PUT: api/password/admin-reset/5
        //
        // SUPER ADMIN ONLY
        //
        // Used especially for old TEMP_HASH accounts.
        // =========================================================

        [HttpPut("admin-reset/{userId:int}")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> AdminResetPassword(
            int userId,
            [FromBody] AdminResetPasswordRequest request)
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

            if (currentUserId.Value == userId)
            {
                return BadRequest(new
                {
                    message =
                        "Use the normal change-password function for your own account."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.UserId == userId);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User account not found."
                });
            }

            var validationMessage =
                ValidateNewPassword(request.NewPassword);

            if (validationMessage != null)
            {
                return BadRequest(new
                {
                    message = validationMessage
                });
            }

            if (request.NewPassword !=
                request.ConfirmPassword)
            {
                return BadRequest(new
                {
                    message =
                        "New password and confirm password do not match."
                });
            }

            var passwordHasher =
                new PasswordHasher<User>();

            user.PasswordHash =
                passwordHasher.HashPassword(
                    user,
                    request.NewPassword
                );

            _context.ActivityLogs.Add(
                new ActivityLog
                {
                    UserId = currentUserId.Value,
                    ActivityType =
                        "USER_PASSWORD_RESET",
                    Description =
                        $"Password was reset for user #{user.UserId} ({user.Email}).",
                    CreatedAt = DateTime.Now
                }
            );

            _context.Notifications.Add(
                new Notification
                {
                    UserId = user.UserId,
                    Title = "Password Reset",
                    Message =
                        "Your account password was reset by the system administrator.",
                    NotificationType = "SYSTEM",
                    IsRead = false,
                    CreatedAt = DateTime.Now
                }
            );

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "User password reset successfully."
            });
        }


        // =========================================================
        // GET: api/password/temp-accounts
        //
        // Shows accounts still using TEMP_HASH.
        // SUPER ADMIN ONLY.
        // =========================================================

        [HttpGet("temp-accounts")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult> GetTemporaryPasswordAccounts()
        {
            var users = await _context.Users
                .Where(u =>
                    u.PasswordHash == "TEMP_HASH")
                .OrderBy(u => u.FullName)
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.AccountStatus
                })
                .ToListAsync();

            return Ok(users);
        }
    }


    // =============================================================
    // DTOs
    // =============================================================

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } =
            string.Empty;

        public string NewPassword { get; set; } =
            string.Empty;

        public string ConfirmPassword { get; set; } =
            string.Empty;
    }


    public class ForgotPasswordRequest
    {
        public string Email { get; set; } =
            string.Empty;
    }


    public class ResetPasswordRequest
    {
        public string Token { get; set; } =
            string.Empty;

        public string NewPassword { get; set; } =
            string.Empty;

        public string ConfirmPassword { get; set; } =
            string.Empty;
    }


    public class AdminResetPasswordRequest
    {
        public string NewPassword { get; set; } =
            string.Empty;

        public string ConfirmPassword { get; set; } =
            string.Empty;
    }
}