# 🐾 PawHaven – Pet Adoption Portal
### Complete Full-Stack Web Application for College Software Engineering Capstone Project

![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green)
![Database](https://img.shields.io/badge/Database-MySQL%20%2F%20MariaDB-blue)
![Frontend](https://img.shields.io/badge/Frontend-Bootstrap%205%20%7C%20Vanilla%20JS-purple)
![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20Bcrypt-orange)
![Uploads](https://img.shields.io/badge/File%20Uploads-Multer-red)

---

## 📌 1. Project Overview

**PawHaven** is a complete, production-ready web application designed to connect prospective adopters with animal rescue shelters. Built specifically in compliance with formal Software Engineering diagrams (System Architecture, DFD, ER Diagram, Sequence Diagram, Collaboration Diagram, Activity Diagram, and State Chart), the portal eliminates traditional manual shelter paperwork and provides a transparent digital workflow for both Adopters and Shelter Administrators.

---

## 🏗️ 2. System Architecture (4-Layer Mapping)

The application follows the 4-tier client-server architecture specified in the architectural design:

```
[ Layer 1: Client Layer ]
    ├── Chrome / Edge / Firefox Web Browsers
    ├── Adopter Web Interface (HTML5, Bootstrap 5, Custom Glassmorphism CSS, Vanilla JS)
    └── Administrator Control Panel (Real-time KPI metrics, Application Review, Pet Inventory)
         │
         │ HTTP / JSON REST APIs (JWT Bearer Token in Headers)
         ▼
[ Layer 2: Application Server ]
    ├── Node.js runtime + Express.js Web Framework
    ├── JWT Authentication & Role-Based Authorization Guards (User vs Admin)
    ├── Multer File Upload Middleware (Sanitization, MIME verification)
    ├── Controllers & Business Logic (State transitions, duplicate prevention)
    └── Error Handling & Logging Middleware
         │
         │ MySQL Connection Pooling (mysql2/promise)
         ▼
[ Layer 3: Database Server ]
    └── MySQL / MariaDB (`pet_adoption_db`)
         ├── `users` (Adopter accounts, Admin accounts, hashed credentials)
         ├── `pets` (Species, breeds, ages, health status, availability)
         ├── `adoption_applications` (Living situation questionnaires, review statuses)
         └── `notifications` (Real-time in-app alerts, read tracking)
         │
         ▼
[ Layer 4: External / Integration Services ]
    ├── Image Storage (Local File System `/uploads/pets`)
    ├── In-App Notification Engine
    └── Extensible Email Gateway (Nodemailer hook ready)
```

---

## 🔄 3. Software Engineering Diagram Mappings

### 3.1 Data Flow Diagram (DFD)
- **DFD Level 0 (Context Diagram):**
  - External Entities: `Adopter` and `Administrator`.
  - Process: `0.0 Pet Adoption Portal System`.
  - Data Flows: Adopter submits registration & application data; Admin inputs pet data and approval decisions; System outputs pet listings, statuses, and notifications.
- **DFD Level 1 (Decomposition):**
  - `Process 1.0 (Authentication)`: Validates credentials against `Users` table; generates JWT.
  - `Process 2.0 (Pet Catalog)`: Queries `Pets` table with multi-parameter filters (Dog, Cat, Rabbit, Bird).
  - `Process 3.0 (Adoption Processing)`: Stores application with `Pending` status in `Adoption_Applications`.
  - `Process 4.0 (Staff Verification)`: Admin reviews applicant background, records notes, toggles status to `Approved` or `Rejected`.
  - `Process 5.0 (Notification Dispatch)`: Inserts real-time alert into `Notifications` table.

### 3.2 Entity-Relationship (ER) Diagram
- **`Users` (1) ──< `Adoption_Applications` (N)**: One user can submit multiple applications over time.
- **`Pets` (1) ──< `Adoption_Applications` (N)**: A pet can receive applications from multiple candidates until approved.
- **`Users` (1) ──< `Notifications` (N)**: One user receives multiple lifecycle alerts.
- **Foreign Keys**: `adoption_applications.user_id` -> `users.user_id`, `adoption_applications.pet_id` -> `pets.pet_id`, `notifications.user_id` -> `users.user_id` (all with `ON DELETE CASCADE`).

### 3.3 Activity Diagram Workflow
1. User visits homepage and browses available animals.
2. User registers an account; password encrypted using `bcrypt.hash()`.
3. User logs in; JWT token stored in browser session.
4. User selects a pet and submits the structured living situation application.
5. Application enters `Pending` state; confirmation notification dispatched.
6. Admin logs into the staff portal and inspects the application.
7. Admin evaluates housing type, household members, and experience.
8. If **Approved**:
   - Application status updates to `Approved`.
   - Pet status changes automatically to `Adopted`.
   - Other competing applications for the same pet are automatically rejected with a notification.
   - User receives congratulations notification.
9. If **Rejected**:
   - Application status updates to `Rejected` with administrative reason.
   - User receives explanatory rejection notification.

### 3.4 State Machine Diagram
- **Application Lifecycle**: `[Start]` ➔ `Application Submitted` ➔ `Pending` ➔ `Approved` OR `Rejected` ➔ `[Completed]`.
- **Pet Availability**: `[Rescued]` ➔ `Available` ➔ `Adopted` (or toggled back to `Available` if adoption is cancelled).

---

## ⚡ 4. Default Demo Accounts (For Viva Presentation)

The system automatically initializes and seeds these accounts on boot:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Shelter Admin** | `admin@pawhaven.com` | `admin123` | Full access to `/admin` dashboard, application approvals, pet inventory management |
| **Adopter (Demo)** | `sarah@example.com` | `user123` | Access to `/dashboard`, application submission, notification alerts |
| **Adopter 2** | `alex@example.com` | `user123` | Secondary adopter account for multi-applicant testing |

> *Tip: The `/login` page includes **1-Click Demo Buttons** that instantly pre-fill these credentials for quick evaluator demonstrations!*

---

## 🛠️ 5. Technology Stack & Directory Structure

```
pet-adoption-portal/
├── config/
│   └── db.js                 # MySQL connection pool & automatic database/seed bootstrapper
├── controllers/
│   ├── adminController.js    # Executive KPI statistics & user directory
│   ├── applicationController.js # Adoption submission, review, and state changes
│   ├── authController.js     # Bcrypt registration, login, and user profiles
│   ├── notificationController.js # User notifications and read status
│   └── petController.js      # Pet catalog, search, filter, and CRUD operations
├── database/
│   ├── schema.sql            # Clean MySQL table definitions
│   └── seed.sql              # Realistic seed dataset (pets, adopters, applications)
├── middleware/
│   ├── auth.js               # JWT bearer token verification & role enforcement
│   └── upload.js             # Multer pet image upload configuration
├── public/
│   ├── css/
│   │   └── style.css         # Modern design system (Glassmorphism, animations, tokens)
│   ├── js/
│   │   └── app.js            # Client-side JWT session, alerts, navbar state
│   └── images/
│       └── pets/             # Curated, high-resolution pet portrait images
├── routes/
│   ├── adminRoutes.js        # /api/admin endpoints
│   ├── applicationRoutes.js  # /api/applications endpoints
│   ├── authRoutes.js         # /api/auth endpoints
│   ├── notificationRoutes.js # /api/notifications endpoints
│   └── petRoutes.js          # /api/pets endpoints
├── uploads/
│   └── pets/                 # Destination folder for Admin uploaded pet images
├── views/
│   ├── index.html            # Public homepage with hero & 4-step workflow
│   ├── about.html            # Mission, pillars, and shelter impact statistics
│   ├── contact.html          # Contact form, visiting hours, and FAQ accordion
│   ├── login.html            # Dual tab Adopter & Admin login with 1-click fill
│   ├── register.html         # User registration form with validation
│   ├── pets.html             # Pet catalog with live search & multi-parameter filters
│   ├── pet-details.html      # Individual pet profile with health & medical records
│   ├── apply.html            # 5-step adoption application form
│   ├── user-dashboard.html   # Adopter portal (KPIs, tracking, notifications)
│   └── admin-dashboard.html  # Executive staff portal (Review modal, Add/Edit pet)
├── .env                      # Database credentials and JWT secret
├── package.json              # Project dependencies and startup scripts
└── server.js                 # Express application entrypoint
```

---

## 🚀 6. Installation & Execution Guide

### Prerequisites
- **Node.js** (v18.x or later installed)
- **MySQL / MariaDB** (e.g. XAMPP running on `localhost:3306`)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Ensure your `.env` matches your local MySQL server (default XAMPP settings):
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pet_adoption_db
DB_PORT=3306
JWT_SECRET=pawhaven_jwt_secret_key_2026_super_secure
```

### Step 3: Run the Application
```bash
npm start
```
*Note: The server will automatically create `pet_adoption_db`, execute the schema, and populate seed data on the first start!*

### Step 4: Open in Web Browser
- **Public Homepage**: [http://localhost:3000](http://localhost:3000)
- **Browse Pets**: [http://localhost:3000/pets](http://localhost:3000/pets)
- **Adopter Portal**: [http://localhost:3000/login](http://localhost:3000/login)
- **Admin Control Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 📡 7. API Reference Table

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new adopter account |
| `POST` | `/api/auth/login` | Public | Authenticate user/admin, returns JWT |
| `GET` | `/api/auth/me` | Authenticated | Get current logged-in profile |
| `PUT` | `/api/auth/profile` | Authenticated | Update user name, phone, address, password |
| `GET` | `/api/pets` | Public | Browse pets with filter queries |
| `GET` | `/api/pets/:id` | Public | Get single pet profile details |
| `POST` | `/api/pets` | Admin Only | Add pet with image upload (`multipart/form-data`) |
| `PUT` | `/api/pets/:id` | Admin Only | Update pet record and image |
| `DELETE`| `/api/pets/:id` | Admin Only | Delete pet profile |
| `POST` | `/api/applications` | Adopter | Submit adoption application |
| `GET` | `/api/applications/my` | Adopter | Get user's submitted applications |
| `GET` | `/api/applications` | Admin Only | Get all applications with filters |
| `PUT` | `/api/applications/:id/status`| Admin Only | Approve or Reject application |
| `GET` | `/api/notifications` | Adopter | Get user alerts |
| `GET` | `/api/notifications/unread-count`| Adopter | Get count of unread notifications |
| `PUT` | `/api/notifications/:id/read` | Adopter | Mark notification as read |
| `GET` | `/api/admin/stats` | Admin Only | Get KPI metrics and recent activity |
| `GET` | `/api/admin/users` | Admin Only | Get list of registered adopters |

---

## 🎓 8. College Viva Voce Questions & Answers

### Q1: Why did you choose a client-server architecture?
> **Answer:** Client-server architecture separates presentation from data persistence and business logic. The client (browser) handles user experience and responsiveness, while the Express server enforces business rules, role checks, and input validations before querying MySQL, ensuring scalability, security, and maintainability.

### Q2: How is security handled for passwords and protected routes?
> **Answer:** Passwords are never stored in plaintext; we use `bcrypt` with 10 salt rounds to generate cryptographic hashes. For authorization, we use JSON Web Tokens (JWT) signed with a secret key. Protected endpoints employ middleware (`verifyToken` and `requireAdmin`) to decode the token and ensure only users with the `Admin` role can perform management actions.

### Q3: How do database transactions maintain consistency when an application is approved?
> **Answer:** When an administrator approves an application:
> 1. The target application's status is updated to `Approved`.
> 2. The pet's availability is atomically toggled to `Adopted`.
> 3. An approval notification is generated for the adopter.
> 4. Any other concurrent `Pending` applications for that same pet are automatically marked `Rejected` with an explanatory notification so no animal can be double-adopted.

### Q4: How is file uploading handled?
> **Answer:** We utilize `multer` middleware with strict MIME type filters (JPEG, PNG, WEBP) and file size constraints (max 5MB). The files are stored with unique timestamped suffixes in `/uploads/pets/` to prevent collisions.

---
© 2026 PawHaven Project Team. All rights reserved.
