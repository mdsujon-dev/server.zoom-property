# Zoom Property — API Server

The backend REST API server for **Zoom Property**, a real estate platform. Built with **Node.js, Express, TypeScript, and MongoDB (Mongoose)**, featuring custom Role-Based Access Control (RBAC), Cloudflare R2 media storage, realtime Socket.IO notifications, and email integration.

It serves both the public **Storefront** (Next.js) and the **Admin Panel** (React) over REST endpoints mounted under `/api`.

---

## Tech Stack

| Area | Choice |
|------|--------|
| Runtime | **Node.js** + **TypeScript** |
| Framework | **Express 4** |
| Database | **MongoDB** via **Mongoose** |
| Authentication | **JWT** (access + refresh tokens) + **bcrypt** |
| Validation | **Zod** |
| Access Control | Custom RBAC middleware (`checkPermission`) |
| Media Storage | Cloudflare **R2** (S3-compatible) + **Sharp** image optimization |
| Realtime | **Socket.IO** (admin notifications) |
| Mailer | **Nodemailer** + Handlebars templates |
| Caching | Redis (`ioredis`) |

---

## Project Structure

```
src/
├── server.ts                 # Server entry — database connection, HTTP & Socket.IO server
├── app.ts                    # Express app initialization, global middleware, /api router
└── app/
    ├── builder/              # QueryBuilder helper (search, filter, sort, paginate)
    ├── config/               # Environment configuration
    ├── db/                   # Seed & migration scripts (super admin, roles)
    ├── errors/               # Custom AppError and global error handlers
    ├── middleware/           # auth, permission (RBAC), validateRequest, activityNotifier
    ├── routes/index.ts       # Central router mounting all feature modules under /api
    ├── modules/              # Self-contained feature modules
    │   ├── actionLog/        # User audit trail logging
    │   ├── area/             # Locations & neighbourhood areas
    │   ├── auth/             # Login, refresh token, password reset, profile
    │   ├── blog/             # Editorial blog posts & categories
    │   ├── company/          # Agency company details & ID card configurations
    │   ├── country/          # Country option list
    │   ├── dashboard/        # KPI analytics & overview counts
    │   ├── designation/      # Job designations for employees
    │   ├── dynamicContent/   # CMS pages & site content
    │   ├── employee/         # Staff profiles & payroll ledger
    │   ├── errorLog/         # Application error logging
    │   ├── folder/           # Media library folder structure
    │   ├── history/          # Record revision history
    │   ├── inquiries/        # Contact messages & quotation requests
    │   ├── media-library/    # R2 file uploads & Media Bin (soft delete/restore)
    │   ├── notification/     # Admin notifications & Socket.IO broadcasts
    │   ├── pageView/         # Analytics traffic & visitor counts
    │   ├── permissions/      # System permission definitions
    │   ├── project/          # Development projects & stages
    │   ├── property/         # Real estate property listings & amenities
    │   ├── report/           # Analytics summary reports
    │   ├── review/           # Customer testimonials & reviews
    │   ├── role/             # Custom roles & permission assignments
    │   ├── rolePermission/   # Role-to-Permission mapping
    │   ├── servicesCountry/  # Service country list
    │   ├── sitemap/          # Dynamic SEO sitemap generator
    │   └── user/             # User account management & employee directory
    └── utils/                # Response formatters, R2 storage helpers, catchAsync
```

---

## Modular Architecture

Each feature module is contained in its own folder under `src/app/modules/<module-name>/`:

```
<module-name>/
├── <module>.interface.ts     # TypeScript interfaces & types
├── <module>.model.ts         # Mongoose Schema & Model definition
├── <module>.validation.ts    # Zod request validation schemas
├── <module>.controller.ts    # Express request/response handlers
├── <module>.service.ts       # Business logic & database operations
└── <module>.routes.ts        # Express route definitions with auth & RBAC middleware
```

Scaffold a new feature module using:
```bash
npm run create-module
```

---

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Configuration

Create `.env` (or `.env.development`) in the root directory:

```ini
NODE_ENV=development
PORT=5005
SERVER_URL=http://localhost:5005

# Database
DB_URL=mongodb://127.0.0.1:27017/zoom-property

# Authentication
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_SECRET=change-me-access-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_REFRESH_EXPIRES_IN=365d
JWT_OTP_SECRET=change-me-otp-secret
JWT_PASS_RESET_SECRET=change-me-reset-secret
JWT_PASS_RESET_EXPIRES_IN=10m

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret
R2_BUCKET=your-r2-bucket
R2_PUBLIC_URL=https://media.zoomproperty.com

# Email (Nodemailer)
SENDER_EMAIL=noreply@zoomproperty.com
SENDER_APP_PASS=your-email-password

# Initial Super Admin Seed
ADMIN_EMAIL=admin@zoomproperty.com
ADMIN_PASSWORD=change-me-admin-password
ADMIN_NAME=Super Admin
```

### 3. Seed Super Admin

```bash
npm run seed:user
```

### 4. Run Server

```bash
npm run dev      # Runs development server with hot reload (ts-node-dev) on http://localhost:5005/api
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload (`ts-node-dev`) |
| `npm run build` | Compile TypeScript to JavaScript in `dist/` |
| `npm start` | Run compiled production server (`node dist/server.js`) |
| `npm run seed:user` | Seed initial Super Admin account |
| `npm run seed:media` | Seed default media library records |
| `npm run create-module` | Scaffold a new feature module |

---

## Core Conventions

- **API Mounting**: All REST API routes are mounted under `/api` (e.g. `POST /api/auth/login`, `GET /api/properties`).
- **Standard Envelope**: All API responses return `{ success: boolean, message?: string, data: any, meta?: any }`.
- **RBAC Enforcement**: Routes are protected by `auth()` and `checkPermission("<Module>", "<action>")`.
- **Reference Numbers**: Property listings automatically receive sequence reference numbers (e.g. `ZP-2026-0001`).
- **Soft Deletes**: Deletions move items to soft-delete state (`isDeleted: true`) or Media Bin before permanent purging.
