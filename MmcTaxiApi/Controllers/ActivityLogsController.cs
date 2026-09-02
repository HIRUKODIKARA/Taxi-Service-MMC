using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MmcTaxiApi.Authorization;
using MmcTaxiApi.Data;

namespace MmcTaxiApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ActivityLogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ActivityLogsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/activitylogs
        //
        // Requires VIEW_ACTIVITY_LOGS permission.
        // Supports optional filters:
        // userId
        // activityType
        // fromDate
        // toDate
        // =========================================================
        [HttpGet]
        [HasPermission("VIEW_ACTIVITY_LOGS")]
        public async Task<ActionResult> GetActivityLogs(
            [FromQuery] int? userId,
            [FromQuery] string? activityType,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var query = _context.ActivityLogs
                .AsQueryable();

            if (userId.HasValue)
            {
                query = query.Where(log =>
                    log.UserId == userId.Value);
            }

            if (!string.IsNullOrWhiteSpace(activityType))
            {
                var normalizedType =
                    activityType.Trim().ToUpperInvariant();

                query = query.Where(log =>
                    log.ActivityType == normalizedType);
            }

            if (fromDate.HasValue)
            {
                query = query.Where(log =>
                    log.CreatedAt >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                var endDate = toDate.Value.Date
                    .AddDays(1)
                    .AddTicks(-1);

                query = query.Where(log =>
                    log.CreatedAt <= endDate);
            }

            var logs = await (
                from log in query
                join user in _context.Users
                    on log.UserId equals user.UserId
                    into userJoin
                from user in userJoin.DefaultIfEmpty()
                orderby log.CreatedAt descending
                select new
                {
                    log.LogId,
                    log.UserId,

                    UserName = user != null
                        ? user.FullName
                        : "System",

                    UserEmail = user != null
                        ? user.Email
                        : null,

                    log.ActivityType,
                    log.Description,
                    log.CreatedAt
                }
            ).ToListAsync();

            return Ok(logs);
        }


        // =========================================================
        // GET: api/activitylogs/5
        // Requires VIEW_ACTIVITY_LOGS permission.
        // =========================================================
        [HttpGet("{id:long}")]
        [HasPermission("VIEW_ACTIVITY_LOGS")]
        public async Task<ActionResult> GetActivityLog(long id)
        {
            var log = await (
                from activity in _context.ActivityLogs
                join user in _context.Users
                    on activity.UserId equals user.UserId
                    into userJoin
                from user in userJoin.DefaultIfEmpty()
                where activity.LogId == id
                select new
                {
                    activity.LogId,
                    activity.UserId,

                    UserName = user != null
                        ? user.FullName
                        : "System",

                    UserEmail = user != null
                        ? user.Email
                        : null,

                    activity.ActivityType,
                    activity.Description,
                    activity.CreatedAt
                }
            ).FirstOrDefaultAsync();

            if (log == null)
            {
                return NotFound(new
                {
                    message = "Activity log not found."
                });
            }

            return Ok(log);
        }


        // =========================================================
        // GET: api/activitylogs/recent?limit=20
        //
        // Used by dashboard/activity monitoring page.
        // Requires VIEW_ACTIVITY_LOGS permission.
        // =========================================================
        [HttpGet("recent")]
        [HasPermission("VIEW_ACTIVITY_LOGS")]
        public async Task<ActionResult> GetRecentActivityLogs(
            [FromQuery] int limit = 20)
        {
            if (limit < 1)
            {
                limit = 20;
            }

            if (limit > 100)
            {
                limit = 100;
            }

            var logs = await (
                from activity in _context.ActivityLogs
                join user in _context.Users
                    on activity.UserId equals user.UserId
                    into userJoin
                from user in userJoin.DefaultIfEmpty()
                orderby activity.CreatedAt descending
                select new
                {
                    activity.LogId,
                    activity.UserId,

                    UserName = user != null
                        ? user.FullName
                        : "System",

                    UserEmail = user != null
                        ? user.Email
                        : null,

                    activity.ActivityType,
                    activity.Description,
                    activity.CreatedAt
                }
            )
            .Take(limit)
            .ToListAsync();

            return Ok(logs);
        }


        // =========================================================
        // GET: api/activitylogs/types
        //
        // Returns available activity types for filters.
        // Requires VIEW_ACTIVITY_LOGS permission.
        // =========================================================
        [HttpGet("types")]
        [HasPermission("VIEW_ACTIVITY_LOGS")]
        public async Task<ActionResult> GetActivityTypes()
        {
            var types = await _context.ActivityLogs
                .Where(log =>
                    !string.IsNullOrWhiteSpace(log.ActivityType))
                .Select(log => log.ActivityType)
                .Distinct()
                .OrderBy(type => type)
                .ToListAsync();

            return Ok(types);
        }


        // =========================================================
        // GET: api/activitylogs/summary
        //
        // Useful for Super Admin/Admin dashboard.
        // Requires VIEW_ACTIVITY_LOGS permission.
        // =========================================================
        [HttpGet("summary")]
        [HasPermission("VIEW_ACTIVITY_LOGS")]
        public async Task<ActionResult> GetActivitySummary()
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);
            var lastSevenDays = today.AddDays(-6);

            var totalLogs =
                await _context.ActivityLogs.CountAsync();

            var todayLogs =
                await _context.ActivityLogs.CountAsync(log =>
                    log.CreatedAt >= today &&
                    log.CreatedAt < tomorrow);

            var lastSevenDaysLogs =
                await _context.ActivityLogs.CountAsync(log =>
                    log.CreatedAt >= lastSevenDays &&
                    log.CreatedAt < tomorrow);

            var topActivityTypes =
                await _context.ActivityLogs
                    .GroupBy(log => log.ActivityType)
                    .Select(group => new
                    {
                        ActivityType = group.Key,
                        Count = group.Count()
                    })
                    .OrderByDescending(item => item.Count)
                    .Take(10)
                    .ToListAsync();

            return Ok(new
            {
                totalLogs,
                todayLogs,
                lastSevenDaysLogs,
                topActivityTypes
            });
        }
    }
}
