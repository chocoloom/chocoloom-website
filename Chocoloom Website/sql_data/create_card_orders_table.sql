-- ==============================================================================
-- Chocoloom VIP Card Orders Table Setup (Supabase & Neon Postgres)
-- Run this script in your Supabase SQL Editor or Neon Console
-- ==============================================================================

-- 1. Create the card_orders table
CREATE TABLE IF NOT EXISTS card_orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    embossed_name TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    street TEXT,
    city TEXT NOT NULL,
    pincode TEXT NOT NULL,
    card_edition TEXT DEFAULT 'Matte Black Titanium VIP',
    card_number TEXT,
    tracking_number TEXT,
    courier TEXT DEFAULT 'BlueDart Express Air Priority',
    amount NUMERIC(10,2) DEFAULT 199.00,
    payment_status TEXT DEFAULT 'completed',
    payment_method TEXT DEFAULT 'UPI / Online Payment',
    status TEXT DEFAULT 'In Transit', -- 'Pending Embossing', 'In Transit', 'Delivered'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_card_orders_order_number ON card_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_card_orders_created_at ON card_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_card_orders_status ON card_orders(status);
CREATE INDEX IF NOT EXISTS idx_card_orders_phone ON card_orders(customer_phone);

-- 3. Row Level Security & Access Policies
ALTER TABLE card_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read card_orders" ON card_orders;
CREATE POLICY "Allow public read card_orders" ON card_orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert card_orders" ON card_orders;
CREATE POLICY "Allow public insert card_orders" ON card_orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update card_orders" ON card_orders;
CREATE POLICY "Allow public update card_orders" ON card_orders FOR UPDATE USING (true);

-- 4. Enable Supabase Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'card_orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE card_orders;
    END IF;
END $$;

-- 5. Seed Initial Demo Card Orders
INSERT INTO card_orders (
    order_number, customer_name, customer_phone, embossed_name,
    shipping_address, street, city, pincode, card_edition,
    card_number, tracking_number, courier, amount, payment_status, status
) VALUES 
(
    'CL-VIP-8842', 'Mohith Kumar', '+91 98765 43210', 'MOHITH KUMAR',
    'Flat No. 402, Highline Avenue, Indiranagar, Bengaluru - 560038',
    'Flat No. 402, Highline Avenue, Indiranagar', 'Bengaluru', '560038',
    'Matte Black Titanium VIP', '8842 5819 4021 8842', 'BD88429108IN',
    'BlueDart Express Air Priority', 199.00, 'completed', 'In Transit'
),
(
    'CL-VIP-4291', 'Priya Sharma', '+91 91234 56789', 'PRIYA SHARMA',
    'Villa 14, Palm Meadows, Whitefield, Bengaluru - 560066',
    'Villa 14, Palm Meadows, Whitefield', 'Bengaluru', '560066',
    'Royal Cocoa Gold VIP', '8842 7712 9014 4291', 'BD99214732IN',
    'BlueDart Express Air Priority', 199.00, 'completed', 'Pending Embossing'
)
ON CONFLICT (order_number) DO NOTHING;
