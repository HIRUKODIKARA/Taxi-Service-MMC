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

        // =========================================================
        // USERS, ROLES & PERMISSIONS
        // =========================================================

        public DbSet<Role> Roles { get; set; }

        public DbSet<User> Users { get; set; }

        public DbSet<UserRole> UserRoles { get; set; }

        public DbSet<Permission> Permissions { get; set; }

        public DbSet<RolePermission> RolePermissions { get; set; }


        // =========================================================
        // PASSWORD RESET
        // =========================================================

        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }


        // =========================================================
        // VEHICLES
        // =========================================================

        public DbSet<VehicleType> VehicleTypes { get; set; }

        public DbSet<Vehicle> Vehicles { get; set; }


        // =========================================================
        // DRIVERS
        // =========================================================

        public DbSet<Driver> Drivers { get; set; }

        public DbSet<DriverDocument> DriverDocuments { get; set; }

        public DbSet<DriverLocation> DriverLocations { get; set; }


        // =========================================================
        // BOOKINGS
        // =========================================================

        public DbSet<Booking> Bookings { get; set; }

        public DbSet<BookingStatusHistory> BookingStatusHistories { get; set; }


        // =========================================================
        // PAYMENTS
        // =========================================================

        public DbSet<Payment> Payments { get; set; }


        // =========================================================
        // RATINGS & FEEDBACK
        // =========================================================

        public DbSet<Rating> Ratings { get; set; }


        // =========================================================
        // NOTIFICATIONS
        // =========================================================

        public DbSet<Notification> Notifications { get; set; }


        // =========================================================
        // ACTIVITY LOGS
        // =========================================================

        public DbSet<ActivityLog> ActivityLogs { get; set; }


        // =========================================================
        // SYSTEM SETTINGS
        // =========================================================

        public DbSet<SystemSetting> SystemSettings { get; set; }


        // =========================================================
        // DATABASE TABLE MAPPING
        // =========================================================

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            // =====================================================
            // PERMISSIONS TABLE
            // =====================================================

            modelBuilder.Entity<Permission>(entity =>
            {
                entity.ToTable("permissions");

                entity.HasKey(p => p.PermissionId);

                entity.Property(p => p.PermissionId)
                    .HasColumnName("permission_id");

                entity.Property(p => p.PermissionName)
                    .HasColumnName("permission_name");

                entity.Property(p => p.Description)
                    .HasColumnName("description");

                entity.Property(p => p.CreatedAt)
                    .HasColumnName("created_at");
            });


            // =====================================================
            // ROLE PERMISSIONS TABLE
            // =====================================================

            modelBuilder.Entity<RolePermission>(entity =>
            {
                entity.ToTable("role_permissions");

                entity.HasKey(rp => rp.RolePermissionId);

                entity.Property(rp => rp.RolePermissionId)
                    .HasColumnName("role_permission_id");

                entity.Property(rp => rp.RoleId)
                    .HasColumnName("role_id");

                entity.Property(rp => rp.PermissionId)
                    .HasColumnName("permission_id");

                entity.HasIndex(rp => new
                {
                    rp.RoleId,
                    rp.PermissionId
                })
                .IsUnique();
            });


            // =====================================================
            // PASSWORD RESET TOKENS TABLE
            // =====================================================

            modelBuilder.Entity<PasswordResetToken>(entity =>
            {
                entity.ToTable("password_reset_tokens");

                entity.HasKey(prt =>
                    prt.PasswordResetTokenId);

                entity.Property(prt =>
                        prt.PasswordResetTokenId)
                    .HasColumnName(
                        "password_reset_token_id");

                entity.Property(prt => prt.UserId)
                    .HasColumnName("user_id");

                entity.Property(prt => prt.TokenHash)
                    .HasColumnName("token_hash")
                    .HasMaxLength(64)
                    .IsRequired();

                entity.Property(prt => prt.ExpiresAt)
                    .HasColumnName("expires_at");

                entity.Property(prt => prt.UsedAt)
                    .HasColumnName("used_at");

                entity.Property(prt => prt.CreatedAt)
                    .HasColumnName("created_at");

                entity.HasIndex(prt => prt.TokenHash)
                    .IsUnique();

                entity.HasIndex(prt => prt.UserId);

                entity.HasIndex(prt => prt.ExpiresAt);

                entity.HasOne(prt => prt.User)
                    .WithMany()
                    .HasForeignKey(prt => prt.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}