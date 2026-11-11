-- ==============================================================================
-- SWAPNERI BOUTIQUE - COMPLETE SUPABASE SETUP SCRIPT
-- Tailor Management System for Women's Boutiques & Ladies' Tailors
-- 100% English, Zero Sample Records, Multi-Tenant RLS & Auto-Setup Trigger
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. SHOPS TABLE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 2. PROFILES TABLE (Associated with auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'tailor', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper function to get current user's shop_id from profile (with default boutique fallback)
CREATE OR REPLACE FUNCTION public.current_shop_id()
RETURNS UUID AS $$
DECLARE
    v_shop_id UUID;
BEGIN
    SELECT shop_id INTO v_shop_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
    IF v_shop_id IS NOT NULL THEN
        RETURN v_shop_id;
    END IF;

    SELECT id INTO v_shop_id FROM public.shops ORDER BY created_at ASC LIMIT 1;
    RETURN v_shop_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Trigger function to auto-assign shop_id on insert if omitted
CREATE OR REPLACE FUNCTION public.set_shop_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.shop_id IS NULL THEN
        NEW.shop_id := public.current_shop_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 3. CUSTOMERS TABLE (with soft delete)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
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

DROP TRIGGER IF EXISTS trg_customers_shop_id ON public.customers;
CREATE TRIGGER trg_customers_shop_id
BEFORE INSERT ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_shop_id();

CREATE INDEX IF NOT EXISTS idx_customers_shop_phone 
ON public.customers (shop_id, phone) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_shop_name 
ON public.customers (shop_id, name);

-- ------------------------------------------------------------------------------
-- 4. GARMENT TYPES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.garment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    default_price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (default_price >= 0),
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_garment_types_shop_id ON public.garment_types;
CREATE TRIGGER trg_garment_types_shop_id
BEFORE INSERT ON public.garment_types
FOR EACH ROW EXECUTE FUNCTION public.set_shop_id();

CREATE INDEX IF NOT EXISTS idx_garment_types_shop ON public.garment_types (shop_id, code);

-- ------------------------------------------------------------------------------
-- 5. MEASUREMENT FIELDS DEFINITION TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.measurement_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    garment_code VARCHAR(50) NOT NULL,
    field_key VARCHAR(50) NOT NULL,
    label_en TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_measurement_fields_garment ON public.measurement_fields (garment_code, sort_order);

-- ------------------------------------------------------------------------------
-- 6. MEASUREMENT PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.measurement_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    garment_type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'inches' CHECK (unit IN ('inches', 'cm')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_measurement_profiles_shop_id ON public.measurement_profiles;
CREATE TRIGGER trg_measurement_profiles_shop_id
BEFORE INSERT ON public.measurement_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_shop_id();

CREATE INDEX IF NOT EXISTS idx_measurement_profiles_customer ON public.measurement_profiles (customer_id, garment_type, created_at DESC);

-- ------------------------------------------------------------------------------
-- 7. MEASUREMENT VALUES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.measurement_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.measure
    ment_profiles(id) ON DELETE CASCADE,
    field_key VARCHAR(50) NOT NULL,
    value NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (value >= 0),
    fraction VARCHAR(10) DEFAULT '',
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_measurement_values_profile ON public.measurement_values (profile_id);

-- ------------------------------------------------------------------------------
-- 8. WORKERS (Karigars / Tailors)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone VARCHAR(20),
    specialty VARCHAR(50) NOT NULL DEFAULT 'all',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_workers_shop_id ON public.workers;
CREATE TRIGGER trg_workers_shop_id
BEFORE INSERT ON public.workers
FOR EACH ROW EXECUTE FUNCTION public.set_shop_id();

CREATE INDEX IF NOT EXISTS idx_workers_shop ON public.workers (shop_id);

-- ------------------------------------------------------------------------------
-- 9. ORDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_number VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    trial_date DATE DEFAULT NULL,
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

DROP TRIGGER IF EXISTS trg_orders_shop_id ON public.orders;
CREATE TRIGGER trg_orders_shop_id
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_shop_id();

CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON public.orders (shop_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders (shop_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders (customer_id);

-- ------------------------------------------------------------------------------
-- 10. ORDER ITEMS TABLE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 11. ORDER STATUS HISTORY AUDIT LOG
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 12. PAYMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer')),
    transaction_ref TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_payments_shop_id ON public.payments;
CREATE TRIGGER trg_payments_shop_id
BEFORE INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.set_shop_id();

CREATE INDEX IF NOT EXISTS idx_payments_shop_order ON public.payments (shop_id, order_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments (shop_id, payment_date DESC);

-- ------------------------------------------------------------------------------
-- 13. EXPENSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('fabric', 'thread_accessories', 'rent', 'salary', 'electricity', 'repairs', 'other')),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_to TEXT,
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_expenses_shop_id ON public.expenses;
CREATE TRIGGER trg_expenses_shop_id
BEFORE INSERT ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.set_shop_id();

CREATE INDEX IF NOT EXISTS idx_expenses_shop_date ON public.expenses (shop_id, expense_date DESC);

-- ------------------------------------------------------------------------------
-- 14. SHOP SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID UNIQUE NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    whatsapp_template_order_confirm TEXT,
    whatsapp_template_delivery_ready TEXT,
    whatsapp_template_payment_reminder TEXT,
    terms_and_conditions TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_shop_settings_shop_id ON public.shop_settings;
CREATE TRIGGER trg_shop_settings_shop_id
BEFORE INSERT ON public.shop_settings
FOR EACH ROW EXECUTE FUNCTION public.set_shop_id();

-- ------------------------------------------------------------------------------
-- 15. AUTOMATED TRIGGERS & RECALCULATIONS
-- ------------------------------------------------------------------------------

-- Recalculate order financial balance on payments
CREATE OR REPLACE FUNCTION public.recalculate_order_financials(target_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_net_amount NUMERIC(10,2);
    v_paid_amount NUMERIC(10,2);
    v_balance_amount NUMERIC(10,2);
    v_payment_status VARCHAR(20);
BEGIN
    SELECT (total_amount - discount_amount) INTO v_net_amount
    FROM public.orders
    WHERE id = target_order_id;

    IF v_net_amount IS NULL THEN
        RETURN;
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO v_paid_amount
    FROM public.payments
    WHERE order_id = target_order_id;

    v_balance_amount := GREATEST(0, v_net_amount - v_paid_amount);

    IF v_paid_amount >= v_net_amount AND v_net_amount > 0 THEN
        v_payment_status := 'paid';
    ELSIF v_paid_amount > 0 THEN
        v_payment_status := 'partial';
    ELSE
        v_payment_status := 'unpaid';
    END IF;

    UPDATE public.orders
    SET net_amount = v_net_amount,
        paid_amount = v_paid_amount,
        balance_amount = v_balance_amount,
        payment_status = v_payment_status,
        updated_at = now()
    WHERE id = target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_payments_financial_update()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM public.recalculate_order_financials(OLD.order_id);
        RETURN OLD;
    ELSE
        PERFORM public.recalculate_order_financials(NEW.order_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_financials ON public.payments;
CREATE TRIGGER trg_payment_financials
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.trigger_payments_financial_update();

-- Auto update order total amount when order items change
CREATE OR REPLACE FUNCTION public.trigger_order_items_total_update()
RETURNS TRIGGER AS $$
DECLARE
    target_order_id UUID;
    v_total NUMERIC(10,2);
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_order_id := OLD.order_id;
    ELSE
        target_order_id := NEW.order_id;
    END IF;

    SELECT COALESCE(SUM(total_price), 0) INTO v_total
    FROM public.order_items
    WHERE order_id = target_order_id;

    UPDATE public.orders
    SET total_amount = v_total
    WHERE id = target_order_id;

    PERFORM public.recalculate_order_financials(target_order_id);

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_order_items_total ON public.order_items;
CREATE TRIGGER trg_order_items_total
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.trigger_order_items_total_update();

-- Auto update net and balance when order totals change
CREATE OR REPLACE FUNCTION public.trigger_orders_financial_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.net_amount := GREATEST(0, NEW.total_amount - NEW.discount_amount);
    NEW.balance_amount := GREATEST(0, NEW.net_amount - NEW.paid_amount);
    
    IF NEW.paid_amount >= NEW.net_amount AND NEW.net_amount > 0 THEN
        NEW.payment_status := 'paid';
    ELSIF NEW.paid_amount > 0 THEN
        NEW.payment_status := 'partial';
    ELSE
        NEW.payment_status := 'unpaid';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_financials ON public.orders;
CREATE TRIGGER trg_orders_financials
BEFORE INSERT OR UPDATE OF total_amount, discount_amount ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_orders_financial_update();

-- Sequential Order Number Generator
CREATE OR REPLACE FUNCTION public.generate_order_number(p_shop_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_count INT;
    v_year TEXT;
BEGIN
    SELECT COALESCE(invoice_prefix, 'SW') INTO v_prefix
    FROM public.shops
    WHERE id = p_shop_id;

    v_year := to_char(CURRENT_DATE, 'YY');

    SELECT COUNT(*) + 1 INTO v_count
    FROM public.orders
    WHERE shop_id = p_shop_id;

    RETURN v_prefix || '-' || v_year || LPAD(v_count::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

-- Shops
CREATE POLICY "Users can view their own shop" ON public.shops FOR SELECT USING (id = public.current_shop_id());
CREATE POLICY "Owners can update their own shop" ON public.shops FOR UPDATE USING (id = public.current_shop_id());

-- Profiles
CREATE POLICY "Users can view profiles in their shop" ON public.profiles FOR SELECT USING (shop_id = public.current_shop_id());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Customers
CREATE POLICY "Shop users can view customers" ON public.customers FOR SELECT USING (shop_id = public.current_shop_id());
CREATE POLICY "Shop users can insert customers" ON public.customers FOR INSERT WITH CHECK (shop_id = public.current_shop_id());
CREATE POLICY "Shop users can update customers" ON public.customers FOR UPDATE USING (shop_id = public.current_shop_id());
CREATE POLICY "Shop users can delete customers" ON public.customers FOR DELETE USING (shop_id = public.current_shop_id());

-- Garment Types
CREATE POLICY "View garment types" ON public.garment_types FOR SELECT USING (shop_id IS NULL OR shop_id = public.current_shop_id());
CREATE POLICY "Manage garment types" ON public.garment_types FOR ALL USING (shop_id = public.current_shop_id()) WITH CHECK (shop_id = public.current_shop_id());

-- Measurement Profiles & Values
CREATE POLICY "Manage measurement profiles" ON public.measurement_profiles FOR ALL USING (shop_id = public.current_shop_id()) WITH CHECK (shop_id = public.current_shop_id());
CREATE POLICY "Manage measurement values" ON public.measurement_values FOR ALL USING (
    profile_id IN (SELECT id FROM public.measurement_profiles WHERE shop_id = public.current_shop_id())
);

-- Workers
CREATE POLICY "Manage workers" ON public.workers FOR ALL USING (shop_id = public.current_shop_id()) WITH CHECK (shop_id = public.current_shop_id());

-- Orders & Items
CREATE POLICY "Manage orders" ON public.orders FOR ALL USING (shop_id = public.current_shop_id()) WITH CHECK (shop_id = public.current_shop_id());
CREATE POLICY "Manage order items" ON public.order_items FOR ALL USING (
    order_id IN (SELECT id FROM public.orders WHERE shop_id = public.current_shop_id())
);
CREATE POLICY "Manage status history" ON public.order_status_history FOR ALL USING (
    order_id IN (SELECT id FROM public.orders WHERE shop_id = public.current_shop_id())
);

-- Payments & Expenses
CREATE POLICY "Manage payments" ON public.payments FOR ALL USING (shop_id = public.current_shop_id()) WITH CHECK (shop_id = public.current_shop_id());
CREATE POLICY "Manage expenses" ON public.expenses FOR ALL USING (shop_id = public.current_shop_id()) WITH CHECK (shop_id = public.current_shop_id());

-- Shop Settings
CREATE POLICY "Manage shop settings" ON public.shop_settings FOR ALL USING (shop_id = public.current_shop_id()) WITH CHECK (shop_id = public.current_shop_id());

-- ------------------------------------------------------------------------------
-- 17. AUTOMATIC USER REGISTRATION TRIGGER (AUTH -> BOUTIQUE SETUP)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_shop_id UUID;
    shop_title TEXT;
    owner_title TEXT;
    user_phone TEXT;
BEGIN
    shop_title := COALESCE(NEW.raw_user_meta_data->>'shop_name', 'Swapneri Boutique');
    owner_title := COALESCE(NEW.raw_user_meta_data->>'owner_name', 'Boutique Owner');
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '9820198201');

    -- 1. Create shop
    INSERT INTO public.shops (name, owner_name, phone, currency, measurement_unit, invoice_prefix)
    VALUES (shop_title, owner_title, user_phone, 'INR', 'inches', 'SW')
    RETURNING id INTO new_shop_id;

    -- 2. Create profile
    INSERT INTO public.profiles (id, shop_id, full_name, role)
    VALUES (NEW.id, new_shop_id, owner_title, 'owner');

    -- 3. Create shop settings
    INSERT INTO public.shop_settings (
        shop_id,
        whatsapp_template_order_confirm,
        whatsapp_template_delivery_ready,
        whatsapp_template_payment_reminder,
        terms_and_conditions
    ) VALUES (
        new_shop_id,
        'Hello {customer_name}! Thank you for your order {order_number} at ' || shop_title || '. Total: INR {total_amount}, Advance Paid: INR {paid_amount}, Balance: INR {balance_amount}. Delivery Date: {delivery_date}.',
        'Hello {customer_name}! Delighted to share that your order {order_number} is ready for pickup at ' || shop_title || '. Balance Payable: INR {balance_amount}. Looking forward to seeing you!',
        'Hello {customer_name}! Friendly reminder regarding pending balance of INR {balance_amount} for order {order_number} at ' || shop_title || '. Thank you!',
        '1. Complimentary alterations are provided within 7 days from the date of delivery. 2. Please present this bill or order confirmation at pickup. 3. Finished garments not collected within 45 days are subject to storage terms.'
    );

    -- 4. Insert default garment types with initial standard pricing
    INSERT INTO public.garment_types (shop_id, code, name, default_price, is_system, is_active, sort_order) VALUES
    (new_shop_id, 'blouse', 'Blouse', 850.00, true, true, 1),
    (new_shop_id, 'kurti', 'Kurti / Kameez', 650.00, true, true, 2),
    (new_shop_id, 'salwar_pant', 'Salwar / Pant / Palazzo', 550.00, true, true, 3),
    (new_shop_id, 'lehenga', 'Lehenga Choli', 2800.00, true, true, 4),
    (new_shop_id, 'anarkali', 'Anarkali Suit', 1800.00, true, true, 5),
    (new_shop_id, 'gown', 'Gown / Dress', 2200.00, true, true, 6),
    (new_shop_id, 'skirt', 'Skirt', 750.00, true, true, 7),
    (new_shop_id, 'petticoat', 'Petticoat', 350.00, true, true, 8);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 18. INITIALIZE DEFAULT BOUTIQUE & STANDARD GARMENT TYPES
-- ------------------------------------------------------------------------------
INSERT INTO public.shops (id, name, owner_name, phone, currency, measurement_unit, invoice_prefix)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Swapneri Boutique & Designer Studio', 'Boutique Owner', '9820198201', 'INR', 'inches', 'SW')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shop_settings (
    shop_id,
    whatsapp_template_order_confirm,
    whatsapp_template_delivery_ready,
    whatsapp_template_payment_reminder,
    terms_and_conditions
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Hello {customer_name}! Thank you for your order {order_number} at Swapneri Boutique. Total: INR {total_amount}, Advance Paid: INR {paid_amount}, Balance: INR {balance_amount}. Delivery Date: {delivery_date}.',
    'Hello {customer_name}! Delighted to share that your order {order_number} is ready for pickup at Swapneri Boutique. Balance Payable: INR {balance_amount}. Looking forward to seeing you!',
    'Hello {customer_name}! Friendly reminder regarding pending balance of INR {balance_amount} for order {order_number} at Swapneri Boutique. Thank you!',
    '1. Complimentary alterations are provided within 7 days from the date of delivery. 2. Please present this bill or order confirmation at pickup. 3. Finished garments not collected within 45 days are subject to storage terms.'
) ON CONFLICT (shop_id) DO NOTHING;

INSERT INTO public.garment_types (shop_id, code, name, default_price, is_system, is_active, sort_order) VALUES
('a0000000-0000-0000-0000-000000000001', 'blouse', 'Blouse', 850.00, true, true, 1),
('a0000000-0000-0000-0000-000000000001', 'kurti', 'Kurti / Kameez', 650.00, true, true, 2),
('a0000000-0000-0000-0000-000000000001', 'salwar_pant', 'Salwar / Pant / Palazzo', 550.00, true, true, 3),
('a0000000-0000-0000-0000-000000000001', 'lehenga', 'Lehenga Choli', 2800.00, true, true, 4),
('a0000000-0000-0000-0000-000000000001', 'anarkali', 'Anarkali Suit', 1800.00, true, true, 5),
('a0000000-0000-0000-0000-000000000001', 'gown', 'Gown / Dress', 2200.00, true, true, 6),
('a0000000-0000-0000-0000-000000000001', 'skirt', 'Skirt', 750.00, true, true, 7),
('a0000000-0000-0000-0000-000000000001', 'petticoat', 'Petticoat', 350.00, true, true, 8)
ON CONFLICT DO NOTHING;

-- Zero sample customers, Zero sample orders.
-- Database is ready for live dynamic operations!

