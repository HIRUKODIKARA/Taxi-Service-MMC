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
    [HasPermission("VIEW_REPORTS")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }


        // =========================================================
        // GET: api/reports/dashboard
        // =========================================================
        [HttpGet("dashboard")]
        public async Task<ActionResult> GetDashboardReport()
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var totalBookings =
                await _context.Bookings.CountAsync();

            var todayBookings =
                await _context.Bookings.CountAsync(b =>
                    b.CreatedAt >= today &&
                    b.CreatedAt < tomorrow
                );

            var completedBookings =
                await _context.Bookings.CountAsync(b =>
                    b.BookingStatus == "COMPLETED"
                );

            var cancelledBookings =
                await _context.Bookings.CountAsync(b =>
                    b.BookingStatus == "CANCELLED"
                );

            var activeBookings =
                await _context.Bookings.CountAsync(b =>
                    b.BookingStatus == "WAITING_FOR_DRIVER" ||
                    b.BookingStatus == "ACCEPTED" ||
                    b.BookingStatus == "DRIVER_ARRIVING" ||
                    b.BookingStatus == "ON_RIDE"
                );

            var totalDrivers =
                await _context.Drivers.CountAsync();

            var approvedDrivers =
                await _context.Drivers.CountAsync(d =>
                    d.VerificationStatus == "APPROVED"
                );

            var availableDrivers =
                await _context.Drivers.CountAsync(d =>
                    d.VerificationStatus == "APPROVED" &&
                    d.OperationalStatus == "AVAILABLE"
                );

            var totalVehicles =
                await _context.Vehicles.CountAsync(v =>
                    v.AccountStatus == "ACTIVE"
                );

            var availableVehicles =
                await _context.Vehicles.CountAsync(v =>
                    v.AccountStatus == "ACTIVE" &&
                    v.OperationalStatus == "AVAILABLE"
                );

            var totalRevenue =
                await _context.Payments
                    .Where(p =>
                        p.PaymentStatus == "PAID"
                    )
                    .SumAsync(p =>
                        (decimal?)p.Amount
                    ) ?? 0;

            var todayRevenue =
                await _context.Payments
                    .Where(p =>
                        p.PaymentStatus == "PAID" &&
                        p.PaidAt != null &&
                        p.PaidAt >= today &&
                        p.PaidAt < tomorrow
                    )
                    .SumAsync(p =>
                        (decimal?)p.Amount
                    ) ?? 0;

            return Ok(new
            {
                bookings = new
                {
                    total = totalBookings,
                    today = todayBookings,
                    active = activeBookings,
                    completed = completedBookings,
                    cancelled = cancelledBookings
                },

                drivers = new
                {
                    total = totalDrivers,
                    approved = approvedDrivers,
                    available = availableDrivers
                },

                vehicles = new
                {
                    total = totalVehicles,
                    available = availableVehicles
                },

                revenue = new
                {
                    total = totalRevenue,
                    today = todayRevenue
                }
            });
        }


        // =========================================================
        // GET: api/reports/bookings
        //
        // Optional:
        // ?fromDate=2026-08-01
        // &toDate=2026-08-31
        // =========================================================
        [HttpGet("bookings")]
        public async Task<ActionResult> GetBookingReport(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate
        )
        {
            var query =
                _context.Bookings.AsQueryable();

            if (fromDate.HasValue)
            {
                query = query.Where(b =>
                    b.CreatedAt >= fromDate.Value.Date
                );
            }

            if (toDate.HasValue)
            {
                var endDate =
                    toDate.Value.Date.AddDays(1);

                query = query.Where(b =>
                    b.CreatedAt < endDate
                );
            }

            var total =
                await query.CountAsync();

            var byStatus =
                await query
                    .GroupBy(b =>
                        b.BookingStatus
                    )
                    .Select(group => new
                    {
                        status = group.Key,
                        count = group.Count()
                    })
                    .OrderByDescending(x =>
                        x.count
                    )
                    .ToListAsync();

            var bySource =
                await query
                    .GroupBy(b =>
                        b.BookingSource
                    )
                    .Select(group => new
                    {
                        source = group.Key,
                        count = group.Count()
                    })
                    .OrderByDescending(x =>
                        x.count
                    )
                    .ToListAsync();

            var byVehicleType =
                await (
                    from booking in query

                    join vehicleType
                        in _context.VehicleTypes

                    on booking.VehicleTypeId
                        equals vehicleType.VehicleTypeId

                    group booking by new
                    {
                        vehicleType.VehicleTypeId,
                        vehicleType.TypeName
                    }
                    into groupData

                    orderby
                        groupData.Count()
                        descending

                    select new
                    {
                        vehicleTypeId =
                            groupData.Key.VehicleTypeId,

                        vehicleType =
                            groupData.Key.TypeName,

                        count =
                            groupData.Count()
                    }
                )
                .ToListAsync();

            return Ok(new
            {
                total,
                byStatus,
                bySource,
                byVehicleType
            });
        }


        // =========================================================
        // GET: api/reports/revenue
        // =========================================================
        [HttpGet("revenue")]
        public async Task<ActionResult> GetRevenueReport(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate
        )
        {
            var query =
                _context.Payments
                    .Where(p =>
                        p.PaymentStatus == "PAID"
                    );

            if (fromDate.HasValue)
            {
                query = query.Where(p =>
                    p.PaidAt != null &&
                    p.PaidAt >= fromDate.Value.Date
                );
            }

            if (toDate.HasValue)
            {
                var endDate =
                    toDate.Value.Date.AddDays(1);

                query = query.Where(p =>
                    p.PaidAt != null &&
                    p.PaidAt < endDate
                );
            }

            var totalRevenue =
                await query
                    .SumAsync(p =>
                        (decimal?)p.Amount
                    ) ?? 0;

            var totalPaidBookings =
                await query.CountAsync();

            var byPaymentMethod =
                await query
                    .GroupBy(p =>
                        p.PaymentMethod
                    )
                    .Select(group => new
                    {
                        paymentMethod =
                            group.Key,

                        transactionCount =
                            group.Count(),

                        amount =
                            group.Sum(p =>
                                p.Amount
                            )
                    })
                    .OrderByDescending(x =>
                        x.amount
                    )
                    .ToListAsync();

            return Ok(new
            {
                totalRevenue,
                totalPaidBookings,
                byPaymentMethod
            });
        }


        // =========================================================
        // GET: api/reports/drivers
        // =========================================================
        [HttpGet("drivers")]
        public async Task<ActionResult> GetDriverReport()
        {
            var totalDrivers =
                await _context.Drivers.CountAsync();


            // -----------------------------------------------------
            // Verification Status Summary
            // -----------------------------------------------------

            var byVerificationStatus =
                await _context.Drivers
                    .GroupBy(d =>
                        d.VerificationStatus
                    )
                    .Select(group => new
                    {
                        status = group.Key,
                        count = group.Count()
                    })
                    .OrderByDescending(x =>
                        x.count
                    )
                    .ToListAsync();


            // -----------------------------------------------------
            // Operational Status Summary
            // -----------------------------------------------------

            var byOperationalStatus =
                await _context.Drivers
                    .GroupBy(d =>
                        d.OperationalStatus
                    )
                    .Select(group => new
                    {
                        status = group.Key,
                        count = group.Count()
                    })
                    .OrderByDescending(x =>
                        x.count
                    )
                    .ToListAsync();


            // -----------------------------------------------------
            // Basic Driver Information
            // -----------------------------------------------------

            var drivers =
                await (
                    from driver
                        in _context.Drivers

                    join user
                        in _context.Users

                    on driver.UserId
                        equals user.UserId

                    select new
                    {
                        driverId =
                            driver.DriverId,

                        driverName =
                            user.FullName,

                        verificationStatus =
                            driver.VerificationStatus,

                        operationalStatus =
                            driver.OperationalStatus
                    }
                )
                .ToListAsync();


            // -----------------------------------------------------
            // Completed Trips Grouped By Driver
            // -----------------------------------------------------

            var completedTrips =
                await _context.Bookings
                    .Where(b =>
                        b.AssignedDriverId != null &&
                        b.BookingStatus == "COMPLETED"
                    )
                    .GroupBy(b =>
                        b.AssignedDriverId
                    )
                    .Select(group => new
                    {
                        driverId =
                            group.Key,

                        count =
                            group.Count()
                    })
                    .ToListAsync();


            // -----------------------------------------------------
            // Driver Ratings Grouped By Driver
            // -----------------------------------------------------

            var driverRatings =
                await _context.Ratings
                    .GroupBy(r =>
                        r.DriverId
                    )
                    .Select(group => new
                    {
                        driverId =
                            group.Key,

                        averageRating =
                            group.Average(r =>
                                (double)r.RatingValue
                            ),

                        ratingCount =
                            group.Count()
                    })
                    .ToListAsync();


            // -----------------------------------------------------
            // Combine In Memory
            // -----------------------------------------------------

            var driverPerformance =
                drivers
                    .Select(driver =>
                    {
                        var tripData =
                            completedTrips
                                .FirstOrDefault(
                                    trip =>
                                        trip.driverId ==
                                        driver.driverId
                                );

                        var ratingData =
                            driverRatings
                                .FirstOrDefault(
                                    rating =>
                                        rating.driverId ==
                                        driver.driverId
                                );

                        return new
                        {
                            driverId =
                                driver.driverId,

                            driverName =
                                driver.driverName,

                            verificationStatus =
                                driver.verificationStatus,

                            operationalStatus =
                                driver.operationalStatus,

                            completedTrips =
                                tripData?.count ?? 0,

                            averageRating =
                                ratingData != null
                                    ? (double?)
                                        ratingData.averageRating
                                    : null,

                            ratingCount =
                                ratingData?.ratingCount ?? 0
                        };
                    })
                    .OrderByDescending(driver =>
                        driver.completedTrips
                    )
                    .ThenByDescending(driver =>
                        driver.averageRating ?? 0
                    )
                    .ToList();


            return Ok(new
            {
                totalDrivers,
                byVerificationStatus,
                byOperationalStatus,
                driverPerformance
            });
        }


        // =========================================================
        // GET: api/reports/vehicles
        // =========================================================
        [HttpGet("vehicles")]
        public async Task<ActionResult> GetVehicleReport()
        {
            var totalVehicles =
                await _context.Vehicles.CountAsync();

            var activeVehicles =
                await _context.Vehicles
                    .CountAsync(v =>
                        v.AccountStatus == "ACTIVE"
                    );

            var inactiveVehicles =
                await _context.Vehicles
                    .CountAsync(v =>
                        v.AccountStatus == "INACTIVE"
                    );

            var byOperationalStatus =
                await _context.Vehicles
                    .GroupBy(v =>
                        v.OperationalStatus
                    )
                    .Select(group => new
                    {
                        status = group.Key,
                        count = group.Count()
                    })
                    .OrderByDescending(x =>
                        x.count
                    )
                    .ToListAsync();

            var byVehicleType =
                await (
                    from vehicle
                        in _context.Vehicles

                    join vehicleType
                        in _context.VehicleTypes

                    on vehicle.VehicleTypeId
                        equals vehicleType.VehicleTypeId

                    group vehicle by new
                    {
                        vehicleType.VehicleTypeId,
                        vehicleType.TypeName
                    }
                    into groupData

                    orderby
                        groupData.Count()
                        descending

                    select new
                    {
                        vehicleTypeId =
                            groupData.Key.VehicleTypeId,

                        vehicleType =
                            groupData.Key.TypeName,

                        count =
                            groupData.Count()
                    }
                )
                .ToListAsync();

            return Ok(new
            {
                totalVehicles,
                activeVehicles,
                inactiveVehicles,
                byOperationalStatus,
                byVehicleType
            });
        }


        // =========================================================
        // GET: api/reports/ratings
        // =========================================================
        [HttpGet("ratings")]
        public async Task<ActionResult> GetRatingReport()
        {
            var totalRatings =
                await _context.Ratings.CountAsync();

            var averageRating =
                totalRatings > 0
                    ? await _context.Ratings
                        .AverageAsync(r =>
                            (double)r.RatingValue
                        )
                    : 0;

            var distribution =
                await _context.Ratings
                    .GroupBy(r =>
                        r.RatingValue
                    )
                    .Select(group => new
                    {
                        rating = group.Key,
                        count = group.Count()
                    })
                    .OrderByDescending(x =>
                        x.rating
                    )
                    .ToListAsync();

            return Ok(new
            {
                totalRatings,
                averageRating,
                distribution
            });
        }
    }
}