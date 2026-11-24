-- ==============================================================================
-- Chocoloom Supabase Users Table Setup
-- Run this script in your Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Create the users table
CREATE TABLE IF NOT EXISTS public.users (
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

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Security policies for public access
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
CREATE POLICY "Allow public read access to users"
ON public.users FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow public insert to users" ON public.users;
CREATE POLICY "Allow public insert to users"
ON public.users FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to users" ON public.users;
CREATE POLICY "Allow public update to users"
ON public.users FOR UPDATE
USING (true);

-- 4. Enable Realtime Notifications (optional)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'users'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    END IF;
END $$;

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_supabase_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_supabase_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_supabase_users_created_at ON public.users(created_at DESC);

-- 6. Insert demo seed users
INSERT INTO public.users (id, name, email, phone, password, role, is_student, college_id, college_name)
VALUES 
    ('usr_demo_student', 'Mohith Kumar', 'student@srkr.edu.in', '9876543210', 'password123', 'SRKR Student', true, 'col_srkr', 'S.R.K.R. Engineering College (SRKR)'),
    ('usr_demo_customer', 'Priya Sharma', 'priya@example.com', '9123456789', 'password123', 'Foodie VIP', false, null, null)
ON CONFLICT (email) DO NOTHING;
