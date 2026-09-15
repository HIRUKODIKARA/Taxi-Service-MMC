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
        public DbSet<VehiclePhoto> VehiclePhotos { get; set; }

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

        // NEW - booking requests sent to available drivers
        public DbSet<BookingDriverRequest> BookingDriverRequests { get; set; }

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
        // OPERATIONAL AREAS
        // =========================================================

        public DbSet<OperationalArea> OperationalAreas { get; set; }

        public DbSet<TaxiOperatorOperationalArea>
            TaxiOperatorOperationalAreas { get; set; }

        // =========================================================
        // FARE MANAGEMENT
        // =========================================================

        public DbSet<FareSetting> FareSettings { get; set; }
        public DbSet<FareSlab> FareSlabs { get; set; }
        public DbSet<SpecialRouteDiscount> SpecialRouteDiscounts { get; set; }
        public DbSet<Offer> Offers { get; set; }

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

            // =====================================================
            // VEHICLE PHOTOS TABLE
            // =====================================================

            modelBuilder.Entity<VehiclePhoto>(entity =>
            {
                entity.ToTable("vehicle_photos");

                entity.HasKey(vp => vp.VehiclePhotoId);

                entity.Property(vp => vp.VehiclePhotoId)
                    .HasColumnName("vehicle_photo_id");

                entity.Property(vp => vp.VehicleId)
                    .HasColumnName("vehicle_id");

                entity.Property(vp => vp.PhotoType)
                    .HasColumnName("photo_type")
                    .HasMaxLength(20)
                    .IsRequired();

                entity.Property(vp => vp.FilePath)
                    .HasColumnName("file_path")
                    .HasMaxLength(255)
                    .IsRequired();

                entity.Property(vp => vp.UploadedAt)
                    .HasColumnName("uploaded_at");

                entity.HasIndex(vp => vp.VehicleId);

                entity.HasOne<Vehicle>()
                    .WithMany()
                    .HasForeignKey(vp => vp.VehicleId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // =====================================================
            // TAXI OPERATOR OPERATIONAL AREAS TABLE
            // =====================================================

            modelBuilder.Entity<TaxiOperatorOperationalArea>(entity =>
            {
                entity.ToTable(
                    "TaxiOperatorOperationalAreas");

                entity.HasKey(x =>
                    x.TaxiOperatorOperationalAreaId);

                entity.Property(x =>
                        x.TaxiOperatorOperationalAreaId)
                    .HasColumnName(
                        "TaxiOperatorOperationalAreaId");

                entity.Property(x => x.UserId)
                    .HasColumnName("user_id");

                entity.Property(x =>
                        x.OperationalAreaId)
                    .HasColumnName(
                        "OperationalAreaId");

                entity.Property(x => x.IsActive)
                    .HasColumnName("IsActive");

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("CreatedAt");

                entity.Property(x => x.UpdatedAt)
                    .HasColumnName("UpdatedAt");

                entity.HasIndex(x => new
                {
                    x.UserId,
                    x.OperationalAreaId
                })
                .IsUnique();

                entity.HasOne(x => x.User)
                    .WithMany()
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x =>
                        x.OperationalArea)
                    .WithMany()
                    .HasForeignKey(x =>
                        x.OperationalAreaId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // =====================================================
            // BOOKING DRIVER REQUESTS TABLE
            // =====================================================

            modelBuilder.Entity<BookingDriverRequest>(entity =>
            {
                entity.ToTable("booking_driver_requests");

                entity.HasKey(x => x.RequestId);

                entity.Property(x => x.RequestId)
                    .HasColumnName("request_id");

                entity.Property(x => x.BookingId)
                    .HasColumnName("booking_id");

                entity.Property(x => x.DriverId)
                    .HasColumnName("driver_id");

                entity.Property(x => x.VehicleId)
                    .HasColumnName("vehicle_id");

                entity.Property(x => x.RequestStatus)
                    .HasColumnName("request_status")
                    .HasMaxLength(20)
                    .IsRequired();

                entity.Property(x => x.SentAt)
                    .HasColumnName("sent_at");

                entity.Property(x => x.RespondedAt)
                    .HasColumnName("responded_at");

                // One booking should only have one request
                // for the same driver.
                entity.HasIndex(x => new
                {
                    x.BookingId,
                    x.DriverId
                })
                .IsUnique();

                // Makes loading a driver's pending requests faster.
                entity.HasIndex(x => new
                {
                    x.DriverId,
                    x.RequestStatus
                });

                // BookingDriverRequest -> Booking
                entity.HasOne<Booking>()
                    .WithMany()
                    .HasForeignKey(x => x.BookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                // BookingDriverRequest -> Driver
                entity.HasOne<Driver>()
                    .WithMany()
                    .HasForeignKey(x => x.DriverId)
                    .OnDelete(DeleteBehavior.Restrict);

                // BookingDriverRequest -> Vehicle
                entity.HasOne<Vehicle>()
                    .WithMany()
                    .HasForeignKey(x => x.VehicleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}