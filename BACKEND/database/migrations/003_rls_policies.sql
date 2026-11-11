-- ==============================================================================
-- 003_rls_policies.sql
-- Row Level Security (RLS) for Shop Multi-Tenancy & Data Isolation
-- ==============================================================================

-- 1. HELPER FUNCTION TO GET CURRENT USER'S SHOP ID
CREATE OR REPLACE FUNCTION public.current_shop_id()
RETURNS UUID AS $$
    SELECT shop_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. ENABLE RLS ON ALL TABLES
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

-- 3. POLICIES: SHOPS
CREATE POLICY "Users can view their own shop"
ON public.shops FOR SELECT
USING (id = public.current_shop_id());

CREATE POLICY "Owners can update their own shop"
ON public.shops FOR UPDATE
USING (id = public.current_shop_id());

-- 4. POLICIES: PROFILES
CREATE POLICY "Users can view profiles in their shop"
ON public.profiles FOR SELECT
USING (shop_id = public.current_shop_id());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- 5. POLICIES: CUSTOMERS
CREATE POLICY "Shop users can view customers"
ON public.customers FOR SELECT
USING (shop_id = public.current_shop_id());

CREATE POLICY "Shop users can create customers"
ON public.customers FOR INSERT
WITH CHECK (shop_id = public.current_shop_id());

CREATE POLICY "Shop users can update customers"
ON public.customers FOR UPDATE
USING (shop_id = public.current_shop_id());

CREATE POLICY "Shop users can soft delete customers"
ON public.customers FOR DELETE
USING (shop_id = public.current_shop_id());

-- 6. POLICIES: GARMENT TYPES (Shop custom + System defaults)
CREATE POLICY "View garment types"
ON public.garment_types FOR SELECT
USING (shop_id IS NULL OR shop_id = public.current_shop_id());

CREATE POLICY "Manage custom garment types"
ON public.garment_types FOR ALL
USING (shop_id = public.current_shop_id())
WITH CHECK (shop_id = public.current_shop_id());

-- 7. POLICIES: MEASUREMENT FIELDS
CREATE POLICY "View measurement fields"
ON public.measurement_fields FOR SELECT
USING (shop_id IS NULL OR shop_id = public.current_shop_id());

CREATE POLICY "Manage custom measurement fields"
ON public.measurement_fields FOR ALL
USING (shop_id = public.current_shop_id())
WITH CHECK (shop_id = public.current_shop_id());

-- 8. POLICIES: MEASUREMENT PROFILES
CREATE POLICY "Manage measurement profiles"
ON public.measurement_profiles FOR ALL
USING (shop_id = public.current_shop_id())
WITH CHECK (shop_id = public.current_shop_id());

-- 9. POLICIES: MEASUREMENT VALUES
CREATE POLICY "Manage measurement values"
ON public.measurement_values FOR ALL
USING (
    profile_id IN (
        SELECT id FROM public.measurement_profiles WHERE shop_id = public.current_shop_id()
    )
);

-- 10. POLICIES: WORKERS
CREATE POLICY "Manage shop workers"
ON public.workers FOR ALL
USING (shop_id = public.current_shop_id())
WITH CHECK (shop_id = public.current_shop_id());

-- 11. POLICIES: ORDERS
CREATE POLICY "Manage shop orders"
ON public.orders FOR ALL
USING (shop_id = public.current_shop_id())
WITH CHECK (shop_id = public.current_shop_id());

-- 12. POLICIES: ORDER ITEMS
CREATE POLICY "Manage order items"
ON public.order_items FOR ALL
USING (
    order_id IN (
        SELECT id FROM public.orders WHERE shop_id = public.current_shop_id()
    )
);

-- 13. POLICIES: ORDER STATUS HISTORY
CREATE POLICY "View order status history"
ON public.order_status_history FOR SELECT
USING (
    order_id IN (
        SELECT id FROM public.orders WHERE shop_id = public.current_shop_id()
    )
);

CREATE POLICY "Insert order status history"
ON public.order_status_history FOR INSERT
WITH CHECK (
    order_id IN (
        SELECT id FROM public.orders WHERE shop_id = public.current_shop_id()
    )
);

-- 14. POLICIES: PAYMENTS
CREATE POLICY "Manage payments"
ON public.payments FOR ALL
USING (shop_id = public.current_shop_id())
WITH CHECK (shop_id = public.current_shop_id());

-- 15. POLICIES: EXPENSES
CREATE POLICY "Manage expenses"
ON public.expenses FOR ALL
USING (shop_id = public.current_shop_id())
WITH CHECK (shop_id = public.current_shop_id());

-- 16. POLICIES: SHOP SETTINGS
CREATE POLICY "Manage shop settings"
ON public.shop_settings FOR ALL
USING (shop_id = public.current_shop_id())
WITH CHECK (shop_id = public.current_shop_id());

-- 17. ENABLE REALTIME REPLICATION FOR CORE TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
