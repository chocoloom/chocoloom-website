-- ==============================================================================
-- Chocoloom Neon Serverless Postgres Setup
-- Run this script in your Neon SQL Editor: https://console.neon.tech
-- (Neon Console -> Your Project -> SQL Editor -> Run)
-- ==============================================================================

-- 1. Create the products table for live catalog & price synchronization
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0.00,
    discount_price NUMERIC,
    original_price NUMERIC,
    image_url TEXT,
    category TEXT DEFAULT 'Specialty Cakes',
    stock INTEGER DEFAULT 100,
    is_available BOOLEAN DEFAULT TRUE,
    price_half_kg NUMERIC,
    price_1kg NUMERIC,
    price_1_5kg NUMERIC,
    price_2kg NUMERIC,
    price_3kg NUMERIC,
    cooling_price_charge NUMERIC DEFAULT 0,
    cooling_price_half_kg NUMERIC DEFAULT 50,
    cooling_price_1kg NUMERIC DEFAULT 150,
    cooling_price_1_5kg NUMERIC DEFAULT 199,
    cooling_price_2kg NUMERIC DEFAULT 200,
    cooling_price_3kg NUMERIC DEFAULT 299,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the orders table for live order processing & tracking
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT DEFAULT 'Guest Customer',
    customer_phone TEXT,
    phone TEXT,
    customer_email TEXT,
    delivery_address TEXT,
    delivery_location JSONB,
    delivery_notes TEXT,
    restaurant_id TEXT DEFAULT 'chocoloom',
    restaurant_name TEXT DEFAULT 'Chocoloom Flagship Bakery',
    items JSONB DEFAULT '[]'::jsonb,
    total_items INTEGER DEFAULT 1,
    item_total NUMERIC(10,2) DEFAULT 0.00,
    subtotal NUMERIC(10,2) DEFAULT 0.00,
    delivery_fee NUMERIC(10,2) DEFAULT 0.00,
    platform_fee NUMERIC(10,2) DEFAULT 0.00,
    gst_and_charges NUMERIC(10,2) DEFAULT 0.00,
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

-- 2.1. Create the card_orders table for VIP smart card orders & physical courier dispatches
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
    status TEXT DEFAULT 'In Transit',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create the users table for customer accounts & student profiles
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'Customer', -- 'Customer', 'SRKR Student', 'Foodie VIP', 'Admin'
    is_student BOOLEAN DEFAULT FALSE,
    college_id TEXT,
    college_name TEXT,
    avatar_url TEXT,
    addresses JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. High-performance indexes
CREATE INDEX IF NOT EXISTS idx_neon_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_neon_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_neon_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_neon_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_neon_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_neon_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_neon_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_neon_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_neon_users_created_at ON users(created_at DESC);

-- 5. Seed initial demo users
INSERT INTO users (id, name, email, phone, password, role, is_student, college_id, college_name)
VALUES 
    ('usr_demo_student', 'Mohith Kumar', 'student@srkr.edu.in', '9876543210', 'password123', 'SRKR Student', true, 'col_srkr', 'S.R.K.R. Engineering College (SRKR)'),
    ('usr_demo_customer', 'Priya Sharma', 'priya@example.com', '9123456789', 'password123', 'Foodie VIP', false, null, null)
ON CONFLICT (email) DO NOTHING;

-- 6. Verification query to inspect all tables
SELECT 'products' as table_name, count(*) as record_count FROM products
UNION ALL
SELECT 'orders' as table_name, count(*) as record_count FROM orders
UNION ALL
SELECT 'users' as table_name, count(*) as record_count FROM users;
