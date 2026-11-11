-- ==============================================================================
-- seed.sql
-- Seed Data for Women's Boutique & Ladies' Tailoring System
-- ==============================================================================

-- 1. SYSTEM GARMENT TYPES
INSERT INTO public.garment_types (code, name, default_price, is_system, is_active, sort_order) VALUES
('blouse', 'Blouse (डिजाइनर ब्लाउज)', 850.00, true, true, 1),
('kurti', 'Kurti / Kameez (कुर्ती / कमीज)', 650.00, true, true, 2),
('salwar_pant', 'Salwar / Pant / Palazzo (सलवार / पैंट)', 550.00, true, true, 3),
('lehenga', 'Lehenga Choli (लहंगा चोली)', 2800.00, true, true, 4),
('anarkali', 'Anarkali Suit (अनारकली सूट)', 1800.00, true, true, 5),
('gown', 'Gown / Dress (गाउन / ड्रेस)', 2200.00, true, true, 6),
('skirt', 'Skirt (स्कर्ट)', 750.00, true, true, 7),
('petticoat', 'Petticoat (पेटीकोट)', 350.00, true, true, 8)
ON CONFLICT DO NOTHING;

-- 2. SYSTEM MEASUREMENT FIELDS FOR WOMEN'S GARMENTS

-- BLOUSE FIELDS
INSERT INTO public.measurement_fields (garment_code, field_key, label_en, label_hi, sort_order, is_custom) VALUES
('blouse', 'blouse_length', 'Blouse Length', 'ब्लाउज लंबाई', 1, false),
('blouse', 'bust', 'Bust / Chest', 'सीना / चेस्ट', 2, false),
('blouse', 'waist', 'Waist (Underbust)', 'कमर', 3, false),
('blouse', 'shoulder', 'Shoulder / Teera', 'कंधा / तीरा', 4, false),
('blouse', 'armhole', 'Armhole Round', 'मुड्ढा / आर्महोल', 5, false),
('blouse', 'sleeve_length', 'Sleeve Length', 'आस्तीन लंबाई', 6, false),
('blouse', 'sleeve_round', 'Sleeve Round / Mori', 'आस्तीन मोरी', 7, false),
('blouse', 'front_neck_depth', 'Front Neck Depth', 'आगे का गला', 8, false),
('blouse', 'back_neck_depth', 'Back Neck Depth', 'पीछे का गला', 9, false),
('blouse', 'dart_point', 'Dart / Apex Point', 'डार्ट / बस्ट पॉइंट', 10, false),
('blouse', 'across_front', 'Across Front', 'अक्रॉस फ्रंट', 11, false),
('blouse', 'across_back', 'Across Back', 'अक्रॉस बैक', 12, false),

-- KURTI / KAMEEZ FIELDS
('kurti', 'kurti_length', 'Kurti Length', 'कुर्ती लंबाई', 1, false),
('kurti', 'bust', 'Bust / Chest', 'सीना / चेस्ट', 2, false),
('kurti', 'waist', 'Waist', 'कमर', 3, false),
('kurti', 'hip', 'Hip Round', 'हिप', 4, false),
('kurti', 'shoulder', 'Shoulder', 'कंधा', 5, false),
('kurti', 'armhole', 'Armhole Round', 'आर्महोल', 6, false),
('kurti', 'sleeve_length', 'Sleeve Length', 'आस्तीन लंबाई', 7, false),
('kurti', 'sleeve_round', 'Sleeve Round / Mori', 'मोरी', 8, false),
('kurti', 'front_neck_depth', 'Front Neck Depth', 'आगे का गला', 9, false),
('kurti', 'back_neck_depth', 'Back Neck Depth', 'पीछे का गला', 10, false),
('kurti', 'slit_height', 'Slit / Chak Height', 'चाक ऊंचाई', 11, false),

-- SALWAR / PANT / PALAZZO FIELDS
('salwar_pant', 'pant_length', 'Pant / Salwar Length', 'लंबाई', 1, false),
('salwar_pant', 'waist', 'Waist', 'कमर', 2, false),
('salwar_pant', 'hip', 'Hip', 'हिप', 3, false),
('salwar_pant', 'thigh', 'Thigh Round / Raan', 'जांघ / रान', 4, false),
('salwar_pant', 'knee', 'Knee Round', 'घुटना', 5, false),
('salwar_pant', 'calf', 'Calf Round', 'पिंडली', 6, false),
('salwar_pant', 'bottom_ankle', 'Bottom / Mohri', 'मोरी', 7, false),
('salwar_pant', 'rise', 'Front Rise / Aasan', 'आसन', 8, false),

-- LEHENGA FIELDS
('lehenga', 'lehenga_length', 'Lehenga Length', 'लहंगा लंबाई', 1, false),
('lehenga', 'lehenga_waist', 'Lehenga Waist', 'लहंगा कमर', 2, false),
('lehenga', 'lehenga_hip', 'Lehenga Hip', 'लहंगा हिप', 3, false),
('lehenga', 'flair_ghera', 'Flair / Ghera', 'घेरा', 4, false),
('lehenga', 'blouse_length', 'Choli Length', 'चोली लंबाई', 5, false),
('lehenga', 'bust', 'Bust / Chest', 'सीना', 6, false),
('lehenga', 'waist', 'Choli Waist', 'कमर', 7, false),
('lehenga', 'shoulder', 'Shoulder', 'कंधा', 8, false),
('lehenga', 'sleeve_length', 'Sleeve Length', 'आस्तीन लंबाई', 9, false),
('lehenga', 'front_neck_depth', 'Front Neck Depth', 'आगे का गला', 10, false),
('lehenga', 'back_neck_depth', 'Back Neck Depth', 'पीछे का गला', 11, false),

-- GOWN / DRESS FIELDS
('gown', 'total_length', 'Full Dress Length', 'फुल लंबाई', 1, false),
('gown', 'bust', 'Bust / Chest', 'सीना', 2, false),
('gown', 'waist', 'Waist', 'कमर', 3, false),
('gown', 'hip', 'Hip', 'हिप', 4, false),
('gown', 'shoulder', 'Shoulder', 'कंधा', 5, false),
('gown', 'armhole', 'Armhole', 'आर्महोल', 6, false),
('gown', 'sleeve_length', 'Sleeve Length', 'आस्तीन लंबाई', 7, false),
('gown', 'front_neck_depth', 'Front Neck Depth', 'आगे का गला', 8, false),
('gown', 'back_neck_depth', 'Back Neck Depth', 'पीछे का गला', 9, false),

-- SKIRT FIELDS
('skirt', 'skirt_length', 'Skirt Length', 'स्कर्ट लंबाई', 1, false),
('skirt', 'waist', 'Waist', 'कमर', 2, false),
('skirt', 'hip', 'Hip', 'हिप', 3, false),
('skirt', 'bottom_flair', 'Bottom Flair', 'घेरा', 4, false),

-- PETTICOAT FIELDS
('petticoat', 'petticoat_length', 'Length', 'लंबाई', 1, false),
('petticoat', 'waist', 'Waist', 'कमर', 2, false),
('petticoat', 'hip', 'Hip', 'हिप', 3, false)
ON CONFLICT DO NOTHING;

-- 3. DEMO BOUTIQUE & SEED SHOP
DO $$
DECLARE
    v_shop_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
    v_cust_pooja UUID := 'c0000000-0000-0000-0000-000000000001'::UUID;
    v_cust_ananya UUID := 'c0000000-0000-0000-0000-000000000002'::UUID;
    v_cust_sneha UUID := 'c0000000-0000-0000-0000-000000000003'::UUID;
    v_cust_priya UUID := 'c0000000-0000-0000-0000-000000000004'::UUID;

    v_prof_pooja_blouse UUID := 'm0000000-0000-0000-0000-000000000001'::UUID;
    v_prof_pooja_kurti UUID := 'm0000000-0000-0000-0000-000000000002'::UUID;
    v_prof_ananya_lehenga UUID := 'm0000000-0000-0000-0000-000000000003'::UUID;

    v_worker_ramesh UUID := 'w0000000-0000-0000-0000-000000000001'::UUID;
    v_worker_salim UUID := 'w0000000-0000-0000-0000-000000000002'::UUID;

    v_order_1 UUID := 'o0000000-0000-0000-0000-000000000001'::UUID;
    v_order_2 UUID := 'o0000000-0000-0000-0000-000000000002'::UUID;
    v_order_3 UUID := 'o0000000-0000-0000-0000-000000000003'::UUID;
BEGIN
    -- Insert Demo Shop
    INSERT INTO public.shops (id, name, owner_name, phone, alternate_phone, address, currency, measurement_unit, invoice_prefix)
    VALUES (
        v_shop_id,
        'Swapneri Boutique & Designer Studio',
        'Sunita Tai / Swapna Ben',
        '9820198201',
        '9820198202',
        'Shop 14, Lotus Arcade, MG Road, Pune, Maharashtra',
        'INR',
        'inches',
        'SW'
    ) ON CONFLICT (id) DO NOTHING;

    -- Shop Settings
    INSERT INTO public.shop_settings (shop_id, whatsapp_template_order_confirm, whatsapp_template_trial_ready, whatsapp_template_delivery_ready, whatsapp_template_payment_reminder, terms_and_conditions)
    VALUES (
        v_shop_id,
        'Hello {customer_name}! Thank you for your order {order_number} at Swapneri Boutique. Total: ₹{total_amount}, Advance Paid: ₹{paid_amount}, Balance: ₹{balance_amount}. Delivery Date: {delivery_date}. For queries: 9820198201.',
        'Namaste {customer_name}! Your garment for order {order_number} is ready for trial! Kindly visit us before {trial_date} to ensure a flawless fitting.',
        'Namaste {customer_name}! Great news! Your order {order_number} is beautifully ready for pickup at Swapneri Boutique. Balance Due: ₹{balance_amount}. Looking forward to seeing you!',
        'Hello {customer_name}! Friendly reminder regarding pending balance of ₹{balance_amount} for order {order_number} at Swapneri Boutique. Thank you!',
        '1. Alterations within 7 days of delivery are free of charge. 2. Please bring receipt during pickup. 3. Garments not collected within 45 days are not shop responsibility.'
    ) ON CONFLICT (shop_id) DO NOTHING;

    -- Karigars
    INSERT INTO public.workers (id, shop_id, name, phone, specialty, is_active) VALUES
    (v_worker_ramesh, v_shop_id, 'Ramesh Master', '9890011223', 'cutting', true),
    (v_worker_salim, v_shop_id, 'Salim Bhai', '9890044556', 'stitching', true)
    ON CONFLICT (id) DO NOTHING;

    -- Customers
    INSERT INTO public.customers (id, shop_id, name, phone, alternate_phone, address, birthday, anniversary, notes) VALUES
    (v_cust_pooja, v_shop_id, 'Pooja Sharma', '9822334455', '9822334456', 'Flat 402, Green Acre, Aundh, Pune', '1992-04-14', '2018-11-20', 'Prefers boat neck and cotton lining for all blouses.'),
    (v_cust_ananya, v_shop_id, 'Ananya Deshmukh', '9766554433', NULL, 'Bungalow 7, Model Colony, Pune', '1996-08-25', NULL, 'Bridal client. Wedding on 25th Nov. Very particular about padding.'),
    (v_cust_sneha, v_shop_id, 'Sneha Patel', '9422001122', NULL, 'Baner Road, Pune', '1988-12-05', '2012-02-14', 'Always requests extra seam allowance for later alteration.'),
    (v_cust_priya, v_shop_id, 'Priya Verma', '9158002233', NULL, 'Kothrud, Pune', NULL, NULL, 'New customer, ordered simple office wear kurtis.')
    ON CONFLICT (id) DO NOTHING;

    -- Measurement Profiles
    INSERT INTO public.measurement_profiles (id, shop_id, customer_id, garment_type, title, unit, notes) VALUES
    (v_prof_pooja_blouse, v_shop_id, v_cust_pooja, 'blouse', 'Comfort Fit Blouse (Diwali 2026)', 'inches', 'Back neck 9.5 inch with dori latkan.'),
    (v_prof_pooja_kurti, v_shop_id, v_cust_pooja, 'kurti', 'Regular A-line Kurti', 'inches', 'Side slit starts at 21 inches.'),
    (v_prof_ananya_lehenga, v_shop_id, v_cust_ananya, 'lehenga', 'Bridal Reception Lehenga Choli', 'inches', 'Heavily padded choli, sweetheart neck.')
    ON CONFLICT (id) DO NOTHING;

    -- Measurement Values for Pooja Blouse
    INSERT INTO public.measurement_values (profile_id, field_key, value, fraction, notes) VALUES
    (v_prof_pooja_blouse, 'blouse_length', 14.50, '1/2', 'Standard waist line'),
    (v_prof_pooja_blouse, 'bust', 36.00, '', 'Snug fit'),
    (v_prof_pooja_blouse, 'waist', 30.50, '1/2', ''),
    (v_prof_pooja_blouse, 'shoulder', 14.00, '', ''),
    (v_prof_pooja_blouse, 'armhole', 16.50, '1/2', ''),
    (v_prof_pooja_blouse, 'sleeve_length', 10.00, '', 'Elbow length'),
    (v_prof_pooja_blouse, 'sleeve_round', 11.50, '1/2', ''),
    (v_prof_pooja_blouse, 'front_neck_depth', 6.50, '1/2', 'Sweetheart'),
    (v_prof_pooja_blouse, 'back_neck_depth', 9.50, '1/2', 'Deep U with dori'),
    (v_prof_pooja_blouse, 'dart_point', 9.75, '3/4', '');

    -- Order 1: Ready order for Pooja Sharma
    INSERT INTO public.orders (id, shop_id, customer_id, order_number, order_date, trial_date, delivery_date, priority, status, total_amount, discount_amount, net_amount, paid_amount, balance_amount, payment_status, notes)
    VALUES (
        v_order_1,
        v_shop_id,
        v_cust_pooja,
        'SW-2601',
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE - INTERVAL '2 days',
        CURRENT_DATE, -- Due TODAY!
        'urgent',
        'ready',
        1700.00,
        100.00,
        1600.00,
        800.00,
        800.00,
        'partial',
        'Urgent Diwali delivery today.'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.order_items (order_id, garment_type, quantity, unit_price, total_price, design_notes, fabric_source, fabric_details, measurement_profile_id, assigned_worker_id)
    VALUES (
        v_order_1,
        'blouse',
        2,
        850.00,
        1700.00,
        'Red brocade with gold piping; Navy blue silk with back keyhole cut.',
        'customer',
        '2 cut pieces given by client with matching astar.',
        v_prof_pooja_blouse,
        v_worker_salim
    );

    INSERT INTO public.payments (shop_id, order_id, customer_id, amount, payment_date, payment_mode, transaction_ref, notes)
    VALUES (
        v_shop_id,
        v_order_1,
        v_cust_pooja,
        800.00,
        CURRENT_DATE - INTERVAL '6 days',
        'upi',
        'UPI-9820-ADVANCE-01',
        'Advance paid via GPay'
    );

    -- Order 2: In Stitching for Ananya Deshmukh (Bridal)
    INSERT INTO public.orders (id, shop_id, customer_id, order_number, order_date, trial_date, delivery_date, priority, status, total_amount, discount_amount, net_amount, paid_amount, balance_amount, payment_status, notes)
    VALUES (
        v_order_2,
        v_shop_id,
        v_cust_ananya,
        'SW-2602',
        CURRENT_DATE - INTERVAL '4 days',
        CURRENT_DATE + INTERVAL '2 days',
        CURRENT_DATE + INTERVAL '5 days',
        'urgent',
        'stitching',
        3500.00,
        0.00,
        3500.00,
        2000.00,
        1500.00,
        'partial',
        'Bridal velvet lehenga stitching with heavy cancan.'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.order_items (order_id, garment_type, quantity, unit_price, total_price, design_notes, fabric_source, fabric_details, measurement_profile_id, assigned_worker_id)
    VALUES (
        v_order_2,
        'lehenga',
        1,
        3500.00,
        3500.00,
        'Maroon velvet with 4-meter ghera, double cancan lining, heavy latkans.',
        'customer',
        'Semi-stitched bridal lehenga set with raw silk blouse piece.',
        v_prof_ananya_lehenga,
        v_worker_ramesh
    );

    INSERT INTO public.payments (shop_id, order_id, customer_id, amount, payment_date, payment_mode, notes)
    VALUES (
        v_shop_id,
        v_order_2,
        v_cust_ananya,
        2000.00,
        CURRENT_DATE - INTERVAL '4 days',
        'cash',
        'Cash advance paid at shop'
    );

    -- Order 3: Delivered order for Sneha Patel
    INSERT INTO public.orders (id, shop_id, customer_id, order_number, order_date, trial_date, delivery_date, priority, status, total_amount, discount_amount, net_amount, paid_amount, balance_amount, payment_status, notes)
    VALUES (
        v_order_3,
        v_shop_id,
        v_cust_sneha,
        'SW-2603',
        CURRENT_DATE - INTERVAL '12 days',
        CURRENT_DATE - INTERVAL '7 days',
        CURRENT_DATE - INTERVAL '3 days',
        'normal',
        'delivered',
        1200.00,
        0.00,
        1200.00,
        1200.00,
        0.00,
        'paid',
        'Customer very happy with kurti neck fit.'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.order_items (order_id, garment_type, quantity, unit_price, total_price, design_notes, fabric_source, fabric_details)
    VALUES (
        v_order_3,
        'kurti',
        1,
        650.00,
        650.00,
        'Mandarin collar, straight fit, side pockets.',
        'customer',
        'Pure Chanderi silk fabric with santoon lining.'
    ),
    (
        v_order_3,
        'salwar_pant',
        1,
        550.00,
        550.00,
        'Narrow cigarette pants with elastic back and side zipper.',
        'customer',
        'Matching santoon fabric.'
    );

    INSERT INTO public.payments (shop_id, order_id, customer_id, amount, payment_date, payment_mode, notes)
    VALUES 
    (v_shop_id, v_order_3, v_cust_sneha, 500.00, CURRENT_DATE - INTERVAL '12 days', 'upi', 'Booking advance'),
    (v_shop_id, v_order_3, v_cust_sneha, 700.00, CURRENT_DATE - INTERVAL '3 days', 'cash', 'Full settlement on delivery');

    -- Sample Expenses
    INSERT INTO public.expenses (shop_id, category, amount, expense_date, paid_to, payment_mode, notes) VALUES
    (v_shop_id, 'thread_accessories', 850.00, CURRENT_DATE - INTERVAL '3 days', 'Mahalaxmi Thread Store', 'cash', 'Zippers, matching threads, dori cords'),
    (v_shop_id, 'electricity', 1850.00, CURRENT_DATE - INTERVAL '5 days', 'MSEDCL', 'upi', 'Boutique electricity bill Oct 2026'),
    (v_shop_id, 'salary', 8000.00, CURRENT_DATE - INTERVAL '10 days', 'Salim Bhai', 'bank_transfer', 'Weekly karigar stitching advance')
    ON CONFLICT DO NOTHING;

END $$;
