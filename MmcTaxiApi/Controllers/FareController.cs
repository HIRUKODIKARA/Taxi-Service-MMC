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
    public class FareController : ControllerBase
    {
        private const int WaitingGraceMinutes = 5;

        private readonly ApplicationDbContext _context;

        public FareController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var id)
                ? id
                : null;
        }

        // =========================================================
        // PASSENGER / SYSTEM FARE ESTIMATE
        // POST: api/fare/estimate
        // =========================================================
        [HttpPost("estimate")]
        public async Task<IActionResult> EstimateFare(
            [FromBody] FareModuleEstimateRequest request)
        {
            if (request.VehicleTypeId <= 0)
            {
                return BadRequest(new
                {
                    message = "A valid vehicle type is required."
                });
            }

            if (request.DistanceKm < 0)
            {
                return BadRequest(new
                {
                    message = "Distance cannot be negative."
                });
            }

            if (request.WaitingMinutes < 0)
            {
                return BadRequest(new
                {
                    message = "Waiting minutes cannot be negative."
                });
            }

            var setting = await _context.FareSettings
                .Include(x => x.FareSlabs)
                .FirstOrDefaultAsync(x =>
                    x.VehicleTypeId == request.VehicleTypeId &&
                    x.Status == "ACTIVE");

            if (setting == null)
            {
                return NotFound(new
                {
                    message =
                        "No active fare setting was found for this vehicle type."
                });
            }

            var distanceFare = CalculateDistanceFare(
                request.DistanceKm,
                setting.BaseDistanceKm,
                setting.BaseFare,
                setting.FareSlabs
                    .Where(x => x.IsActive)
                    .OrderBy(x => x.SortOrder)
                    .ToList()
            );

            decimal routeDiscountAmount = 0m;
            SpecialRouteDiscount? appliedRouteDiscount = null;

            if (request.PickupOperationalAreaId.HasValue &&
                request.DestinationOperationalAreaId.HasValue &&
                request.PickupOperationalAreaId.Value !=
                request.DestinationOperationalAreaId.Value)
            {
                var fromId = request.PickupOperationalAreaId.Value;
                var toId = request.DestinationOperationalAreaId.Value;

                appliedRouteDiscount = await _context.SpecialRouteDiscounts
                    .Where(x => x.Status == "ACTIVE")
                    .FirstOrDefaultAsync(x =>
                        (x.FromOperationalAreaId == fromId &&
                         x.ToOperationalAreaId == toId) ||
                        (x.BothDirections &&
                         x.FromOperationalAreaId == toId &&
                         x.ToOperationalAreaId == fromId));

                if (appliedRouteDiscount != null)
                {
                    routeDiscountAmount = CalculateDiscount(
                        distanceFare,
                        appliedRouteDiscount.DiscountType,
                        appliedRouteDiscount.DiscountValue
                    );
                }
            }

            // Route discounts apply only to the distance fare.
            var discountedDistanceFare =
                Math.Max(0m, distanceFare - routeDiscountAmount);

            // First 5 minutes are free.
            var chargeableWaitingMinutes =
                Math.Max(0m, request.WaitingMinutes - WaitingGraceMinutes);

            var waitingCharge =
                chargeableWaitingMinutes *
                setting.WaitingChargePerMinute;

            var finalFare =
                discountedDistanceFare + waitingCharge;

            var driverShare =
                finalFare *
                (setting.DriverPercentage / 100m);

            var mmcShare =
                finalFare *
                (setting.MmcPercentage / 100m);

            return Ok(new
            {
                vehicleTypeId = setting.VehicleTypeId,
                distanceKm = Round2(request.DistanceKm),
                baseDistanceKm = setting.BaseDistanceKm,
                baseFare = setting.BaseFare,
                distanceFare = Round2(distanceFare),

                routeDiscountApplied =
                    appliedRouteDiscount != null,

                routeDiscount =
                    appliedRouteDiscount == null
                        ? null
                        : new
                        {
                            specialRouteDiscountId =
                                appliedRouteDiscount
                                    .SpecialRouteDiscountId,

                            discountType =
                                appliedRouteDiscount
                                    .DiscountType,

                            discountValue =
                                appliedRouteDiscount
                                    .DiscountValue,

                            discountAmount =
                                Round2(routeDiscountAmount)
                        },

                estimatedFare =
                    Round2(discountedDistanceFare),

                waitingMinutes =
                    Round2(request.WaitingMinutes),

                waitingGraceMinutes =
                    WaitingGraceMinutes,

                chargeableWaitingMinutes =
                    Round2(chargeableWaitingMinutes),

                waitingChargePerMinute =
                    setting.WaitingChargePerMinute,

                waitingCharge =
                    Round2(waitingCharge),

                finalFare =
                    Round2(finalFare),

                driverPercentage =
                    setting.DriverPercentage,

                mmcPercentage =
                    setting.MmcPercentage,

                driverShare =
                    Round2(driverShare),

                mmcShare =
                    Round2(mmcShare),

                message =
                    appliedRouteDiscount != null
                        ? "Special MMC route discount applied."
                        : null
            });
        }

        // =========================================================
        // PASSENGER: ESTIMATE ALL ACTIVE VEHICLE TYPES
        // POST: api/fare/estimate-all
        // =========================================================
        [HttpPost("estimate-all")]
        public async Task<IActionResult> EstimateAllVehicleFares(
            [FromBody] FareModuleEstimateAllRequest request)
        {
            if (request.DistanceKm < 0)
            {
                return BadRequest(new
                {
                    message = "Distance cannot be negative."
                });
            }

            var settings = await _context.FareSettings
                .Include(x => x.FareSlabs)
                .Where(x => x.Status == "ACTIVE")
                .ToListAsync();

            var vehicleTypes = await _context.VehicleTypes
                .Where(v => v.Status == "ACTIVE")
                .ToDictionaryAsync(
                    v => v.VehicleTypeId,
                    v => v.TypeName
                );

            var results = new List<object>();

            foreach (var setting in settings)
            {
                if (!vehicleTypes.TryGetValue(
                        setting.VehicleTypeId,
                        out var typeName))
                {
                    continue;
                }

                var distanceFare = CalculateDistanceFare(
                    request.DistanceKm,
                    setting.BaseDistanceKm,
                    setting.BaseFare,
                    setting.FareSlabs
                        .Where(x => x.IsActive)
                        .OrderBy(x => x.SortOrder)
                        .ToList()
                );

                decimal routeDiscountAmount = 0m;
                SpecialRouteDiscount? routeDiscount = null;

                if (request.PickupOperationalAreaId.HasValue &&
                    request.DestinationOperationalAreaId.HasValue &&
                    request.PickupOperationalAreaId.Value !=
                    request.DestinationOperationalAreaId.Value)
                {
                    var fromId =
                        request.PickupOperationalAreaId.Value;

                    var toId =
                        request.DestinationOperationalAreaId.Value;

                    routeDiscount =
                        await _context.SpecialRouteDiscounts
                            .Where(x => x.Status == "ACTIVE")
                            .FirstOrDefaultAsync(x =>
                                (x.FromOperationalAreaId == fromId &&
                                 x.ToOperationalAreaId == toId) ||
                                (x.BothDirections &&
                                 x.FromOperationalAreaId == toId &&
                                 x.ToOperationalAreaId == fromId));

                    if (routeDiscount != null)
                    {
                        routeDiscountAmount =
                            CalculateDiscount(
                                distanceFare,
                                routeDiscount.DiscountType,
                                routeDiscount.DiscountValue
                            );
                    }
                }

                var estimatedFare =
                    Math.Max(
                        0m,
                        distanceFare -
                        routeDiscountAmount
                    );

                results.Add(new
                {
                    vehicleTypeId =
                        setting.VehicleTypeId,

                    vehicleTypeName =
                        typeName,

                    distanceKm =
                        Round2(request.DistanceKm),

                    normalFare =
                        Round2(distanceFare),

                    routeDiscountApplied =
                        routeDiscount != null,

                    routeDiscountAmount =
                        Round2(routeDiscountAmount),

                    estimatedFare =
                        Round2(estimatedFare),

                    waitingGraceMinutes =
                        WaitingGraceMinutes,

                    waitingChargePerMinute =
                        setting.WaitingChargePerMinute,

                    driverPercentage =
                        setting.DriverPercentage,

                    mmcPercentage =
                        setting.MmcPercentage,

                    message =
                        routeDiscount != null
                            ? "Special MMC route discount applied."
                            : null
                });
            }

            return Ok(results);
        }

        // =========================================================
        // SUPER ADMIN: GET ALL FARE SETTINGS
        // GET: api/fare/admin/settings
        // =========================================================
        [HttpGet("admin/settings")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> GetFareSettings()
        {
            var settings = await _context.FareSettings
                .Include(x => x.FareSlabs)
                .OrderBy(x => x.VehicleTypeId)
                .ToListAsync();

            var vehicleTypes = await _context.VehicleTypes
                .ToDictionaryAsync(
                    x => x.VehicleTypeId,
                    x => x.TypeName
                );

            var result = settings.Select(setting => new
            {
                fareSettingId =
                    setting.FareSettingId,

                vehicleTypeId =
                    setting.VehicleTypeId,

                vehicleTypeName =
                    vehicleTypes.TryGetValue(
                        setting.VehicleTypeId,
                        out var typeName)
                        ? typeName
                        : $"Vehicle #{setting.VehicleTypeId}",

                baseDistanceKm =
                    setting.BaseDistanceKm,

                baseFare =
                    setting.BaseFare,

                waitingGraceMinutes =
                    WaitingGraceMinutes,

                waitingChargePerMinute =
                    setting.WaitingChargePerMinute,

                driverPercentage =
                    setting.DriverPercentage,

                mmcPercentage =
                    setting.MmcPercentage,

                status =
                    setting.Status,

                updatedByUserId =
                    setting.UpdatedByUserId,

                createdAt =
                    setting.CreatedAt,

                updatedAt =
                    setting.UpdatedAt,

                slabs =
                    setting.FareSlabs
                        .OrderBy(x => x.SortOrder)
                        .Select(x => new
                        {
                            fareSlabId =
                                x.FareSlabId,

                            fromKm =
                                x.FromKm,

                            toKm =
                                x.ToKm,

                            ratePerKm =
                                x.RatePerKm,

                            sortOrder =
                                x.SortOrder,

                            isActive =
                                x.IsActive
                        })
            });

            return Ok(result);
        }

        // =========================================================
        // SUPER ADMIN: UPDATE ONE VEHICLE FARE SETTING
        // PUT: api/fare/admin/settings/{vehicleTypeId}
        // =========================================================
        [HttpPut("admin/settings/{vehicleTypeId:int}")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> UpdateFareSetting(
            int vehicleTypeId,
            [FromBody] FareModuleUpdateSettingRequest request)
        {
            if (vehicleTypeId <= 0)
            {
                return BadRequest(new
                {
                    message = "Invalid vehicle type."
                });
            }

            if (request.BaseDistanceKm < 0 ||
                request.BaseFare < 0 ||
                request.WaitingChargePerMinute < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Fare values cannot be negative."
                });
            }

            if (request.DriverPercentage < 0 ||
                request.MmcPercentage < 0 ||
                request.DriverPercentage > 100 ||
                request.MmcPercentage > 100)
            {
                return BadRequest(new
                {
                    message =
                        "Driver/MMC percentages must be between 0 and 100."
                });
            }

            if (Round2(
                    request.DriverPercentage +
                    request.MmcPercentage) != 100m)
            {
                return BadRequest(new
                {
                    message =
                        "Driver percentage + MMC percentage must equal 100%."
                });
            }

            var vehicleExists =
                await _context.VehicleTypes
                    .AnyAsync(x =>
                        x.VehicleTypeId ==
                        vehicleTypeId);

            if (!vehicleExists)
            {
                return NotFound(new
                {
                    message =
                        "Vehicle type was not found."
                });
            }

            var invalidSlab =
                request.Slabs.Any(s =>
                    s.FromKm < 0 ||
                    s.RatePerKm < 0 ||
                    (s.ToKm.HasValue &&
                     s.ToKm.Value <= s.FromKm));

            if (invalidSlab)
            {
                return BadRequest(new
                {
                    message =
                        "One or more fare slabs are invalid."
                });
            }

            var status =
                NormalizeStatus(request.Status);

            if (status == null)
            {
                return BadRequest(new
                {
                    message =
                        "Status must be ACTIVE or INACTIVE."
                });
            }

            var setting =
                await _context.FareSettings
                    .Include(x => x.FareSlabs)
                    .FirstOrDefaultAsync(x =>
                        x.VehicleTypeId ==
                        vehicleTypeId);

            var now = DateTime.Now;
            var currentUserId =
                GetCurrentUserId();

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                if (setting == null)
                {
                    setting = new FareSetting
                    {
                        VehicleTypeId =
                            vehicleTypeId,

                        CreatedAt =
                            now
                    };

                    _context.FareSettings.Add(
                        setting
                    );

                    await _context.SaveChangesAsync();
                }

                setting.BaseDistanceKm =
                    Round2(request.BaseDistanceKm);

                setting.BaseFare =
                    Round2(request.BaseFare);

                setting.WaitingChargePerMinute =
                    Round2(
                        request
                            .WaitingChargePerMinute
                    );

                setting.DriverPercentage =
                    Round2(
                        request
                            .DriverPercentage
                    );

                setting.MmcPercentage =
                    Round2(
                        request
                            .MmcPercentage
                    );

                setting.Status =
                    status;

                setting.UpdatedByUserId =
                    currentUserId;

                setting.UpdatedAt =
                    now;

                if (setting.CreatedAt == default)
                {
                    setting.CreatedAt =
                        now;
                }

                _context.FareSlabs.RemoveRange(
                    setting.FareSlabs
                );

                await _context.SaveChangesAsync();

                foreach (var slab in
                         request.Slabs
                             .OrderBy(x =>
                                 x.SortOrder))
                {
                    _context.FareSlabs.Add(
                        new FareSlab
                        {
                            FareSettingId =
                                setting.FareSettingId,

                            FromKm =
                                Round2(
                                    slab.FromKm
                                ),

                            ToKm =
                                slab.ToKm.HasValue
                                    ? Round2(
                                        slab.ToKm.Value
                                    )
                                    : null,

                            RatePerKm =
                                Round2(
                                    slab.RatePerKm
                                ),

                            SortOrder =
                                slab.SortOrder,

                            IsActive =
                                slab.IsActive
                        }
                    );
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        "Fare setting updated successfully.",

                    vehicleTypeId =
                        setting.VehicleTypeId,

                    waitingGraceMinutes =
                        WaitingGraceMinutes
                });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // =========================================================
        // SUPER ADMIN: SPECIAL ROUTE DISCOUNTS
        // =========================================================

        [HttpGet("admin/route-discounts")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> GetRouteDiscounts()
        {
            var areas =
                await _context.OperationalAreas
                    .ToDictionaryAsync(
                        x => x.OperationalAreaId,
                        x => x.AreaName
                    );

            var items =
                await _context.SpecialRouteDiscounts
                    .OrderByDescending(x => x.UpdatedAt)
                    .ThenByDescending(x => x.CreatedAt)
                    .ToListAsync();

            var result = items.Select(x => new
            {
                specialRouteDiscountId =
                    x.SpecialRouteDiscountId,

                fromOperationalAreaId =
                    x.FromOperationalAreaId,

                fromAreaName =
                    areas.TryGetValue(
                        x.FromOperationalAreaId,
                        out var fromName)
                        ? fromName
                        : $"Area #{x.FromOperationalAreaId}",

                toOperationalAreaId =
                    x.ToOperationalAreaId,

                toAreaName =
                    areas.TryGetValue(
                        x.ToOperationalAreaId,
                        out var toName)
                        ? toName
                        : $"Area #{x.ToOperationalAreaId}",

                discountType =
                    x.DiscountType,

                discountValue =
                    x.DiscountValue,

                bothDirections =
                    x.BothDirections,

                status =
                    x.Status,

                createdByUserId =
                    x.CreatedByUserId,

                createdAt =
                    x.CreatedAt,

                updatedAt =
                    x.UpdatedAt
            });

            return Ok(result);
        }

        [HttpPost("admin/route-discounts")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> CreateRouteDiscount(
            [FromBody] FareModuleSaveRouteDiscountRequest request)
        {
            var validation =
                await ValidateRouteDiscountRequest(request);

            if (validation != null)
            {
                return validation;
            }

            var now = DateTime.Now;

            var item = new SpecialRouteDiscount
            {
                FromOperationalAreaId =
                    request.FromOperationalAreaId,

                ToOperationalAreaId =
                    request.ToOperationalAreaId,

                DiscountType =
                    request.DiscountType
                        .Trim()
                        .ToUpperInvariant(),

                DiscountValue =
                    Round2(request.DiscountValue),

                BothDirections =
                    request.BothDirections,

                Status =
                    request.Status
                        .Trim()
                        .ToUpperInvariant(),

                CreatedByUserId =
                    GetCurrentUserId(),

                CreatedAt =
                    now,

                UpdatedAt =
                    now
            };

            _context.SpecialRouteDiscounts.Add(item);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Special route discount created successfully.",

                item
            });
        }

        [HttpPut("admin/route-discounts/{id:int}")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> UpdateRouteDiscount(
            int id,
            [FromBody] FareModuleSaveRouteDiscountRequest request)
        {
            var item =
                await _context.SpecialRouteDiscounts
                    .FindAsync(id);

            if (item == null)
            {
                return NotFound(new
                {
                    message =
                        "Special route discount was not found."
                });
            }

            var validation =
                await ValidateRouteDiscountRequest(request);

            if (validation != null)
            {
                return validation;
            }

            item.FromOperationalAreaId =
                request.FromOperationalAreaId;

            item.ToOperationalAreaId =
                request.ToOperationalAreaId;

            item.DiscountType =
                request.DiscountType
                    .Trim()
                    .ToUpperInvariant();

            item.DiscountValue =
                Round2(request.DiscountValue);

            item.BothDirections =
                request.BothDirections;

            item.Status =
                request.Status
                    .Trim()
                    .ToUpperInvariant();

            item.UpdatedAt =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Special route discount updated successfully.",

                item
            });
        }

        [HttpPut("admin/route-discounts/{id:int}/toggle")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> ToggleRouteDiscount(
            int id)
        {
            var item =
                await _context.SpecialRouteDiscounts
                    .FindAsync(id);

            if (item == null)
            {
                return NotFound(new
                {
                    message =
                        "Special route discount was not found."
                });
            }

            item.Status =
                item.Status == "ACTIVE"
                    ? "INACTIVE"
                    : "ACTIVE";

            item.UpdatedAt =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    $"Route discount is now {item.Status}.",

                item
            });
        }

        [HttpDelete("admin/route-discounts/{id:int}")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> DeleteRouteDiscount(
            int id)
        {
            var item =
                await _context.SpecialRouteDiscounts
                    .FindAsync(id);

            if (item == null)
            {
                return NotFound(new
                {
                    message =
                        "Special route discount was not found."
                });
            }

            _context.SpecialRouteDiscounts.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Special route discount deleted successfully."
            });
        }

        // =========================================================
        // SUPER ADMIN: OFFERS
        // NOTE:
        // Offers are manageable here, but are NOT automatically
        // applied to fare calculations yet because customer/offer
        // eligibility rules are not finalized.
        // =========================================================

        [HttpGet("admin/offers")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> GetOffers()
        {
            var items =
                await _context.Offers
                    .OrderByDescending(x => x.UpdatedAt)
                    .ThenByDescending(x => x.CreatedAt)
                    .ToListAsync();

            return Ok(items);
        }

        [HttpPost("admin/offers")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> CreateOffer(
            [FromBody] FareModuleSaveOfferRequest request)
        {
            var validation =
                await ValidateOfferRequest(request);

            if (validation != null)
            {
                return validation;
            }

            var now = DateTime.Now;

            var item = new Offer
            {
                OfferName =
                    request.OfferName.Trim(),

                Description =
                    string.IsNullOrWhiteSpace(
                        request.Description)
                        ? null
                        : request.Description.Trim(),

                DiscountType =
                    request.DiscountType
                        .Trim()
                        .ToUpperInvariant(),

                DiscountValue =
                    Round2(request.DiscountValue),

                VehicleTypeId =
                    request.VehicleTypeId,

                FromOperationalAreaId =
                    request.FromOperationalAreaId,

                ToOperationalAreaId =
                    request.ToOperationalAreaId,

                CustomerType =
                    string.IsNullOrWhiteSpace(
                        request.CustomerType)
                        ? "ALL"
                        : request.CustomerType
                            .Trim()
                            .ToUpperInvariant(),

                MinimumFare =
                    request.MinimumFare.HasValue
                        ? Round2(
                            request.MinimumFare.Value)
                        : null,

                StartAt =
                    request.StartAt,

                EndAt =
                    request.EndAt,

                Status =
                    request.Status
                        .Trim()
                        .ToUpperInvariant(),

                CreatedByUserId =
                    GetCurrentUserId(),

                CreatedAt =
                    now,

                UpdatedAt =
                    now
            };

            _context.Offers.Add(item);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Offer created successfully.",

                item
            });
        }

        [HttpPut("admin/offers/{id:int}")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> UpdateOffer(
            int id,
            [FromBody] FareModuleSaveOfferRequest request)
        {
            var item =
                await _context.Offers.FindAsync(id);

            if (item == null)
            {
                return NotFound(new
                {
                    message = "Offer was not found."
                });
            }

            var validation =
                await ValidateOfferRequest(request);

            if (validation != null)
            {
                return validation;
            }

            item.OfferName =
                request.OfferName.Trim();

            item.Description =
                string.IsNullOrWhiteSpace(
                    request.Description)
                    ? null
                    : request.Description.Trim();

            item.DiscountType =
                request.DiscountType
                    .Trim()
                    .ToUpperInvariant();

            item.DiscountValue =
                Round2(request.DiscountValue);

            item.VehicleTypeId =
                request.VehicleTypeId;

            item.FromOperationalAreaId =
                request.FromOperationalAreaId;

            item.ToOperationalAreaId =
                request.ToOperationalAreaId;

            item.CustomerType =
                string.IsNullOrWhiteSpace(
                    request.CustomerType)
                    ? "ALL"
                    : request.CustomerType
                        .Trim()
                        .ToUpperInvariant();

            item.MinimumFare =
                request.MinimumFare.HasValue
                    ? Round2(
                        request.MinimumFare.Value)
                    : null;

            item.StartAt =
                request.StartAt;

            item.EndAt =
                request.EndAt;

            item.Status =
                request.Status
                    .Trim()
                    .ToUpperInvariant();

            item.UpdatedAt =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Offer updated successfully.",

                item
            });
        }

        [HttpPut("admin/offers/{id:int}/toggle")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> ToggleOffer(
            int id)
        {
            var item =
                await _context.Offers.FindAsync(id);

            if (item == null)
            {
                return NotFound(new
                {
                    message = "Offer was not found."
                });
            }

            item.Status =
                item.Status == "ACTIVE"
                    ? "INACTIVE"
                    : "ACTIVE";

            item.UpdatedAt =
                DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    $"Offer is now {item.Status}.",

                item
            });
        }

        [HttpDelete("admin/offers/{id:int}")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> DeleteOffer(
            int id)
        {
            var item =
                await _context.Offers.FindAsync(id);

            if (item == null)
            {
                return NotFound(new
                {
                    message = "Offer was not found."
                });
            }

            _context.Offers.Remove(item);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Offer deleted successfully."
            });
        }

        // =========================================================
        // VALIDATION HELPERS
        // =========================================================

        private async Task<IActionResult?> ValidateRouteDiscountRequest(
            FareModuleSaveRouteDiscountRequest request)
        {
            if (request.FromOperationalAreaId <= 0 ||
                request.ToOperationalAreaId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "From Area and To Area are required."
                });
            }

            if (request.FromOperationalAreaId ==
                request.ToOperationalAreaId)
            {
                return BadRequest(new
                {
                    message =
                        "From Area and To Area must be different."
                });
            }

            var areasExist =
                await _context.OperationalAreas.CountAsync(
                    x =>
                        x.OperationalAreaId ==
                            request.FromOperationalAreaId ||
                        x.OperationalAreaId ==
                            request.ToOperationalAreaId
                ) == 2;

            if (!areasExist)
            {
                return BadRequest(new
                {
                    message =
                        "One or both operational areas do not exist."
                });
            }

            var discountType =
                (request.DiscountType ?? "")
                    .Trim()
                    .ToUpperInvariant();

            if (discountType != "PERCENTAGE" &&
                discountType != "FIXED")
            {
                return BadRequest(new
                {
                    message =
                        "Discount type must be PERCENTAGE or FIXED."
                });
            }

            if (request.DiscountValue <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Discount value must be greater than 0."
                });
            }

            if (discountType == "PERCENTAGE" &&
                request.DiscountValue > 100)
            {
                return BadRequest(new
                {
                    message =
                        "Percentage discount cannot exceed 100%."
                });
            }

            var status =
                NormalizeStatus(request.Status);

            if (status == null)
            {
                return BadRequest(new
                {
                    message =
                        "Status must be ACTIVE or INACTIVE."
                });
            }

            request.DiscountType =
                discountType;

            request.Status =
                status;

            return null;
        }

        private async Task<IActionResult?> ValidateOfferRequest(
            FareModuleSaveOfferRequest request)
        {
            if (string.IsNullOrWhiteSpace(
                    request.OfferName))
            {
                return BadRequest(new
                {
                    message =
                        "Offer name is required."
                });
            }

            var discountType =
                (request.DiscountType ?? "")
                    .Trim()
                    .ToUpperInvariant();

            if (discountType != "PERCENTAGE" &&
                discountType != "FIXED")
            {
                return BadRequest(new
                {
                    message =
                        "Discount type must be PERCENTAGE or FIXED."
                });
            }

            if (request.DiscountValue <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "Discount value must be greater than 0."
                });
            }

            if (discountType == "PERCENTAGE" &&
                request.DiscountValue > 100)
            {
                return BadRequest(new
                {
                    message =
                        "Percentage discount cannot exceed 100%."
                });
            }

            if (request.MinimumFare.HasValue &&
                request.MinimumFare.Value < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Minimum fare cannot be negative."
                });
            }

            if (request.StartAt.HasValue &&
                request.EndAt.HasValue &&
                request.EndAt.Value <
                request.StartAt.Value)
            {
                return BadRequest(new
                {
                    message =
                        "Offer end date cannot be earlier than the start date."
                });
            }

            if (request.VehicleTypeId.HasValue)
            {
                var vehicleExists =
                    await _context.VehicleTypes.AnyAsync(
                        x =>
                            x.VehicleTypeId ==
                            request.VehicleTypeId.Value
                    );

                if (!vehicleExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "Selected vehicle type does not exist."
                    });
                }
            }

            if (request.FromOperationalAreaId.HasValue)
            {
                var fromExists =
                    await _context.OperationalAreas.AnyAsync(
                        x =>
                            x.OperationalAreaId ==
                            request.FromOperationalAreaId.Value
                    );

                if (!fromExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "Selected From Area does not exist."
                    });
                }
            }

            if (request.ToOperationalAreaId.HasValue)
            {
                var toExists =
                    await _context.OperationalAreas.AnyAsync(
                        x =>
                            x.OperationalAreaId ==
                            request.ToOperationalAreaId.Value
                    );

                if (!toExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "Selected To Area does not exist."
                    });
                }
            }

            if (request.FromOperationalAreaId.HasValue &&
                request.ToOperationalAreaId.HasValue &&
                request.FromOperationalAreaId.Value ==
                request.ToOperationalAreaId.Value)
            {
                return BadRequest(new
                {
                    message =
                        "Offer From Area and To Area must be different."
                });
            }

            var status =
                NormalizeStatus(request.Status);

            if (status == null)
            {
                return BadRequest(new
                {
                    message =
                        "Status must be ACTIVE or INACTIVE."
                });
            }

            request.DiscountType =
                discountType;

            request.Status =
                status;

            return null;
        }

        // =========================================================
        // FARE HELPERS
        // =========================================================

        private static decimal CalculateDistanceFare(
            decimal distanceKm,
            decimal baseDistanceKm,
            decimal baseFare,
            List<FareSlab> slabs)
        {
            if (distanceKm <= baseDistanceKm)
            {
                return baseFare;
            }

            decimal fare = baseFare;

            foreach (var slab in slabs)
            {
                if (distanceKm <= slab.FromKm)
                {
                    continue;
                }

                var upper =
                    slab.ToKm.HasValue
                        ? Math.Min(
                            distanceKm,
                            slab.ToKm.Value
                        )
                        : distanceKm;

                var chargeableKm =
                    upper - slab.FromKm;

                if (chargeableKm > 0)
                {
                    fare +=
                        chargeableKm *
                        slab.RatePerKm;
                }
            }

            return fare;
        }

        private static decimal CalculateDiscount(
            decimal amount,
            string discountType,
            decimal discountValue)
        {
            var type =
                (discountType ?? "")
                    .Trim()
                    .ToUpperInvariant();

            if (type == "FIXED")
            {
                return Math.Min(
                    amount,
                    Math.Max(
                        0m,
                        discountValue
                    )
                );
            }

            if (type == "PERCENTAGE")
            {
                var percentage =
                    Math.Clamp(
                        discountValue,
                        0m,
                        100m
                    );

                return amount *
                       (percentage / 100m);
            }

            return 0m;
        }

        private static string? NormalizeStatus(
            string? status)
        {
            var value =
                (status ?? "")
                    .Trim()
                    .ToUpperInvariant();

            return value == "ACTIVE" ||
                   value == "INACTIVE"
                ? value
                : null;
        }

        private static decimal Round2(
            decimal value)
        {
            return Math.Round(
                value,
                2,
                MidpointRounding.AwayFromZero
            );
        }
    }

    // =============================================================
    // REQUEST MODELS
    // =============================================================

    public class FareModuleEstimateRequest
    {
        public int VehicleTypeId { get; set; }

        public decimal DistanceKm { get; set; }

        public decimal WaitingMinutes { get; set; } = 0m;

        public int? PickupOperationalAreaId { get; set; }

        public int? DestinationOperationalAreaId { get; set; }
    }

    public class FareModuleEstimateAllRequest
    {
        public decimal DistanceKm { get; set; }

        public int? PickupOperationalAreaId { get; set; }

        public int? DestinationOperationalAreaId { get; set; }
    }

    public class FareModuleUpdateSettingRequest
    {
        public decimal BaseDistanceKm { get; set; }

        public decimal BaseFare { get; set; }

        public decimal WaitingChargePerMinute { get; set; }

        public decimal DriverPercentage { get; set; }

        public decimal MmcPercentage { get; set; }

        public string Status { get; set; } = "ACTIVE";

        public List<FareModuleSlabRequest> Slabs { get; set; } =
            new List<FareModuleSlabRequest>();
    }

    public class FareModuleSlabRequest
    {
        public decimal FromKm { get; set; }

        public decimal? ToKm { get; set; }

        public decimal RatePerKm { get; set; }

        public int SortOrder { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class FareModuleSaveRouteDiscountRequest
    {
        public int FromOperationalAreaId { get; set; }

        public int ToOperationalAreaId { get; set; }

        public string DiscountType { get; set; } =
            "PERCENTAGE";

        public decimal DiscountValue { get; set; }

        public bool BothDirections { get; set; } =
            true;

        public string Status { get; set; } =
            "ACTIVE";
    }

    public class FareModuleSaveOfferRequest
    {
        public string OfferName { get; set; } =
            string.Empty;

        public string? Description { get; set; }

        public string DiscountType { get; set; } =
            "PERCENTAGE";

        public decimal DiscountValue { get; set; }

        public int? VehicleTypeId { get; set; }

        public int? FromOperationalAreaId { get; set; }

        public int? ToOperationalAreaId { get; set; }

        public string CustomerType { get; set; } =
            "ALL";

        public decimal? MinimumFare { get; set; }

        public DateTime? StartAt { get; set; }

        public DateTime? EndAt { get; set; }

        public string Status { get; set; } =
            "INACTIVE";
    }
}
