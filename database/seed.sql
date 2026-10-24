-- ========================================================
-- Seed Data for Lost & Found Web Application
-- Sample Data for Demonstration Purposes
-- ========================================================

USE lost_and_found_db;

-- Clear previous test data (if re-seeding)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE claims;
TRUNCATE TABLE items;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Users (Password for all accounts is: Password123!)
-- Hash generated with bcryptjs 10 rounds for 'Password123!'
-- $2a$10$wK1Ww4KzQ6sB1i6iK2mCDezC29YJvLp5E1rB0R9nF2A5tC6yF2N6O
INSERT INTO users (id, name, email, password_hash, created_at) VALUES
(1, 'Alice Johnson', 'alice@college.edu', '$2a$10$tZ2R8k4wZKlEODV0E/0BaeP8u57iBkyD6925h0rN4B1jI5HhT9vY.', NOW() - INTERVAL 10 DAY),
(2, 'Bob Smith', 'bob@college.edu', '$2a$10$tZ2R8k4wZKlEODV0E/0BaeP8u57iBkyD6925h0rN4B1jI5HhT9vY.', NOW() - INTERVAL 8 DAY),
(3, 'Charlie Brown', 'charlie@college.edu', '$2a$10$tZ2R8k4wZKlEODV0E/0BaeP8u57iBkyD6925h0rN4B1jI5HhT9vY.', NOW() - INTERVAL 5 DAY);

-- Sample Items
INSERT INTO items (id, user_id, title, description, category, type, image_key, location, item_date, status, created_at) VALUES
(1, 1, 'Brown Leather Fossil Wallet', 'Lost near the Central Campus Library 2nd floor reading hall. Contains student ID card and bus pass.', 'Wallets & Bags', 'LOST', 'sample/wallet.jpg', 'Central Library 2nd Floor', CURDATE() - INTERVAL 2 DAY, 'OPEN', NOW() - INTERVAL 2 DAY),
(2, 2, 'Apple AirPods Pro in White Case', 'Found on a bench outside the Computer Science department block. The case has a slight scratch on the hinge.', 'Electronics', 'FOUND', 'sample/airpods.jpg', 'CS Block Lawn Bench', CURDATE() - INTERVAL 1 DAY, 'OPEN', NOW() - INTERVAL 1 DAY),
(3, 3, 'Silver MacBook Pro 14 inch', 'Left behind in Seminar Hall 3 after the Cloud Computing guest lecture. Black protective sleeve.', 'Electronics', 'LOST', 'sample/macbook.jpg', 'Seminar Hall 3', CURDATE() - INTERVAL 3 DAY, 'OPEN', NOW() - INTERVAL 3 DAY),
(4, 1, 'Scientific Calculator Casio fx-991EX', 'Found on desk 42 in Engineering Mathematics Lab.', 'Electronics', 'FOUND', 'sample/calculator.jpg', 'Math Lab Desk 42', CURDATE() - INTERVAL 4 DAY, 'OPEN', NOW() - INTERVAL 4 DAY),
(5, 2, 'Titan Black Dial Wristwatch', 'Lost around the sports complex athletic track during evening practice.', 'Jewellery', 'LOST', 'sample/watch.jpg', 'Sports Complex Track', CURDATE() - INTERVAL 6 DAY, 'RETURNED', NOW() - INTERVAL 6 DAY);

-- Sample Claim
INSERT INTO claims (id, item_id, claimant_id, message, status, created_at) VALUES
(1, 5, 1, 'This is my watch! It has an engraving on the back that says "Class of 2024". I can provide the original receipt.', 'APPROVED', NOW() - INTERVAL 5 DAY);
