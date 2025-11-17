-- Wahiba Bridal World - MySQL Database Schema
-- Created from Sanity schema types

-- Drop tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS `schedule_items`;
DROP TABLE IF EXISTS `schedules`;
DROP TABLE IF EXISTS `dress_images`;
DROP TABLE IF EXISTS `dress_colors`;
DROP TABLE IF EXISTS `dress_categories`;
DROP TABLE IF EXISTS `dresses`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `contacts`;
DROP TABLE IF EXISTS `revenues`;
DROP TABLE IF EXISTS `banners`;
DROP TABLE IF EXISTS `about_us_images`;

-- Categories Table
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dresses Table
CREATE TABLE `dresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT,
  `new_collection` BOOLEAN DEFAULT FALSE,
  `price_per_day` DECIMAL(10, 2),
  `is_rent_on_discount` BOOLEAN DEFAULT FALSE,
  `new_price_per_day` DECIMAL(10, 2),
  `is_for_sale` BOOLEAN DEFAULT FALSE,
  `buy_price` DECIMAL(10, 2),
  `is_sell_on_discount` BOOLEAN DEFAULT FALSE,
  `new_buy_price` DECIMAL(10, 2),
  `sizes` JSON COMMENT 'Array of sizes: ["XS", "S", "M", "L", "XL", "XXL"]',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`),
  INDEX `idx_new_collection` (`new_collection`),
  INDEX `idx_is_for_sale` (`is_for_sale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dress Categories Junction Table
CREATE TABLE `dress_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dress_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  FOREIGN KEY (`dress_id`) REFERENCES `dresses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_dress_category` (`dress_id`, `category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dress Colors Table
CREATE TABLE `dress_colors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dress_id` INT NOT NULL,
  `color_name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`dress_id`) REFERENCES `dresses`(`id`) ON DELETE CASCADE,
  INDEX `idx_dress_id` (`dress_id`),
  INDEX `idx_color_name` (`color_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dress Images Table
CREATE TABLE `dress_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `dress_color_id` INT NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`dress_color_id`) REFERENCES `dress_colors`(`id`) ON DELETE CASCADE,
  INDEX `idx_dress_color_id` (`dress_color_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Schedules (Appointments) Table
CREATE TABLE `schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `address` VARCHAR(500),
  `note` TEXT,
  `try_on_date` DATETIME,
  `status` ENUM('pending', 'apConfirmed', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  `total` DECIMAL(10, 2),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_try_on_date` (`try_on_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Schedule Items Table
CREATE TABLE `schedule_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT NOT NULL,
  `dress_name` VARCHAR(255) NOT NULL,
  `color` VARCHAR(100),
  `size` VARCHAR(10),
  `quantity` INT DEFAULT 1,
  `start_date` DATETIME,
  `end_date` DATETIME,
  `price_per_day` DECIMAL(10, 2),
  `buy_price` DECIMAL(10, 2),
  `type` ENUM('rental', 'purchase', 'quote') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE CASCADE,
  INDEX `idx_schedule_id` (`schedule_id`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contacts Table
CREATE TABLE `contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50),
  `subject` VARCHAR(500),
  `message` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Revenues Table
CREATE TABLE `revenues` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `month` DATE NOT NULL UNIQUE,
  `total_sales` INT DEFAULT 0,
  `sales_revenue` DECIMAL(10, 2) DEFAULT 0.00,
  `total_rental` INT DEFAULT 0,
  `rental_revenue` DECIMAL(10, 2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_month` (`month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Banners Table
CREATE TABLE `banners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `image_url` VARCHAR(500) NOT NULL,
  `sort_order` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- About Us Images Table
CREATE TABLE `about_us_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `image_url` VARCHAR(500) NOT NULL,
  `sort_order` INT DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



