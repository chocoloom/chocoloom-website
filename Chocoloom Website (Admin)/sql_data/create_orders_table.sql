-- ==============================================================================
-- Chocoloom Supabase Orders Table Setup
-- Run this script in your Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Create the orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT DEFAULT 'Guest Customer',
    customer_phone TEXT,
    customer_email TEXT,
    delivery_address TEXT NOT NULL,
    delivery_location JSONB,
    delivery_notes TEXT,
    restaurant_id TEXT,
    restaurant_name TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_items INTEGER DEFAULT 1,
    item_total NUMERIC(10,2) DEFAULT 0.00,
    delivery_fee NUMERIC(10,2) DEFAULT 0.00,
    platform_fee NUMERIC(10,2) DEFAULT 0.00,
    gst_and_charges NUMERIC(10,2) DEFAULT 0.00,
    tip_amount NUMERIC(10,2) DEFAULT 0.00,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    coupon_code TEXT,
    final_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payment_method TEXT DEFAULT 'Cash on Delivery',
    payment_status TEXT DEFAULT 'pending',
    payment_id TEXT,
    status TEXT DEFAULT 'Confirmed', -- 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns safely if the table already existed with fewer columns
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS order_number TEXT,
    ADD COLUMN IF NOT EXISTS customer_name TEXT,
    ADD COLUMN IF NOT EXISTS customer_phone TEXT,
    ADD COLUMN IF NOT EXISTS customer_email TEXT,
    ADD COLUMN IF NOT EXISTS delivery_address TEXT,
    ADD COLUMN IF NOT EXISTS delivery_location JSONB,
    ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
    ADD COLUMN IF NOT EXISTS restaurant_id TEXT,
    ADD COLUMN IF NOT EXISTS restaurant_name TEXT,
    ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS total_items INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS item_total NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS gst_and_charges NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS coupon_code TEXT,
    ADD COLUMN IF NOT EXISTS final_total NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash on Delivery',
    ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS payment_id TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Confirmed',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 4. Create Security Policies for Public / Website Access
DROP POLICY IF EXISTS "Allow public insert to orders" ON orders;
CREATE POLICY "Allow public insert to orders"
ON orders FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select from orders" ON orders;
CREATE POLICY "Allow public select from orders"
ON orders FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow public update to orders" ON orders;
CREATE POLICY "Allow public update to orders"
ON orders FOR UPDATE
USING (true);

-- 5. Enable Realtime Notifications for live tracking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    END IF;
END $$;

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);

-- 7. Verification Query to check columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 8. Useful Query to inspect all Orders with Weight & Cooling Options:
-- Run this in Supabase SQL Editor to see customer choices clearly:
-- SELECT 
--     order_number,
--     customer_name,
--     customer_phone,
--     item->>'name' AS cake_name,
--     item->>'weight' AS selected_weight,
--     item->>'is_cooling' AS is_cooling,
--     item->>'cooling_option' AS cooling_option,
--     item->>'cooling_price' AS cooling_charge,
--     item->>'price' AS unit_price,
--     item->>'quantity' AS qty,
--     item->>'options_summary' AS summary,
--     final_total,
--     status,
--     created_at
-- FROM orders,
-- LATERAL jsonb_array_elements(items) AS item
-- ORDER BY created_at DESC;

