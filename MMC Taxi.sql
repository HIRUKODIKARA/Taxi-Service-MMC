USE mmc_taxi_db;
USE mmc_taxi_db;

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nic VARCHAR(20),
    account_status ENUM('ACTIVE','INACTIVE','SUSPENDED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_role_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON DELETE CASCADE,

    UNIQUE (user_id, role_id)
);

CREATE TABLE vehicle_types (
    vehicle_type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    passenger_capacity INT NOT NULL,
    status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    driving_license_no VARCHAR(50) NOT NULL UNIQUE,

    verification_status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) DEFAULT 'PENDING',

    operational_status ENUM(
        'AVAILABLE',
        'ON_RIDE',
        'OFFLINE'
    ) DEFAULT 'OFFLINE',

    gps_enabled BOOLEAN DEFAULT FALSE,
    verified_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE vehicles (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NULL,
    vehicle_type_id INT NOT NULL,

    registration_number VARCHAR(50) NOT NULL UNIQUE,
    gps_available BOOLEAN DEFAULT TRUE,

    operational_status ENUM(
        'AVAILABLE',
        'ON_RIDE',
        'OFFLINE'
    ) DEFAULT 'OFFLINE',

    account_status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (driver_id)
        REFERENCES drivers(driver_id)
        ON DELETE SET NULL,

    FOREIGN KEY (vehicle_type_id)
        REFERENCES vehicle_types(vehicle_type_id)
);

CREATE TABLE driver_documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,

    document_type ENUM(
        'DRIVING_LICENSE',
        'NIC',
        'VEHICLE_REGISTRATION',
        'OTHER'
    ) NOT NULL,

    file_path VARCHAR(255),

    verification_status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) DEFAULT 'PENDING',

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (driver_id)
        REFERENCES drivers(driver_id)
        ON DELETE CASCADE
);

CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,

    passenger_id INT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    passenger_phone VARCHAR(20) NOT NULL,

    booking_source ENUM(
        'WEBSITE',
        'PHONE',
        'ON_SITE'
    ) NOT NULL,

    pickup_location VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,

    booking_date DATE,
    booking_time TIME,

    vehicle_type_id INT NOT NULL,
    assigned_driver_id INT NULL,
    assigned_vehicle_id INT NULL,

    booking_status ENUM(
        'PENDING',
        'WAITING_FOR_DRIVER',
        'ACCEPTED',
        'DRIVER_ARRIVING',
        'ON_RIDE',
        'COMPLETED',
        'CANCELLED',
        'REJECTED'
    ) DEFAULT 'PENDING',

    created_by_user_id INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (passenger_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    FOREIGN KEY (vehicle_type_id)
        REFERENCES vehicle_types(vehicle_type_id),

    FOREIGN KEY (assigned_driver_id)
        REFERENCES drivers(driver_id)
        ON DELETE SET NULL,

    FOREIGN KEY (assigned_vehicle_id)
        REFERENCES vehicles(vehicle_id)
        ON DELETE SET NULL,

    FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE booking_status_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,

    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,

    changed_by_user_id INT NULL,
    remarks VARCHAR(255),

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE,

    FOREIGN KEY (changed_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE driver_locations (
    location_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,

    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,

    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (driver_id)
        REFERENCES drivers(driver_id)
        ON DELETE CASCADE
);

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,

    notification_type ENUM(
        'BOOKING',
        'DRIVER',
        'VEHICLE',
        'SYSTEM'
    ) DEFAULT 'SYSTEM',

    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,

    amount DECIMAL(10,2) NOT NULL,

    payment_method ENUM(
        'CASH',
        'CARD',
        'ONLINE'
    ) DEFAULT 'CASH',

    payment_status ENUM(
        'PENDING',
        'PAID',
        'FAILED'
    ) DEFAULT 'PENDING',

    paid_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE
);

CREATE TABLE ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,

    passenger_id INT NOT NULL,
    driver_id INT NOT NULL,

    rating_value INT NOT NULL,
    feedback VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE,

    FOREIGN KEY (passenger_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (driver_id)
        REFERENCES drivers(driver_id)
        ON DELETE CASCADE,

    CHECK (rating_value BETWEEN 1 AND 5)
);

CREATE TABLE activity_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,

    activity_type VARCHAR(100) NOT NULL,
    description VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE TABLE system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(500),

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);
SHOW TABLES;
USE mmc_taxi_db;
INSERT INTO roles (role_name, description)
VALUES
('SUPER_ADMIN', 'Full system access'),
('ADMIN', 'TMS Operator administrative access'),
('TAXI_OPERATIONS', 'Taxi Operations access'),
('DRIVER', 'Driver portal access'),
('PASSENGER', 'Passenger portal access');
INSERT INTO vehicle_types
(type_name, description, passenger_capacity)
VALUES
('Car', 'Comfortable vehicle for individual and family journeys', 4),
('Three-Wheeler', 'Affordable vehicle for local and short journeys', 3),
('Bike', 'Quick transport option for individual passengers', 1);
SELECT * FROM vehicle_types;
INSERT INTO users
(full_name, email, phone, password_hash, nic)
VALUES
('Super Admin', 'superadmin@mmc.lk', '0710000001', 'TEMP_HASH', '199000000001'),
('Amal Fernando', 'operations@mmc.lk', '0710000002', 'TEMP_HASH', '199000000002'),
('Kasun Perera', 'kasun.driver@mmc.lk', '0712345678', 'TEMP_HASH', '199500000003'),
('Nadeesha Perera', 'nadeesha@gmail.com', '0771234567', 'TEMP_HASH', '200100000004');
SELECT * FROM users;
INSERT INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u
JOIN roles r
WHERE
    (u.email = 'superadmin@mmc.lk' AND r.role_name = 'SUPER_ADMIN')
 OR (u.email = 'operations@mmc.lk' AND r.role_name = 'TAXI_OPERATIONS')
 OR (u.email = 'kasun.driver@mmc.lk' AND r.role_name = 'DRIVER')
 OR (u.email = 'nadeesha@gmail.com' AND r.role_name = 'PASSENGER');
 SELECT
    u.full_name,
    u.email,
    r.role_name
FROM user_roles ur
JOIN users u ON ur.user_id = u.user_id
JOIN roles r ON ur.role_id = r.role_id;
INSERT INTO drivers
(user_id, driving_license_no, verification_status, operational_status, gps_enabled, verified_at)
SELECT
    user_id,
    'B1234567',
    'APPROVED',
    'AVAILABLE',
    TRUE,
    NOW()
FROM users
WHERE email = 'kasun.driver@mmc.lk';
SELECT
    d.driver_id,
    u.full_name,
    u.email,
    d.driving_license_no,
    d.verification_status,
    d.operational_status,
    d.gps_enabled
FROM drivers d
JOIN users u ON d.user_id = u.user_id;
INSERT INTO vehicles
(
    driver_id,
    vehicle_type_id,
    registration_number,
    gps_available,
    operational_status,
    account_status
)
SELECT
    d.driver_id,
    vt.vehicle_type_id,
    'WP CAB-1234',
    TRUE,
    'AVAILABLE',
    'ACTIVE'
FROM drivers d
JOIN users u ON d.user_id = u.user_id
CROSS JOIN vehicle_types vt
WHERE u.email = 'kasun.driver@mmc.lk'
  AND vt.type_name = 'Car';
  SELECT
    v.vehicle_id,
    v.registration_number,
    vt.type_name AS vehicle_type,
    u.full_name AS driver_name,
    v.operational_status,
    v.account_status,
    v.gps_available
FROM vehicles v
JOIN vehicle_types vt
    ON v.vehicle_type_id = vt.vehicle_type_id
LEFT JOIN drivers d
    ON v.driver_id = d.driver_id
LEFT JOIN users u
    ON d.user_id = u.user_id;
    INSERT INTO bookings
(
    passenger_id,
    passenger_name,
    passenger_phone,
    booking_source,
    pickup_location,
    destination,
    booking_date,
    booking_time,
    vehicle_type_id,
    booking_status
)
SELECT
    u.user_id,
    u.full_name,
    u.phone,
    'WEBSITE',
    'Makumbura Multimodal Center',
    'Colombo',
    CURDATE(),
    CURTIME(),
    vt.vehicle_type_id,
    'WAITING_FOR_DRIVER'
FROM users u
CROSS JOIN vehicle_types vt
WHERE u.email = 'nadeesha@gmail.com'
  AND vt.type_name = 'Car';
  SELECT
    booking_id,
    passenger_name,
    passenger_phone,
    booking_source,
    pickup_location,
    destination,
    booking_status
FROM bookings;
UPDATE bookings b
JOIN drivers d
JOIN users u ON d.user_id = u.user_id
JOIN vehicles v ON v.driver_id = d.driver_id
SET
    b.assigned_driver_id = d.driver_id,
    b.assigned_vehicle_id = v.vehicle_id,
    b.booking_status = 'ACCEPTED'
WHERE b.booking_id = 1
  AND u.email = 'kasun.driver@mmc.lk'
  AND v.registration_number = 'WP CAB-1234';
  SELECT
    b.booking_id,
    b.passenger_name,
    b.booking_source,
    b.pickup_location,
    b.destination,
    b.booking_status,
    u.full_name AS driver_name,
    v.registration_number AS vehicle_number,
    vt.type_name AS vehicle_type
FROM bookings b
LEFT JOIN drivers d
    ON b.assigned_driver_id = d.driver_id
LEFT JOIN users u
    ON d.user_id = u.user_id
LEFT JOIN vehicles v
    ON b.assigned_vehicle_id = v.vehicle_id
LEFT JOIN vehicle_types vt
    ON v.vehicle_type_id = vt.vehicle_type_id
WHERE b.booking_id = 1;
INSERT INTO booking_status_history
(
    booking_id,
    old_status,
    new_status,
    changed_by_user_id,
    remarks
)
SELECT
    1,
    'WAITING_FOR_DRIVER',
    'ACCEPTED',
    u.user_id,
    'Booking accepted by assigned driver'
FROM users u
WHERE u.email = 'kasun.driver@mmc.lk';
SELECT * FROM booking_status_history;
INSERT INTO driver_locations
(
    driver_id,
    latitude,
    longitude
)
SELECT
    d.driver_id,
    6.8397,
    79.9653
FROM drivers d
JOIN users u ON d.user_id = u.user_id
WHERE u.email = 'kasun.driver@mmc.lk';
SELECT
    dl.location_id,
    u.full_name AS driver_name,
    dl.latitude,
    dl.longitude,
    dl.recorded_at
FROM driver_locations dl
JOIN drivers d ON dl.driver_id = d.driver_id
JOIN users u ON d.user_id = u.user_id;
INSERT INTO notifications
(
    user_id,
    title,
    message,
    notification_type,
    is_read
)
SELECT
    u.user_id,
    'Booking Accepted',
    'Your booking has been accepted by the assigned driver.',
    'BOOKING',
    FALSE
FROM users u
WHERE u.email = 'nadeesha@gmail.com';
SELECT
    n.notification_id,
    u.full_name,
    n.title,
    n.message,
    n.notification_type,
    n.is_read,
    n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.user_id;
INSERT INTO payments
(
    booking_id,
    amount,
    payment_method,
    payment_status,
    paid_at
)
VALUES
(
    1,
    2500.00,
    'CASH',
    'PAID',
    NOW()
);
SELECT
    p.payment_id,
    p.booking_id,
    b.passenger_name,
    p.amount,
    p.payment_method,
    p.payment_status,
    p.paid_at
FROM payments p
JOIN bookings b
    ON p.booking_id = b.booking_id;
    UPDATE bookings
SET booking_status = 'COMPLETED'
WHERE booking_id = 1;
INSERT INTO ratings
(
    booking_id,
    passenger_id,
    driver_id,
    rating_value,
    feedback
)
SELECT
    1,
    p.user_id,
    d.driver_id,
    5,
    'Good service and professional driver.'
FROM users p
CROSS JOIN drivers d
JOIN users du ON d.user_id = du.user_id
WHERE p.email = 'nadeesha@gmail.com'
  AND du.email = 'kasun.driver@mmc.lk';
  SELECT
    r.rating_id,
    r.booking_id,
    p.full_name AS passenger_name,
    duser.full_name AS driver_name,
    r.rating_value,
    r.feedback,
    r.created_at
FROM ratings r
JOIN users p
    ON r.passenger_id = p.user_id
JOIN drivers d
    ON r.driver_id = d.driver_id
JOIN users duser
    ON d.user_id = duser.user_id;
    INSERT INTO activity_logs
(
    user_id,
    activity_type,
    description
)
SELECT
    u.user_id,
    'BOOKING_COMPLETED',
    'Booking ID 1 was completed successfully.'
FROM users u
WHERE u.email = 'operations@mmc.lk';
INSERT INTO system_settings
(
    setting_key,
    setting_value
)
VALUES
('SYSTEM_NAME', 'Makumbura Multimodal Center Taxi Management System'),
('BOOKING_ENABLED', 'TRUE'),
('DRIVER_GPS_REQUIRED', 'TRUE');
SHOW COLUMNS FROM bookings LIKE 'booking_status';
USE mmc_taxi_db;

SHOW COLUMNS FROM bookings LIKE 'booking_status';
SHOW CREATE TABLE bookings;
SELECT COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mmc_taxi_db'
  AND TABLE_NAME = 'bookings'
  AND COLUMN_NAME = 'booking_status';
  SELECT COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mmc_taxi_db'
AND TABLE_NAME = 'bookings'
AND COLUMN_NAME = 'booking_status';
USE mmc_taxi_db;

SET @current_type = (
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'mmc_taxi_db'
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME = 'booking_status'
);

SET @new_type = IF(
    LOCATE('''DRIVER_ARRIVED''', @current_type) > 0,
    @current_type,
    CONCAT(
        LEFT(@current_type, LENGTH(@current_type) - 1),
        ',''DRIVER_ARRIVED'')'
    )
);

SET @sql = CONCAT(
    'ALTER TABLE mmc_taxi_db.bookings ',
    'MODIFY COLUMN booking_status ',
    @new_type,
    ' NULL DEFAULT ''PENDING'''
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SHOW COLUMNS FROM bookings LIKE 'booking_status';
