using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MmcTaxiApi.Data;

namespace MmcTaxiApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // HELPER - Get logged-in user ID from JWT
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
        // GET: api/notifications
        //
        // Super Admin / Admin only
        // Full system notification list
        // =========================================================
        [HttpGet]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult> GetNotifications()
        {
            var notifications = await _context.Notifications
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.NotificationId,
                    n.UserId,
                    n.Title,
                    n.Message,
                    n.NotificationType,
                    n.IsRead,
                    n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // =========================================================
        // GET: api/notifications/me
        //
        // Any logged-in user gets ONLY own notifications
        // =========================================================
        [HttpGet("me")]
        public async Task<ActionResult> GetMyNotifications()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            var notifications = await _context.Notifications
                .Where(n => n.UserId == currentUserId.Value)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.NotificationId,
                    n.UserId,
                    n.Title,
                    n.Message,
                    n.NotificationType,
                    n.IsRead,
                    n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // =========================================================
        // GET: api/notifications/me/unread
        //
        // Any logged-in user gets ONLY own unread notifications
        // =========================================================
        [HttpGet("me/unread")]
        public async Task<ActionResult> GetMyUnreadNotifications()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            var notifications = await _context.Notifications
                .Where(n =>
                    n.UserId == currentUserId.Value &&
                    !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.NotificationId,
                    n.UserId,
                    n.Title,
                    n.Message,
                    n.NotificationType,
                    n.IsRead,
                    n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // =========================================================
        // GET: api/notifications/me/unread-count
        //
        // Useful for navbar notification badge
        // =========================================================
        [HttpGet("me/unread-count")]
        public async Task<ActionResult> GetMyUnreadCount()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            var count = await _context.Notifications
                .CountAsync(n =>
                    n.UserId == currentUserId.Value &&
                    !n.IsRead);

            return Ok(new
            {
                unreadCount = count
            });
        }

        // =========================================================
        // GET: api/notifications/user/4
        //
        // Admin / Super Admin only
        // =========================================================
        [HttpGet("user/{userId}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult> GetUserNotifications(
            int userId)
        {
            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == userId);

            if (!userExists)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.NotificationId,
                    n.UserId,
                    n.Title,
                    n.Message,
                    n.NotificationType,
                    n.IsRead,
                    n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // =========================================================
        // GET: api/notifications/user/4/unread
        //
        // Admin / Super Admin only
        // =========================================================
        [HttpGet("user/{userId}/unread")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult> GetUnreadNotifications(
            int userId)
        {
            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == userId);

            if (!userExists)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var notifications = await _context.Notifications
                .Where(n =>
                    n.UserId == userId &&
                    !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.NotificationId,
                    n.UserId,
                    n.Title,
                    n.Message,
                    n.NotificationType,
                    n.IsRead,
                    n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // =========================================================
        // PUT: api/notifications/1/read
        //
        // User can mark ONLY own notification as read.
        // Admin/Super Admin can also mark a notification as read.
        // =========================================================
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n =>
                    n.NotificationId == id);

            if (notification == null)
            {
                return NotFound(new
                {
                    message = "Notification not found."
                });
            }

            var isAdmin =
                User.IsInRole("SUPER_ADMIN") ||
                User.IsInRole("ADMIN");

            if (notification.UserId != currentUserId.Value &&
                !isAdmin)
            {
                return StatusCode(403, new
                {
                    message =
                        "You do not have permission to update this notification."
                });
            }

            if (notification.IsRead)
            {
                return Ok(new
                {
                    message =
                        "Notification is already marked as read.",
                    notificationId =
                        notification.NotificationId,
                    isRead = true
                });
            }

            notification.IsRead = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Notification marked as read.",
                notificationId =
                    notification.NotificationId,
                isRead = notification.IsRead
            });
        }

        // =========================================================
        // PUT: api/notifications/me/read-all
        //
        // Logged-in user marks ONLY own notifications as read.
        // =========================================================
        [HttpPut("me/read-all")]
        public async Task<IActionResult> MarkMyNotificationsAsRead()
        {
            var currentUserId = GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Unable to identify logged-in user."
                });
            }

            var notifications = await _context.Notifications
                .Where(n =>
                    n.UserId == currentUserId.Value &&
                    !n.IsRead)
                .ToListAsync();

            if (notifications.Count == 0)
            {
                return Ok(new
                {
                    message =
                        "There are no unread notifications.",
                    updatedCount = 0
                });
            }

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "All notifications marked as read.",
                updatedCount = notifications.Count
            });
        }

        // =========================================================
        // PUT: api/notifications/user/4/read-all
        //
        // Admin / Super Admin only
        // =========================================================
        [HttpPut("user/{userId}/read-all")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> MarkAllAsRead(
            int userId)
        {
            var userExists = await _context.Users
                .AnyAsync(u => u.UserId == userId);

            if (!userExists)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var notifications = await _context.Notifications
                .Where(n =>
                    n.UserId == userId &&
                    !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "All user notifications marked as read.",
                updatedCount = notifications.Count
            });
        }
    }
}