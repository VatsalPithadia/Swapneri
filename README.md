# Swapneri — Tailor Management System
> **Production-grade web application tailored for ladies' boutiques and women's custom tailoring shops.**  
> Built with Next.js 16 (App Router), TypeScript (strict mode), Tailwind CSS, and Supabase PostgreSQL. Engineered for web-first deployment with direct shared-code architecture for a future React Native (Expo) mobile application.

---

## 🌸 Design & User Experience Philosophy
- **Calm, uncluttered aesthetic**: Designed specifically for busy boutique owners and master tailors who need zero visual noise.
- **Color Palette**: Pristine warm stone background (`#FAF9F5`), clean white surfaces, deep wine/maroon accent (`#881337`), and soft pastel status badges.
- **Typography**: Refined serif titles (**Fraunces**) paired with high-legibility UI sans-serif (**DM Sans** / **Inter**).
- **Indian Boutique Standards**:
  - Currency formatted in Indian Rupees with authentic lakh/crore grouping (`₹ 1,25,000`).
  - Dates in `DD/MM/YYYY` format.
  - 10-digit Indian mobile number validation with instant `wa.me` WhatsApp links for order confirmations, trial notifications, delivery pickup alerts, and payment receipts.
  - Browser-native `@media print` layouts for printing measurement cards (for cutting tables) and client invoices without any paid PDF service.

---

## 📁 Monorepo Folder Structure

The project is organized into two isolated and clear packages: **`FRONTEND`** and **`BACKEND`**.

```text
SWAPNERI/
├── FRONTEND/                             # Next.js 16 Web Application (Port 3000)
│   ├── app/                              # Next.js App Router (Pages & Layouts)
│   │   ├── (dashboard)/                  # Boutique Workshop & Operations
│   │   │   ├── page.tsx                  # Dashboard Overview
│   │   │   ├── orders/                   # Orders Pipeline & Creation
│   │   │   ├── customers/                # Customer Directory & Profiles
│   │   │   ├── measurements/             # Fitting Slips & Measurements
│   │   │   ├── payments/                 # Financial Ledger & Receipts
│   │   │   ├── expenses/                 # Boutique Expense Tracking
│   │   │   ├── reports/                  # Monthly Revenue & Analytics
│   │   │   └── settings/                 # Garment Pricing & Shop Setup
│   │   ├── layout.tsx                    # Root Layout
│   │   └── globals.css                   # Tailwind Styles
│   ├── components/                       # Reusable UI & Layout Components
│   │   ├── ui/                           # Button, Modal, Input, Badge
│   │   └── layout/                       # Sidebar, Header, Navigation
│   ├── lib/                              # Frontend Services & Utilities
│   │   ├── services/                     # Data Access Layer
│   │   ├── shared/                       # Shared Types & Calculations
│   │   └── supabase/                     # Supabase Client
│   ├── public/                           # Static Assets & Icons
│   ├── tests/                            # Vitest Unit Tests (29 tests)
│   ├── package.json                      # Frontend Dependencies & Scripts
│   └── tsconfig.json                     # Frontend TypeScript Config
│
├── BACKEND/                              # Express REST API Server (Port 5000)
│   ├── src/
│   │   ├── controllers/                  # Route Controllers
│   │   │   ├── customers.controller.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── expenses.controller.ts
│   │   │   ├── measurements.controller.ts
│   │   │   └── shop.controller.ts
│   │   ├── routes/                       # Express API Endpoints (/api/...)
│   │   │   ├── customers.routes.ts
│   │   │   ├── orders.routes.ts
│   │   │   ├── payments.routes.ts
│   │   │   ├── expenses.routes.ts
│   │   │   ├── measurements.routes.ts
│   │   │   ├── shop.routes.ts
│   │   │   └── index.ts                  # Main API Router
│   │   ├── services/                     # Database Access Layer (Supabase)
│   │   ├── config/                       # Supabase & Environment Config
│   │   ├── shared/                       # Shared Types & Zod Schemas
│   │   └── server.ts                     # Express Server Entrypoint
│   ├── database/                         # PostgreSQL Setup & Migrations
│   │   ├── complete_setup.sql            # Master Turnkey Database Setup
│   │   └── seed.sql                      # Garment Types & Defaults
│   ├── package.json                      # Backend Dependencies & Scripts
│   └── tsconfig.json                     # Backend TypeScript Config
│
├── package.json                          # Monorepo Workspace Root Scripts
└── README.md                             # Documentation
```

---

## 🚀 Running the Project

From the project root:

| Command | Action |
|---|---|
| `npm run dev` | Runs **both** `FRONTEND` (:3000) and `BACKEND` (:5000) concurrently |
| `npm run dev:frontend` | Runs only the Next.js Frontend |
| `npm run dev:backend` | Runs only the Express REST API Backend |
| `npm run test` | Runs all 29 automated tests |
│   │   ├── measurements/             # Global Measurement Book
│   │   │   ├── page.tsx              # Searchable measurement profiles
│   │   │   └── print/[id]/           # Workshop cutting-table measurement card
│   │   ├── payments/                 # Financial register & settlements
│   │   ├── expenses/                 # Boutique expense tracker (fabric, threads, rent)
│   │   ├── reports/                  # Monthly P&L analytics & CSV exports
│   │   └── settings/                 # Boutique profile, default pricing & karigars
│   ├── layout.tsx                    # Root layout with fonts & React Query Provider
│   └── globals.css                   # Tailwind tokens, print styles, custom scrollbars
│
├── components/                       # Reusable UI Primitives
│   ├── layout/                       # Sidebar, MobileNav, TopHeader
│   └── ui/                           # Button, Input, Modal, Badge
│
├── lib/
│   ├── shared/                       # ⭐️ 100% SHARED LOGIC (Web + Expo Mobile App)
│   │   ├── types/                    # PostgreSQL models, DTOs, and domain entities
│   │   │   └── database.ts
│   │   ├── constants/                # Garments, status lifecycles, WhatsApp templates
│   │   │   ├── garments.ts           # Blouse, Kurti, Salwar, Lehenga specs
│   │   │   ├── order-status.ts       # 6-stage lifecycle (Received → Delivered)
│   │   │   └── whatsapp-templates.ts # Prefilled WhatsApp message generators
│   │   ├── calculations/             # Pure mathematical & business engines
│   │   │   ├── currency.ts           # Lakh grouping, balances, overpayment guard
│   │   │   └── measurements.ts       # Inches ↔ cm conversion & fraction parsing (14½")
│   │   ├── validation/               # Zod validation schemas
│   │   │   ├── customer.schema.ts    # Indian 10-digit phone regex validation
│   │   │   ├── measurement.schema.ts # Garment measurement values validation
│   │   │   ├── order.schema.ts       # Multi-item order validation
│   │   │   └── payment.schema.ts     # Payment amount & mode validation
│   │   └── i18n/                     # Internationalization (English, Hindi, Gujarati)
│   │       └── index.ts
│   ├── services/                     # Dual data layer: Live Supabase + Offline DemoStore
│   └── supabase/                     # Supabase client & server instances
│
├── supabase/                         # Database Engine
│   ├── migrations/
│   │   ├── 001_initial_schema.sql    # 11 normalized tables with foreign keys & indexes
│   │   ├── 002_views_and_functions.sql # Automatic financial triggers & audit log
│   │   └── 003_rls_policies.sql      # Multi-tenant Row Level Security & Realtime
│   └── seed.sql                      # Realistic demo boutique data
│
└── tests/                            # Test Suite
    └── unit/                         # Vitest unit tests (19 tests passing)
```

---

## 👗 Supported Garment Types & Measurement Specifications

The application includes specialized women's tailoring measurement schemas with bilingual labels (English + Hindi), inch/centimeter toggles, and fractional adjustments (`14 1/2"`, `36 1/4"`):

1. **Blouse (ब्लाउज)**:
   - Blouse Length, Bust, Upper Bust, Waist, Shoulder, Sleeve Length, Sleeve Round, Armhole, Front Neck Depth, Back Neck Depth, Dart Point, Across Front, Across Back.
2. **Kurti / Kameez (कुर्ती / कमीज)**:
   - Kurti Length, Bust, Waist, Hip, Shoulder, Sleeve Length, Sleeve Round, Armhole, Front Neck Depth, Back Neck Depth, Slit Height.
3. **Salwar / Pant / Palazzo / Churidar (सलवार / पैंट)**:
   - Bottom Length, Waist, Hip, Thigh Round, Knee Round, Calf Round, Ankle/Mori, Rise/Seat.
4. **Lehenga / Chaniya (लहंगा)**:
   - Lehenga Length, Waist, Hip, Flare/Ghera, plus Blouse specifications.
5. **Gown / Western Dress (गाउन)**:
   - Full Length, Yoke Length, Bust, Waist, Hip, Shoulder, Neck, Flare.
6. **Skirt & Petticoat (स्कर्ट / पेटीकोट)**:
   - Length, Waist, Hip, Mori/Bottom Flare.

---

## 🗄️ Database Architecture & PostgreSQL Schema

The database is built on **Supabase PostgreSQL** with strict normalization and safety:

- **Row Level Security (RLS)**: Enforced on all tables. Tailors can only ever view and edit their own shop's data (`auth.uid() = owner_id`).
- **Audit History**: `order_status_history` records every lifecycle stage change with timestamp, previous stage, and notes.
- **Financial Calculation Trigger**: `recalculate_order_financials()` runs inside PostgreSQL on every payment insert/delete/update, recalculating total paid, outstanding balance, and setting order payment status (`unpaid`, `partial`, `paid`).
- **Unique Per Shop**: Customer phone numbers are constrained unique per shop (`shop_id, phone`) to prevent accidental duplicate customer records while allowing different shops to have overlapping clientele.
- **Overpayment Guard**: Server and client guard checks prevent recording payments exceeding the outstanding order balance.

---

## 🚀 Setup Guide: Supabase Free Tier Setup

Follow these steps to connect your own free Supabase project:

### 1. Create a Free Supabase Project
1. Visit [supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New Project**.
3. Choose a name (e.g. `Swapneri Boutique`), a secure database password, and your nearest region (e.g., `South Asia (Mumbai)`).
4. Wait 1-2 minutes for the database cluster to provision.

### 2. Run Database Migrations
1. In your Supabase dashboard, click **SQL Editor** on the left menu.
2. Open [001_initial_schema.sql](file:///c:/Users/vatsal/OneDrive/Desktop/SWAPNERI/supabase/migrations/001_initial_schema.sql), paste the content into the SQL Editor, and click **Run**.
3. Open [002_views_and_functions.sql](file:///c:/Users/vatsal/OneDrive/Desktop/SWAPNERI/supabase/migrations/002_views_and_functions.sql), paste and click **Run**.
4. Open [003_rls_policies.sql](file:///c:/Users/vatsal/OneDrive/Desktop/SWAPNERI/supabase/migrations/003_rls_policies.sql), paste and click **Run**.
5. *(Optional Demo Data)*: Run [seed.sql](file:///c:/Users/vatsal/OneDrive/Desktop/SWAPNERI/supabase/seed.sql) to populate demo customers, garments, karigars, and orders.

### 3. Setup Storage for Reference Photos
1. In your Supabase dashboard, click **Storage**.
2. Click **New Bucket**, name it `reference-photos`.
3. Toggle **Public bucket** ON (or keep private with authenticated policies for client access).
4. Click **Save**.

### 4. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Add your project credentials found in **Project Settings → API**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

> **Note**: Even without Supabase keys configured, the application automatically runs seamlessly in **Demo Mode** using its built-in reactive storage engine with pre-seeded boutique data!

---

## 💻 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests (Vitest)
npm test

# 3. Start local development server
npm run dev

# 4. Or build and run production server
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying to Vercel (Free Tier)

1. Push your repository to GitHub.
2. Visit [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click **Deploy**. Vercel will build and launch your application globally with automatic SSL and continuous deployment.

---

## 📱 Future Mobile App (React Native / Expo) Integration

The architecture is built from day one to power both the website and the upcoming React Native mobile app:

```text
               ┌───────────────────────────────┐
               │    Supabase Cloud Backend     │
               │  - Auth (Email/Google)        │
               │  - Postgres DB with RLS       │
               │  - Realtime Publications      │
               │  - Storage (Reference Photos) │
               └──────────────┬────────────────┘
                              │
             ┌────────────────┴────────────────┐
             │                                 │
     Next.js Web App                 Expo React Native App
 (Desktop & Tablet Web)             (Tailor Workshop Mobile)
             │                                 │
             └────────────────┬────────────────┘
                              │
               ┌──────────────▼────────────────┐
               │         @lib/shared           │
               │  - Database Types             │
               │  - Garment & Measurement Meta │
               │  - Order Status Steppers      │
               │  - Currency & Lakh Grouping   │
               │  - Fractional Inches Math     │
               │  - Zod Validation Schemas     │
               │  - WhatsApp URL Prefills      │
               │  - i18n Dictionaries          │
               └───────────────────────────────┘
```

### How the Expo App Will Connect:
1. **Direct Shared Logic**: The Expo app can import `lib/shared` as a local monorepo workspace package (or submodule), reusing all Zod schemas, currency calculators, fraction converters, and garment configurations without writing them twice.
2. **Same Supabase Instance**: The mobile app will initialize `@supabase/supabase-js` with the exact same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Shared Authentication**: When a tailor logs in on their phone with their email/password or Google, Supabase Auth assigns their same `shop_id`.
4. **Live Synchronization**: Because Supabase Realtime is enabled on `orders`, `customers`, and `payments`, any order status updated on the cutting table via the mobile app updates on the shop desktop counter instantaneously!
