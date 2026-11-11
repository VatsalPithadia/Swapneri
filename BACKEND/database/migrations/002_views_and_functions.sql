-- ==============================================================================
-- 002_views_and_functions.sql
-- Automated Triggers, Balance Calculations, and Sequential Order Numbering
-- ==============================================================================

-- 1. FUNCTION: RECALCULATE ORDER FINANCIALS
CREATE OR REPLACE FUNCTION public.recalculate_order_financials(target_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_net_amount NUMERIC(10,2);
    v_paid_amount NUMERIC(10,2);
    v_balance_amount NUMERIC(10,2);
    v_payment_status VARCHAR(20);
BEGIN
    -- Calculate net amount from order
    SELECT (total_amount - discount_amount) INTO v_net_amount
    FROM public.orders
    WHERE id = target_order_id;

    IF v_net_amount IS NULL THEN
        RETURN;
    END IF;

    -- Sum up all recorded payments
    SELECT COALESCE(SUM(amount), 0) INTO v_paid_amount
    FROM public.payments
    WHERE order_id = target_order_id;

    -- Calculate balance
    v_balance_amount := GREATEST(0, v_net_amount - v_paid_amount);

    -- Determine status
    IF v_paid_amount >= v_net_amount AND v_net_amount > 0 THEN
        v_payment_status := 'paid';
    ELSIF v_paid_amount > 0 THEN
        v_payment_status := 'partial';
    ELSE
        v_payment_status := 'unpaid';
    END IF;

    -- Update order row
    UPDATE public.orders
    SET net_amount = v_net_amount,
        paid_amount = v_paid_amount,
        balance_amount = v_balance_amount,
        payment_status = v_payment_status,
        updated_at = now()
    WHERE id = target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TRIGGER: ON PAYMENTS CHANGE
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

-- 3. TRIGGER: ON ORDER TOTAL/DISCOUNT UPDATE
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

-- 4. TRIGGER: AUDIT ORDER STATUS TRANSITIONS
CREATE OR REPLACE FUNCTION public.trigger_order_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.order_status_history (
            order_id,
            from_status,
            to_status,
            changed_by,
            notes
        ) VALUES (
            NEW.id,
            CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END,
            NEW.status,
            auth.uid(),
            CASE WHEN TG_OP = 'INSERT' THEN 'Order received' ELSE 'Status updated' END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_order_status_audit ON public.orders;
CREATE TRIGGER trg_order_status_audit
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_order_status_history();

-- 5. FUNCTION: GENERATE NEXT SEQUENTIAL ORDER NUMBER
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

-- 6. VIEW: CUSTOMER FINANCIAL SUMMARY (Total billed, total paid, balance due)
CREATE OR REPLACE VIEW public.view_customer_summaries AS
SELECT 
    c.id AS customer_id,
    c.shop_id,
    c.name,
    c.phone,
    c.address,
    c.is_active,
    c.created_at,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(o.net_amount) FILTER (WHERE o.deleted_at IS NULL AND o.status != 'cancelled'), 0) AS total_billed,
    COALESCE(SUM(o.paid_amount) FILTER (WHERE o.deleted_at IS NULL AND o.status != 'cancelled'), 0) AS total_paid,
    COALESCE(SUM(o.balance_amount) FILTER (WHERE o.deleted_at IS NULL AND o.status != 'cancelled'), 0) AS balance_due
FROM public.customers c
LEFT JOIN public.orders o ON c.id = o.customer_id
WHERE c.deleted_at IS NULL
GROUP BY c.id;
