-- ==============================================================================
-- 001_initial_schema.sql
-- Tailor Management System for Women's Boutiques & Ladies' Tailors
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SHOPS TABLE
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    address TEXT,
    logo_url TEXT,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    measurement_unit VARCHAR(10) NOT NULL DEFAULT 'inches' CHECK (measurement_unit IN ('inches', 'cm')),
    invoice_prefix VARCHAR(10) NOT NULL DEFAULT 'SW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PROFILES TABLE (Associated with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'tailor', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CUSTOMERS TABLE (with soft delete)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    address TEXT,
    birthday DATE,
    anniversary DATE,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Phone must be unique per shop among active (non-deleted) customers
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_shop_phone_unique 
ON public.customers (shop_id, phone) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_shop_name 
ON public.customers (shop_id, name);

-- 4. GARMENT TYPES TABLE
CREATE TABLE IF NOT EXISTS public.garment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE, -- NULL for system defaults
    code VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    default_price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (default_price >= 0),
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_garment_types_shop ON public.garment_types (shop_id, code);

-- 5. MEASUREMENT FIELDS DEFINITION TABLE
CREATE TABLE IF NOT EXISTS public.measurement_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    garment_code VARCHAR(50) NOT NULL,
    field_key VARCHAR(50) NOT NULL,
    label_en TEXT NOT NULL,
    label_hi TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_measurement_fields_garment ON public.measurement_fields (garment_code, sort_order);

-- 6. MEASUREMENT PROFILES TABLE (Multiple per customer, historical preservation)
CREATE TABLE IF NOT EXISTS public.measurement_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    garment_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'inches' CHECK (unit IN ('inches', 'cm')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_measurement_profiles_customer ON public.measurement_profiles (customer_id, garment_type, created_at DESC);

-- 7. MEASUREMENT VALUES TABLE
CREATE TABLE IF NOT EXISTS public.measurement_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.measurement_profiles(id) ON DELETE CASCADE,
    field_key VARCHAR(50) NOT NULL,
    value NUMERIC(6,2) NOT NULL CHECK (value >= 0),
    fraction VARCHAR(10) DEFAULT '',
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_measurement_values_profile ON public.measurement_values (profile_id);

-- 8. WORKERS (Karigars / Master Tailors)
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone VARCHAR(20),
    specialty VARCHAR(50) NOT NULL DEFAULT 'all',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workers_shop ON public.workers (shop_id);

-- 9. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    trial_date DATE,
    delivery_date DATE NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
    status VARCHAR(30) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'cutting', 'stitching', 'finishing', 'ready', 'delivered', 'cancelled')),
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    net_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (net_amount >= 0),
    paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    balance_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (balance_amount >= 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON public.orders (shop_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders (shop_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders (customer_id);

-- 10. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    garment_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    total_price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
    design_notes TEXT,
    fabric_source VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (fabric_source IN ('customer', 'shop')),
    fabric_details TEXT,
    measurement_profile_id UUID REFERENCES public.measurement_profiles(id) ON DELETE SET NULL,
    assigned_worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
    reference_photos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);

-- 11. ORDER STATUS HISTORY AUDIT LOG
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_history_order ON public.order_status_history (order_id, created_at DESC);

-- 12. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer')),
    transaction_ref TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_shop_order ON public.payments (shop_id, order_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments (shop_id, payment_date DESC);

-- 13. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('fabric', 'thread_accessories', 'rent', 'salary', 'electricity', 'repairs', 'other')),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_to TEXT,
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_shop_date ON public.expenses (shop_id, expense_date DESC);

-- 14. SHOP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.shop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID UNIQUE NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    whatsapp_template_order_confirm TEXT,
    whatsapp_template_trial_ready TEXT,
    whatsapp_template_delivery_ready TEXT,
    whatsapp_template_payment_reminder TEXT,
    terms_and_conditions TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
