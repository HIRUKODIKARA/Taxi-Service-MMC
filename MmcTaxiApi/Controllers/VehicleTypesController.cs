using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MmcTaxiApi.Data;
using MmcTaxiApi.Models;

namespace MmcTaxiApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VehicleTypesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VehicleTypesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/vehicletypes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VehicleType>>> GetVehicleTypes()
        {
            var vehicleTypes = await _context.VehicleTypes.ToListAsync();
            return Ok(vehicleTypes);
        }
    }
}