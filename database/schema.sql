-- ========================================================
-- Lost & Found Web Application Database Schema
-- Database: MySQL 8.0+
-- Target Deployment: AWS EC2 MySQL Server
-- ========================================================

CREATE DATABASE IF NOT EXISTS lost_and_found_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lost_and_found_db;

-- --------------------------------------------------------
-- 1. Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Table structure for table `items`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  type ENUM('LOST', 'FOUND') NOT NULL,
  image_key VARCHAR(500) DEFAULT NULL,
  location VARCHAR(200) NOT NULL,
  item_date DATE NOT NULL,
  status ENUM('OPEN', 'CLAIM_PENDING', 'RETURNED') NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_items_type (type),
  INDEX idx_items_category (category),
  INDEX idx_items_status (status),
  INDEX idx_items_user (user_id),
  INDEX idx_items_created_at (created_at),
  CONSTRAINT fk_items_user FOREIGN KEY (user_id) 
    REFERENCES users (id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Table structure for table `claims`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  claimant_id INT NOT NULL,
  message TEXT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_claims_item (item_id),
  INDEX idx_claims_claimant (claimant_id),
  INDEX idx_claims_status (status),
  CONSTRAINT fk_claims_item FOREIGN KEY (item_id) 
    REFERENCES items (id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_claims_claimant FOREIGN KEY (claimant_id) 
    REFERENCES users (id) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- Seed Data for College Project Demonstration
-- Password for all sample users is: "Password123!"
-- bcrypt hash ($2a$10$w857iN8vKk07.G6jT1dI/O6eB2xJ3vR1jA3r3v6h0h4vM7m2o4r0a or generated in backend)
-- ========================================================
