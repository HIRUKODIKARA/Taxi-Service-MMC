using Microsoft.EntityFrameworkCore;
using MmcTaxiApi.Models;

namespace MmcTaxiApi.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options
        ) : base(options)
        {
        }

        // Users & Roles
        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }

        // Vehicles
        public DbSet<VehicleType> VehicleTypes { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }

        // Drivers
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<DriverDocument> DriverDocuments { get; set; }
        public DbSet<DriverLocation> DriverLocations { get; set; }

        // Bookings
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<BookingStatusHistory> BookingStatusHistories { get; set; }

        // Payments
        public DbSet<Payment> Payments { get; set; }

        // Ratings & Feedback
        public DbSet<Rating> Ratings { get; set; }

        // Notifications
        public DbSet<Notification> Notifications { get; set; }

        // Activity Logs
        public DbSet<ActivityLog> ActivityLogs { get; set; }

        // System Settings
        public DbSet<SystemSetting> SystemSettings { get; set; }
    }
}