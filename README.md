# Campus Lost & Found Web Application

A full-stack, cloud-hosted **Lost & Found Web Application** engineered for college campuses to streamline lost item reporting, found item discovery, secure claims verification, and safe property returns.

Built in strict compliance with standard Cloud Computing laboratory syllabi using **React.js, Node.js/Express, MySQL on AWS EC2, Amazon S3, Docker, and Amazon CloudWatch**.

---

## Table of Contents

1. [Project Overview & Objectives](#1-project-overview--objectives)
2. [Technology Stack](#2-technology-stack)
3. [Cloud Architecture & Workflow Diagram](#3-cloud-architecture--workflow-diagram)
4. [Key Features & User Roles](#4-key-features--user-roles)
5. [Database Schema (MySQL)](#5-database-schema-mysql)
6. [Local Installation & Setup](#6-local-installation--setup)
7. [Environment Variables Configuration](#7-environment-variables-configuration)
8. [Backend REST API Documentation](#8-backend-rest-api-documentation)
9. [Amazon S3 Storage Configuration](#9-amazon-s3-storage-configuration)
10. [Docker Containerization](#10-docker-containerization)
11. [AWS EC2 Deployment Guide](#11-aws-ec2-deployment-guide)
12. [Amazon S3 Frontend Static Hosting](#12-amazon-s3-frontend-static-hosting)
13. [Amazon CloudWatch Monitoring & Alarms](#13-amazon-cloudwatch-monitoring--alarms)
14. [Testing Scenarios & Postman Collection](#14-testing-scenarios--postman-collection)
15. [College Viva & Demonstration Script (10 Steps)](#15-college-viva--demonstration-script-10-steps)
16. [Screenshots Checklist for Lab Report](#16-screenshots-checklist-for-lab-report)
17. [Limitations & Future Enhancements](#17-limitations--future-enhancements)

---

## 1. Project Overview & Objectives

In large educational institutions, hundreds of personal items (IDs, wallets, electronics, keys, study materials) are misplaced daily. Traditional bulletin boards and WhatsApp groups lack privacy, searchability, and ownership verification.

### Core Objectives:
- **Centralized Digital Directory:** Enable students and campus staff to instantly report and search lost and found belongings.
- **Privacy & Security:** Safeguard identifying details so only genuine owners can claim items without exposing sensitive personal information publicly.
- **Strict Authorization:** Enforce ownership rules on the backend; users can only modify their own listings and approve claims for their items.
- **Cloud Computing Best Practices:** Hands-on demonstration of multi-tier cloud architecture (EC2 compute, S3 object storage, relational MySQL database, CloudWatch operational monitoring, and Docker containerization).

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 (Vite), JavaScript | Fast, component-based user interface |
| **Styling** | Tailwind CSS v3, Lucide React Icons | Responsive, modern, clean academic UI/UX |
| **Backend** | Node.js, Express.js | Modular RESTful API server |
| **Database** | MySQL 8.0 (Hosted on AWS EC2) | Relational persistence with transactions & constraints |
| **Image Storage** | Amazon S3 (AWS SDK v3) | Encrypted, private object storage with presigned URLs |
| **Authentication** | JWT (JSON Web Tokens) & bcryptjs | Secure, stateless authentication with HttpOnly cookies |
| **Containerization** | Docker, Docker Compose | Consistent multi-container environments |
| **Cloud Hosting** | AWS EC2 (Backend + DB), Amazon S3 (Frontend) | Scalable cloud infrastructure |
| **Monitoring** | Amazon CloudWatch | System metrics, custom CPU alarms, agent logs |
| **API Testing** | Postman v10+ | Comprehensive automated endpoint verification |

> **Strict Syllabus Compliance:** No TypeScript, MongoDB, Firebase, Kubernetes, ECS, Lambda, Cognito, or GraphQL was used.

---

## 3. Cloud Architecture & Workflow Diagram

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Browser)"]
        UserBrowser["React Single Page Application\n(Hosted on S3 Static Website / CloudFront)"]
    end

    subgraph AWSCloud["AWS Cloud Infrastructure"]
        subgraph S3Service["Amazon S3"]
            S3Web["Static Website Bucket\n(HTML, CSS, JS Bundle)"]
            S3Uploads["Private Uploads Bucket\n(Item Images - Block Public Access: ON)"]
        end

        subgraph EC2["AWS EC2 Instance (Amazon Linux 2023 / Ubuntu)"]
            Nginx["Nginx Reverse Proxy\n(Port 80/443 -> 5000)"]
            
            subgraph DockerEngine["Docker Engine"]
                API["Node.js Express API Container\n(Port 5000)"]
                DB[("MySQL 8.0 Database Container\n(Port 3306 - Internal Only)")]
            end

            CWAgent["CloudWatch Agent\n(System Metrics & Log Shipper)"]
        end

        subgraph CloudWatch["Amazon CloudWatch"]
            CPUAlarm["CPU Utilization Alarm (>70%)"]
            CWLogs["Application & Nginx Logs"]
            CustomMetrics["Memory & Disk Metrics"]
        end
    end

    UserBrowser -->|1. HTTPS Request| S3Web
    UserBrowser -->|2. REST API Calls (JWT)| Nginx
    Nginx -->|3. Reverse Proxy| API
    API -->|4. Parameterized SQL Queries & Transactions| DB
    API -->|5. Upload Object via IAM Role| S3Uploads
    API -->|6. Generate 15-min Presigned GET URL| UserBrowser
    UserBrowser -->|7. Fetch Private Image directly from S3| S3Uploads
    EC2 -->|Metrics & Alarms| CloudWatch
```

---

## 4. Key Features & User Roles

### User Roles
1. **Unregistered Visitor:**
   - Browse all lost and found listings.
   - Use live search and filter by category (Electronics, Wallets, Documents, Keys, etc.).
   - View public item details and location descriptions.
2. **Authenticated Student/Staff Member:**
   - Report a lost item with title, approximate campus location, date, and description.
   - Post a found item with a photo uploaded directly to Amazon S3.
   - Submit a private claim on found items or report a match for lost items.
   - Access the personalized **Dashboard** to manage own listings and inspect incoming claims.
   - Approve or reject claims with atomic MySQL transactions.
   - Confirm physical handover and mark items as `RETURNED`.

---

## 5. Database Schema (MySQL)

### 1. `users` Table
Stores registered student and staff accounts.
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. `items` Table
Stores all reported lost and found items.
```sql
CREATE TABLE items (
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
  CONSTRAINT fk_items_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. `claims` Table
Stores private claims submitted by users seeking to retrieve an item.
```sql
CREATE TABLE claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  claimant_id INT NOT NULL,
  message TEXT NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_claims_item (item_id),
  INDEX idx_claims_claimant (claimant_id),
  INDEX idx_claims_status (status),
  CONSTRAINT fk_claims_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
  CONSTRAINT fk_claims_claimant FOREIGN KEY (claimant_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 6. Local Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ or v20+
- [Git](https://git-scm.com/)
- MySQL 8.0 Server (or Docker)

### Step 1: Clone the Repository
```bash
git clone <repository_url>
cd cc-project
```

### Step 2: Configure & Start Backend
```bash
cd backend
npm install

# Copy environment template
cp .env.example .env
```

Edit `backend/.env` with your local MySQL credentials:
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lost_and_found_db
USE_LOCAL_STORAGE=true
```

Start the server:
```bash
# Starts backend and automatically creates database tables and sample accounts
npm start
```
The backend starts at `http://localhost:5000`. Health check is accessible at `http://localhost:5000/api/health`.

### Step 3: Configure & Start Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 7. Environment Variables Configuration

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Express server port | `5000` |
| `NODE_ENV` | Runtime environment | `development` or `production` |
| `CLIENT_URL` | Allowed CORS frontend origin | `http://localhost:5173` |
| `JWT_SECRET` | Secret key used to sign JWTs | Secure random string (min 32 chars) |
| `JWT_EXPIRES_IN` | Session expiration duration | `7d` |
| `DB_HOST` | MySQL hostname or IP | `127.0.0.1` or `mysql` (Docker) |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `root` or `appuser` |
| `DB_PASSWORD` | MySQL password | Your database password |
| `DB_NAME` | MySQL database name | `lost_and_found_db` |
| `AWS_REGION` | AWS Region for S3 Bucket | `us-east-1` |
| `AWS_BUCKET_NAME` | Dedicated S3 bucket for uploads | `lost-and-found-uploads-bucket` |
| `AWS_ACCESS_KEY_ID` | Optional locally (Omit on EC2 IAM Role) | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Optional locally (Omit on EC2 IAM Role) | `secret...` |
| `USE_LOCAL_STORAGE` | Set `true` for offline testing without S3 | `true` or `false` |

---

## 8. Backend REST API Documentation

### Authentication Routes (`/api/auth`)

- `POST /api/auth/register`
  - Body: `{ "name": "Alice", "email": "alice@college.edu", "password": "Password123!" }`
  - Response: `201 Created` with JWT token and user info.
- `POST /api/auth/login`
  - Body: `{ "email": "alice@college.edu", "password": "Password123!" }`
  - Response: `200 OK` with JWT token and HttpOnly cookie.
- `POST /api/auth/logout`
  - Clears authentication cookie.
- `GET /api/auth/me`
  - Header: `Authorization: Bearer <token>`
  - Returns authenticated user profile.

### Item Listings Routes (`/api/items`)

- `GET /api/items`
  - Query parameters: `type` (LOST/FOUND), `category`, `search`, `status`, `userId`
  - Returns array of items with parallel-generated S3 presigned URLs.
- `GET /api/items/:id`
  - Returns single item with owner information and valid image URL.
- `POST /api/items` *(Protected)*
  - `Content-Type: multipart/form-data`
  - Form Fields: `title`, `description`, `category`, `type` (LOST/FOUND), `location`, `item_date`, `image` (file, max 5MB)
  - Saves file to S3, writes `image_key` to MySQL, returns `201 Created`.
- `PUT /api/items/:id` *(Protected - Owner Only)*
  - Updates item details. Rejects with `403 Forbidden` if user is not the listing owner.
- `DELETE /api/items/:id` *(Protected - Owner Only)*
  - Deletes S3 object and MySQL record. Rejects with `403 Forbidden` if unauthorized.
- `PUT /api/items/:id/return` *(Protected - Owner Only)*
  - Transitions item status to `RETURNED`. Closes item to further claims.

### Claims Routes (`/api/claims`)

- `POST /api/items/:id/claim` *(Protected)*
  - Body: `{ "message": "Engraving on back reads Class of 2024." }`
  - Prevents users from claiming their own listings (`400 Bad Request`).
  - Creates a `PENDING` claim.
- `GET /api/claims` *(Protected)*
  - Returns `{ incoming: [...], outgoing: [...] }` separated by claims on the user's items vs claims submitted by the user.
- `PUT /api/claims/:id` *(Protected - Owner Only)*
  - Body: `{ "status": "APPROVED" | "REJECTED" }`
  - Executes atomic MySQL transaction:
    1. Approves target claim.
    2. Rejects conflicting pending claims.
    3. Updates item status to `CLAIM_PENDING`.

### System Health (`/api/health`)
- `GET /api/health`
  - Returns server uptime, memory usage, and health status for AWS CloudWatch and Load Balancer health checks.

---

## 9. Amazon S3 Storage Configuration

Item photos are stored in an isolated, private Amazon S3 bucket.

### 1. Bucket Creation
```bash
aws s3api create-bucket \
    --bucket lost-and-found-item-uploads-$(aws sts get-caller-identity --query Account --output text) \
    --region us-east-1
```

### 2. Enable Block Public Access (Zero Public Objects)
```bash
aws s3api put-public-access-block \
    --bucket <your-bucket-name> \
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 3. Configure CORS on S3 Bucket
Allows the browser to load presigned GET image URLs:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```
Apply CORS:
```bash
aws s3api put-bucket-cors --bucket <your-bucket-name> --cors-configuration file://s3-cors.json
```

### 4. Presigned URLs Workflow
- Photos are uploaded through the backend using `@aws-sdk/client-s3`.
- The MySQL database stores only the key (e.g. `items/1729760000-12345.jpg`).
- When fetching items, the backend issues short-lived, signed URLs via `@aws-sdk/s3-request-presigner` with an expiration of 15 minutes (`expiresIn: 900`).

---

## 10. Docker Containerization

### Quick Start with Docker Compose
To run both MySQL 8.0 and the Express API in isolated Docker containers:

```bash
docker compose up -d --build
```

Verify containers are running:
```bash
docker compose ps
```

View application logs:
```bash
docker compose logs -f backend
```

Stop containers:
```bash
docker compose down
```
*(MySQL data is persisted safely in the named volume `mysql_data`).*

---

## 11. AWS EC2 Deployment Guide

### Step 1: Launch EC2 Instance
- **AMI:** Amazon Linux 2023 or Ubuntu Server 22.04 LTS
- **Instance Type:** `t3.micro` (AWS Free Tier eligible)
- **Key Pair:** Create or select your `.pem` key pair
- **Storage:** 15 GB gp3 root volume

### Step 2: Configure Security Group
| Type | Protocol | Port Range | Source | Purpose |
|---|---|---|---|---|
| SSH | TCP | 22 | `My IP` (Strict) | Secure terminal management |
| HTTP | TCP | 80 | `0.0.0.0/0` | Web traffic (Nginx) |
| HTTPS | TCP | 443 | `0.0.0.0/0` | Secure SSL traffic |
| Custom TCP | TCP | 5000 | `Security Group Self` | Internal backend access |
| MySQL | TCP | 3306 | *DO NOT EXPOSE TO INTERNET* | Kept strictly on localhost |

### Step 3: Attach IAM Role to EC2
Create an IAM Role with `AmazonS3FullAccess` (or scoped policy for the uploads bucket) and `CloudWatchAgentServerPolicy`, and attach it to your EC2 instance via **Actions -> Security -> Modify IAM Role**.

### Step 4: Provision EC2 & Deploy
Connect to EC2 via SSH:
```bash
ssh -i your-key.pem ec2-user@<ec2-public-ip>
```

Run the automated provisioning script:
```bash
# Clone the repository
git clone https://github.com/your-username/cc-project.git
cd cc-project

# Run setup script
chmod +x aws/ec2-setup.sh
./aws/ec2-setup.sh

# Start containers with Docker Compose
docker compose up -d --build
```

### Step 5: Configure Nginx Reverse Proxy
Copy the provided Nginx configuration:
```bash
sudo cp aws/nginx.conf /etc/nginx/conf.d/lost-and-found.conf
sudo nginx -t
sudo systemctl restart nginx
```

---

## 12. Amazon S3 Frontend Static Hosting

For college laboratory demonstrations, the React application can be statically hosted directly from Amazon S3:

### Step 1: Build Production Assets
```bash
cd frontend
npm run build
```
This generates the optimized bundle in `frontend/dist/`.

### Step 2: Create S3 Frontend Bucket
```bash
aws s3 mb s3://campusfind-frontend-bucket --region us-east-1
```

### Step 3: Configure Static Website Hosting
```bash
aws s3 website s3://campusfind-frontend-bucket/ --index-document index.html --error-document index.html
```

### Step 4: Upload `dist/` Directory
```bash
aws s3 sync dist/ s3://campusfind-frontend-bucket/
```

### Step 5: Public Read Bucket Policy (Static Website Only)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::campusfind-frontend-bucket/*"
    }
  ]
}
```

> **HTTP vs HTTPS Distinction for Viva:**
> Amazon S3 Static Website endpoints natively support **HTTP only**. Modern web security practices prohibit sending user passwords over unencrypted HTTP.
> In a production AWS deployment, an **Amazon CloudFront Distribution** is provisioned with an **AWS Certificate Manager (ACM)** free SSL/TLS certificate to deliver the S3 assets over HTTPS.

---

## 13. Amazon CloudWatch Monitoring & Alarms

### 1. View EC2 Default Metrics
1. Open the **AWS Management Console** -> **CloudWatch**.
2. Navigate to **Metrics** -> **All Metrics** -> **EC2** -> **Per-Instance Metrics**.
3. Select `CPUUtilization`, `NetworkIn`, and `NetworkOut` for your instance.

### 2. Create CPU Utilization Alarm (>70%)
1. In CloudWatch, click **Alarms** -> **Create Alarm**.
2. Select metric: `EC2 -> Per-Instance Metrics -> CPUUtilization`.
3. Set conditions:
   - **Threshold type:** Static
   - **Whenever CPUUtilization is:** Greater than `70`
   - **Period:** 1 minute (or 5 minutes)
4. Configure actions:
   - Send notification to an **Amazon SNS Topic** (e.g. `campus-admin-alerts`).
5. Name the alarm: `LostAndFound-HighCPU-Utilization` and click **Create Alarm**.

### 3. Configure CloudWatch Agent for Memory & Disk Metrics
*Note: Memory and Disk utilization are OS-level metrics and are NOT available in CloudWatch by default without the agent.*

1. Apply the configuration file:
```bash
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:aws/cloudwatch-config.json \
    -s
```
2. Verify agent status:
```bash
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a status
```
3. Custom metrics will now populate under the `LostAndFound/EC2CustomMetrics` namespace in CloudWatch.

### 4. Stress Test Traffic Generation (For Screenshots)
To trigger the CPU alarm for demonstration screenshots, run:
```bash
sudo dnf install -y stress
stress --cpu 2 --timeout 300s
```
Watch the CloudWatch Alarm transition from `OK` -> `ALARM`.

---

## 14. Testing Scenarios & Postman Collection

The repository includes a ready-to-import Postman Collection: `postman/Lost_and_Found_API.postman_collection.json`.

### Test Matrix

| # | Test Scenario | Method & Endpoint | Expected Status |
|---|---|---|---|
| 1 | Register new student account | `POST /api/auth/register` | `201 Created` |
| 2 | Authenticate Alice (Listing Owner) | `POST /api/auth/login` | `200 OK` (Token issued) |
| 3 | Authenticate Bob (Finder) | `POST /api/auth/login` | `200 OK` (Token issued) |
| 4 | List all lost items with search filter | `GET /api/items?type=LOST&search=wallet` | `200 OK` (Presigned URLs attached) |
| 5 | Post found earbud case with photo | `POST /api/items` (Multipart) | `201 Created` (S3 key generated) |
| 6 | Attempt unauthorized edit of Alice's item by Bob | `PUT /api/items/1` (as Bob) | `403 Forbidden` |
| 7 | Submit claim on Bob's found earbuds | `POST /api/items/2/claim` (as Charlie) | `201 Created` (Status: PENDING) |
| 8 | Prevent user from claiming their own item | `POST /api/items/1/claim` (as Alice) | `400 Bad Request` |
| 9 | Approve claim via transaction | `PUT /api/claims/1` (`status: APPROVED`) | `200 OK` (Status updated) |
| 10 | Mark item as RETURNED | `PUT /api/items/1/return` | `200 OK` (Status: RETURNED) |

---

## 15. College Viva & Demonstration Script (10 Steps)

Follow this structured script during your evaluation:

1. **Step 1:** Log in as **Alice Johnson** (`alice@college.edu` / `Password123!`). Navigate to **Post Item** and report a lost item (e.g. *Brown Leather Fossil Wallet*) with approximate campus location (*Library 2nd Floor*) and a photograph.
2. **Step 2:** Open the terminal / AWS Console. Show that the item record was created in the MySQL `items` table with `status = 'OPEN'`, and the image was stored in Amazon S3 under `items/...`.
3. **Step 3:** Open an incognito browser window and log in as **Bob Smith** (`bob@college.edu`). Browse to the Lost Items page and locate Alice's wallet. Click **"I Found This"** and submit a response with match details.
4. **Step 4:** Switch back to Alice's browser window. Navigate to **Dashboard -> Incoming Claims**. Show Bob's incoming response with his private message.
5. **Step 5:** Alice clicks **"Confirm Return"**. Verify that the status of the item updates to `RETURNED`.
6. **Step 6:** Bob posts a found item (e.g. *Apple AirPods Pro in White Case*).
7. **Step 7:** Log in as **Charlie Brown** (`charlie@college.edu`). Locate the AirPods under Found Items and click **"This Is Mine"**. Provide private identifying details (*"Slight scratch on the hinge, engraved initials CB"*).
8. **Step 8:** Bob reviews Charlie's claim in his Dashboard, clicks **"Approve Claim"** (demonstrating the MySQL transaction that rejects any other competing claims), and confirms physical handover.
9. **Step 9:** Using Postman or browser console, attempt to send a `PUT` request to update another user's listing. Verify that the Express server enforces authorization and returns `403 Forbidden`.
10. **Step 10:** Open the AWS CloudWatch console. Display the active EC2 CPU utilization graph, the configured `>70%` alarm, and CloudWatch Agent memory metrics.

---

## 16. Screenshots Checklist for Lab Report

- [ ] **1. Landing Page:** Hero section, search bar, and recently reported items grid.
- [ ] **2. Item Directory:** Lost & Found item cards with status badges and category chips.
- [ ] **3. Post Item Form:** Drag-and-drop image upload and location input.
- [ ] **4. Item Details & Verification Modal:** Private claim submission dialog.
- [ ] **5. User Dashboard:** Tabs showing My Listings, Incoming Claims, and Claim Statuses.
- [ ] **6. MySQL Database Terminal:** `SELECT * FROM items;` and `SELECT * FROM claims;` demonstrating foreign keys.
- [ ] **7. Amazon S3 Console:** The private S3 bucket showing uploaded objects in the `/items` prefix.
- [ ] **8. Docker Container Status:** Terminal output of `docker compose ps`.
- [ ] **9. AWS EC2 Console:** Running instance details, public IP, and attached IAM Role.
- [ ] **10. CloudWatch Dashboard:** CPU Utilization graph and the configured Alarm in `OK` / `ALARM` state.

---

## 17. Limitations & Future Enhancements

- **Real-Time Push Notifications:** Future iterations could incorporate AWS SNS or WebSockets for instant browser alerts when a claim is approved.
- **Image Similarity Matching:** Future work could introduce Amazon Rekognition to automatically detect similarity between lost and found photos.
- **Geofenced Campus Maps:** Integration with Leaflet/OpenStreetMap to pin exact building coordinates on a campus floorplan.
- **Multi-Campus Support:** Tenancy support for university multi-campus systems.

---

**Developed for Academic Evaluation & Cloud Computing Course Demonstration.**
