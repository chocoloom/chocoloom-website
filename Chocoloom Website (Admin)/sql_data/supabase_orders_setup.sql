-- =====================================================
-- Chocoloom Supabase Orders Table Setup
-- Run this in your Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- =====================================================

-- 1. Create the orders table (safe to run multiple times)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    order_ref TEXT,
    customer_name TEXT DEFAULT 'Guest Customer',
    customer_phone TEXT,
    customer_email TEXT,
    delivery_address TEXT,
    city TEXT,
    zip_code TEXT,
    delivery_location JSONB,
    delivery_notes TEXT,
    note TEXT,
    restaurant_id TEXT DEFAULT 'chocoloom',
    restaurant_name TEXT DEFAULT 'Chocoloom Flagship Bakery',
    items JSONB DEFAULT '[]'::jsonb,
    total_items INTEGER DEFAULT 1,
    item_total NUMERIC(10,2) DEFAULT 0.00,
    subtotal NUMERIC(10,2) DEFAULT 0.00,
    delivery_fee NUMERIC(10,2) DEFAULT 35.00,
    platform_fee NUMERIC(10,2) DEFAULT 6.00,
    gst_and_charges NUMERIC(10,2) DEFAULT 15.00,
    tip_amount NUMERIC(10,2) DEFAULT 0.00,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    coupon_code TEXT,
    final_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) DEFAULT 0.00,
    payment_method TEXT DEFAULT 'Cash on Delivery',
    payment_status TEXT DEFAULT 'pending',
    payment_id TEXT,
    status TEXT DEFAULT 'Confirmed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 3. Enable Row Level Security (RLS) - REQUIRED for Supabase
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow anon read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anon insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anon update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all access to orders" ON public.orders;

-- 5. Create RLS policies to allow the admin panel + customer website to read/write
-- Allow anyone (anon key) to INSERT orders (customers placing orders)
CREATE POLICY "Allow anon insert orders"
ON public.orders FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anyone (anon key) to SELECT orders (admin panel reading orders)
CREATE POLICY "Allow anon read orders"
ON public.orders FOR SELECT
TO anon
USING (true);

-- Allow anyone (anon key) to UPDATE order status (admin updating order status)
CREATE POLICY "Allow anon update orders"
ON public.orders FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 6. Enable Realtime for the orders table (CRITICAL for live admin panel updates)
-- Go to: Supabase Dashboard -> Database -> Replication -> supabase_realtime publication
-- Add the "orders" table to the publication, OR run:
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 7. Verify everything is set up correctly
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'orders' AND schemaname = 'public';

SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'orders';
