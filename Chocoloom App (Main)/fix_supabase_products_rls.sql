-- =========================================================================
-- CHOCOLOOM SUPABASE DATABASE FIX: PRODUCTS TABLE ROW LEVEL SECURITY (RLS)
-- Project: icedyeuagmkgitkoznxr
-- Paste and run this in Supabase Dashboard -> SQL Editor:
-- https://supabase.com/dashboard/project/icedyeuagmkgitkoznxr/sql/new
-- =========================================================================

-- 1. Enable Row Level Security on the products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Allow public / anon to read products
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public select from products" ON public.products;
CREATE POLICY "Allow public read products"
ON public.products FOR SELECT
USING (true);

-- 3. Allow public / admin to insert products
DROP POLICY IF EXISTS "Allow public insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert to products" ON public.products;
CREATE POLICY "Allow public insert products"
ON public.products FOR INSERT
WITH CHECK (true);

-- 4. Allow public / admin to update prices, stock, flavours and details
DROP POLICY IF EXISTS "Allow public update products" ON public.products;
DROP POLICY IF EXISTS "Allow public update to products" ON public.products;
CREATE POLICY "Allow public update products"
ON public.products FOR UPDATE
USING (true);

-- 5. Allow public / admin to delete products
DROP POLICY IF EXISTS "Allow public delete products" ON public.products;
DROP POLICY IF EXISTS "Allow public delete from products" ON public.products;
CREATE POLICY "Allow public delete products"
ON public.products FOR DELETE
USING (true);

-- 6. Enable Realtime Notifications for live price updates across all visitors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;
END $$;

-- 7. Verification check
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'products';
