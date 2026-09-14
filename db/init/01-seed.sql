-- MySQL dump 10.13  Distrib 8.4.10, for Linux (x86_64)
--
-- Host: localhost    Database: mmc_taxi_db
-- ------------------------------------------------------
-- Server version	8.4.10

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `mmc_taxi_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `mmc_taxi_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `mmc_taxi_db`;

--
-- Table structure for table `OperationalAreas`
--

DROP TABLE IF EXISTS `OperationalAreas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `OperationalAreas` (
  `OperationalAreaId` int NOT NULL AUTO_INCREMENT,
  `AreaName` varchar(100) NOT NULL,
  `Description` varchar(255) DEFAULT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`OperationalAreaId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `OperationalAreas`
--

LOCK TABLES `OperationalAreas` WRITE;
/*!40000 ALTER TABLE `OperationalAreas` DISABLE KEYS */;
/*!40000 ALTER TABLE `OperationalAreas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TaxiOperatorOperationalAreas`
--

DROP TABLE IF EXISTS `TaxiOperatorOperationalAreas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TaxiOperatorOperationalAreas` (
  `TaxiOperatorOperationalAreaId` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `OperationalAreaId` int NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`TaxiOperatorOperationalAreaId`),
  UNIQUE KEY `IX_TaxiOperatorOperationalAreas_user_id_OperationalAreaId` (`user_id`,`OperationalAreaId`),
  KEY `IX_TaxiOperatorOperationalAreas_OperationalAreaId` (`OperationalAreaId`),
  CONSTRAINT `FK_TaxiOperatorOperationalAreas_OperationalAreas_OperationalAre~` FOREIGN KEY (`OperationalAreaId`) REFERENCES `OperationalAreas` (`OperationalAreaId`) ON DELETE RESTRICT,
  CONSTRAINT `FK_TaxiOperatorOperationalAreas_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TaxiOperatorOperationalAreas`
--

LOCK TABLES `TaxiOperatorOperationalAreas` WRITE;
/*!40000 ALTER TABLE `TaxiOperatorOperationalAreas` DISABLE KEYS */;
/*!40000 ALTER TABLE `TaxiOperatorOperationalAreas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `activity_type` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,1,'USER_REGISTERED','Passenger account created for admin@mmc.local.','2026-09-12 11:25:54.748631'),(2,1,'USER_LOGIN','User admin@mmc.local logged into the system.','2026-09-12 11:26:01.356833'),(3,1,'USER_LOGIN','User admin@mmc.local logged into the system.','2026-09-12 11:26:28.315433'),(4,1,'USER_LOGIN','User admin@mmc.local logged into the system.','2026-09-12 11:29:26.850151'),(5,1,'USER_LOGIN','User admin@mmc.local logged into the system.','2026-09-13 10:00:10.535205');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_status_history`
--

DROP TABLE IF EXISTS `booking_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_status_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) NOT NULL,
  `changed_by_user_id` int DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `changed_at` datetime(6) NOT NULL,
  PRIMARY KEY (`history_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_status_history`
--

LOCK TABLES `booking_status_history` WRITE;
/*!40000 ALTER TABLE `booking_status_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `booking_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `booking_id` int NOT NULL AUTO_INCREMENT,
  `passenger_id` int DEFAULT NULL,
  `passenger_name` varchar(100) NOT NULL,
  `passenger_phone` varchar(20) NOT NULL,
  `booking_source` varchar(20) NOT NULL,
  `trip_direction` varchar(30) DEFAULT NULL,
  `operational_area_id` int DEFAULT NULL,
  `pickup_location` varchar(255) NOT NULL,
  `pickup_latitude` decimal(10,7) DEFAULT NULL,
  `pickup_longitude` decimal(10,7) DEFAULT NULL,
  `destination` varchar(255) NOT NULL,
  `destination_latitude` decimal(10,7) DEFAULT NULL,
  `destination_longitude` decimal(10,7) DEFAULT NULL,
  `booking_date` datetime(6) DEFAULT NULL,
  `booking_time` time(6) DEFAULT NULL,
  `vehicle_type_id` int NOT NULL,
  `assigned_driver_id` int DEFAULT NULL,
  `assigned_vehicle_id` int DEFAULT NULL,
  `booking_status` varchar(30) NOT NULL,
  `distance_km` decimal(10,2) DEFAULT NULL,
  `normal_fare` decimal(10,2) DEFAULT NULL,
  `route_discount_amount` decimal(10,2) NOT NULL,
  `estimated_fare` decimal(10,2) DEFAULT NULL,
  `driver_arrived_at` datetime(6) DEFAULT NULL,
  `trip_started_at` datetime(6) DEFAULT NULL,
  `waiting_minutes` int NOT NULL,
  `waiting_charge_per_minute` decimal(10,2) DEFAULT NULL,
  `waiting_charge` decimal(10,2) NOT NULL,
  `final_fare` decimal(10,2) DEFAULT NULL,
  `driver_percentage` decimal(5,2) DEFAULT NULL,
  `mmc_percentage` decimal(5,2) DEFAULT NULL,
  `driver_share` decimal(10,2) DEFAULT NULL,
  `mmc_share` decimal(10,2) DEFAULT NULL,
  `created_by_user_id` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_documents`
--

DROP TABLE IF EXISTS `driver_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_documents` (
  `document_id` int NOT NULL AUTO_INCREMENT,
  `driver_id` int NOT NULL,
  `document_type` varchar(50) NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `verification_status` varchar(50) NOT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  PRIMARY KEY (`document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_documents`
--

LOCK TABLES `driver_documents` WRITE;
/*!40000 ALTER TABLE `driver_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver_locations`
--

DROP TABLE IF EXISTS `driver_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_locations` (
  `location_id` bigint NOT NULL AUTO_INCREMENT,
  `driver_id` int NOT NULL,
  `latitude` decimal(18,2) NOT NULL,
  `longitude` decimal(18,2) NOT NULL,
  `tracking_source` varchar(20) NOT NULL,
  `recorded_at` datetime(6) NOT NULL,
  PRIMARY KEY (`location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver_locations`
--

LOCK TABLES `driver_locations` WRITE;
/*!40000 ALTER TABLE `driver_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drivers`
--

DROP TABLE IF EXISTS `drivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drivers` (
  `driver_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `driving_license_no` varchar(50) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `date_of_birth` datetime(6) DEFAULT NULL,
  `driving_license_expiry` datetime(6) DEFAULT NULL,
  `verification_status` varchar(20) NOT NULL,
  `operational_status` varchar(20) NOT NULL,
  `gps_enabled` tinyint(1) NOT NULL,
  `verified_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`driver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drivers`
--

LOCK TABLES `drivers` WRITE;
/*!40000 ALTER TABLE `drivers` DISABLE KEYS */;
/*!40000 ALTER TABLE `drivers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fare_settings`
--

DROP TABLE IF EXISTS `fare_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fare_settings` (
  `fare_setting_id` int NOT NULL AUTO_INCREMENT,
  `vehicle_type_id` int NOT NULL,
  `base_distance_km` decimal(10,2) NOT NULL,
  `base_fare` decimal(10,2) NOT NULL,
  `waiting_charge_per_minute` decimal(10,2) NOT NULL,
  `driver_percentage` decimal(5,2) NOT NULL,
  `mmc_percentage` decimal(5,2) NOT NULL,
  `status` varchar(20) NOT NULL,
  `updated_by_user_id` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`fare_setting_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fare_settings`
--

LOCK TABLES `fare_settings` WRITE;
/*!40000 ALTER TABLE `fare_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `fare_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fare_slabs`
--

DROP TABLE IF EXISTS `fare_slabs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fare_slabs` (
  `fare_slab_id` int NOT NULL AUTO_INCREMENT,
  `fare_setting_id` int NOT NULL,
  `from_km` decimal(10,2) NOT NULL,
  `to_km` decimal(10,2) DEFAULT NULL,
  `rate_per_km` decimal(10,2) NOT NULL,
  `sort_order` int NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`fare_slab_id`),
  KEY `IX_fare_slabs_fare_setting_id` (`fare_setting_id`),
  CONSTRAINT `FK_fare_slabs_fare_settings_fare_setting_id` FOREIGN KEY (`fare_setting_id`) REFERENCES `fare_settings` (`fare_setting_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fare_slabs`
--

LOCK TABLES `fare_slabs` WRITE;
/*!40000 ALTER TABLE `fare_slabs` DISABLE KEYS */;
/*!40000 ALTER TABLE `fare_slabs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` longtext NOT NULL,
  `notification_type` varchar(20) NOT NULL,
  `is_read` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`notification_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offers`
--

DROP TABLE IF EXISTS `offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offers` (
  `offer_id` int NOT NULL AUTO_INCREMENT,
  `offer_name` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `discount_type` varchar(20) NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `vehicle_type_id` int DEFAULT NULL,
  `from_operational_area_id` int DEFAULT NULL,
  `to_operational_area_id` int DEFAULT NULL,
  `customer_type` varchar(30) NOT NULL,
  `minimum_fare` decimal(10,2) DEFAULT NULL,
  `start_at` datetime(6) DEFAULT NULL,
  `end_at` datetime(6) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `created_by_user_id` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`offer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offers`
--

LOCK TABLES `offers` WRITE;
/*!40000 ALTER TABLE `offers` DISABLE KEYS */;
/*!40000 ALTER TABLE `offers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `password_reset_token_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `used_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`password_reset_token_id`),
  UNIQUE KEY `IX_password_reset_tokens_token_hash` (`token_hash`),
  KEY `IX_password_reset_tokens_expires_at` (`expires_at`),
  KEY `IX_password_reset_tokens_user_id` (`user_id`),
  CONSTRAINT `FK_password_reset_tokens_users_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(20) NOT NULL,
  `payment_status` varchar(20) NOT NULL,
  `paid_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `permission_id` int NOT NULL AUTO_INCREMENT,
  `permission_name` longtext NOT NULL,
  `description` longtext,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`permission_id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'ACCEPT_TRIP',NULL,'2026-09-12 05:55:25.000000'),(2,'ASSIGN_DRIVER',NULL,'2026-09-12 05:55:25.000000'),(3,'CREATE_RATING',NULL,'2026-09-12 05:55:25.000000'),(4,'MANAGE_BOOKINGS',NULL,'2026-09-12 05:55:25.000000'),(5,'MANAGE_DRIVERS',NULL,'2026-09-12 05:55:25.000000'),(6,'MANAGE_NOTIFICATIONS',NULL,'2026-09-12 05:55:25.000000'),(7,'MANAGE_PAYMENTS',NULL,'2026-09-12 05:55:25.000000'),(8,'MANAGE_PERMISSIONS',NULL,'2026-09-12 05:55:25.000000'),(9,'MANAGE_SYSTEM_SETTINGS',NULL,'2026-09-12 05:55:25.000000'),(10,'MANAGE_TAXI_OPERATOR_AREAS',NULL,'2026-09-12 05:55:25.000000'),(11,'MANAGE_USERS',NULL,'2026-09-12 05:55:25.000000'),(12,'MANAGE_VEHICLES',NULL,'2026-09-12 05:55:25.000000'),(13,'MANAGE_VEHICLE_TYPES',NULL,'2026-09-12 05:55:25.000000'),(14,'REJECT_TRIP',NULL,'2026-09-12 05:55:25.000000'),(15,'UPDATE_DRIVER_LOCATION',NULL,'2026-09-12 05:55:25.000000'),(16,'UPDATE_TRIP_STATUS',NULL,'2026-09-12 05:55:25.000000'),(17,'VERIFY_DRIVERS',NULL,'2026-09-12 05:55:25.000000'),(18,'VIEW_ACTIVITY_LOGS',NULL,'2026-09-12 05:55:25.000000'),(19,'VIEW_BOOKINGS',NULL,'2026-09-12 05:55:25.000000'),(20,'VIEW_DRIVER_LOCATION',NULL,'2026-09-12 05:55:25.000000'),(21,'VIEW_DRIVERS',NULL,'2026-09-12 05:55:25.000000'),(22,'VIEW_NOTIFICATIONS',NULL,'2026-09-12 05:55:25.000000'),(23,'VIEW_PAYMENTS',NULL,'2026-09-12 05:55:25.000000'),(24,'VIEW_RATINGS',NULL,'2026-09-12 05:55:25.000000'),(25,'VIEW_REPORTS',NULL,'2026-09-12 05:55:25.000000'),(26,'VIEW_ROLES',NULL,'2026-09-12 05:55:25.000000'),(27,'VIEW_USERS',NULL,'2026-09-12 05:55:25.000000'),(28,'VIEW_VEHICLES',NULL,'2026-09-12 05:55:25.000000');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ratings`
--

DROP TABLE IF EXISTS `ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ratings` (
  `rating_id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `passenger_id` int NOT NULL,
  `driver_id` int NOT NULL,
  `rating_value` int NOT NULL,
  `feedback` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`rating_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ratings`
--

LOCK TABLES `ratings` WRITE;
/*!40000 ALTER TABLE `ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_permission_id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_permission_id`),
  UNIQUE KEY `IX_role_permissions_role_id_permission_id` (`role_id`,`permission_id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,2,2),(2,2,4),(3,2,5),(4,2,6),(5,2,7),(6,2,10),(7,2,11),(8,2,12),(9,2,13),(10,2,16),(11,2,17),(12,2,18),(13,2,19),(14,2,20),(15,2,21),(16,2,22),(17,2,23),(18,2,24),(19,2,25),(20,2,26),(21,2,27),(22,2,28),(32,3,2),(33,3,4),(34,3,6),(35,3,7),(36,3,16),(37,3,19),(38,3,20),(39,3,21),(40,3,22),(41,3,23),(42,3,28),(47,4,1),(48,4,14),(49,4,15),(50,4,16),(51,4,22),(52,4,24),(54,5,3),(55,5,20),(56,5,22),(57,5,23);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'SUPER_ADMIN','Full system access','2026-09-12 05:55:25.000000'),(2,'ADMIN','Administrator','2026-09-12 05:55:25.000000'),(3,'TAXI_OPERATIONS','Taxi operations / dispatch staff','2026-09-12 05:55:25.000000'),(4,'DRIVER','Taxi driver','2026-09-12 05:55:25.000000'),(5,'PASSENGER','Passenger','2026-09-12 05:55:25.000000');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `special_route_discounts`
--

DROP TABLE IF EXISTS `special_route_discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `special_route_discounts` (
  `special_route_discount_id` int NOT NULL AUTO_INCREMENT,
  `from_operational_area_id` int NOT NULL,
  `to_operational_area_id` int NOT NULL,
  `discount_type` varchar(20) NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `both_directions` tinyint(1) NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_by_user_id` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`special_route_discount_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `special_route_discounts`
--

LOCK TABLES `special_route_discounts` WRITE;
/*!40000 ALTER TABLE `special_route_discounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `special_route_discounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `setting_id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`setting_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_role_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`user_role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1,1);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(120) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nic` varchar(20) DEFAULT NULL,
  `account_status` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'MMC Super Admin','admin@mmc.local','0770000000','AQAAAAIAAYagAAAAEITQEon3uc7PIyLS1XvBULEyElxG/bN9Ge4F4wuHHI35SnIk1XYkX59ZPHwm29iJSQ==',NULL,'ACTIVE','2026-09-12 11:25:54.118953','2026-09-12 11:25:54.119003');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_photos`
--

DROP TABLE IF EXISTS `vehicle_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_photos` (
  `vehicle_photo_id` int NOT NULL AUTO_INCREMENT,
  `vehicle_id` int NOT NULL,
  `photo_type` varchar(20) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  PRIMARY KEY (`vehicle_photo_id`),
  KEY `IX_vehicle_photos_vehicle_id` (`vehicle_id`),
  CONSTRAINT `FK_vehicle_photos_vehicles_vehicle_id` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_photos`
--

LOCK TABLES `vehicle_photos` WRITE;
/*!40000 ALTER TABLE `vehicle_photos` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_types`
--

DROP TABLE IF EXISTS `vehicle_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_types` (
  `vehicle_type_id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `passenger_capacity` int NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`vehicle_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_types`
--

LOCK TABLES `vehicle_types` WRITE;
/*!40000 ALTER TABLE `vehicle_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `vehicle_id` int NOT NULL AUTO_INCREMENT,
  `driver_id` int DEFAULT NULL,
  `vehicle_type_id` int NOT NULL,
  `registration_number` varchar(50) NOT NULL,
  `make` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL,
  `manufacture_year` int DEFAULT NULL,
  `gps_available` tinyint(1) NOT NULL,
  `operational_status` varchar(20) NOT NULL,
  `account_status` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`vehicle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'mmc_taxi_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-14  9:20:58
