-- =========================================================================
-- CHOCOLOOM SUPABASE DATABASE SETUP: FLAVOUR PRICES COLUMNS & TABLE
-- Project: icedyeuagmkgitkoznxr
-- Paste and run this in Supabase Dashboard -> SQL Editor:
-- https://supabase.com/dashboard/project/icedyeuagmkgitkoznxr/sql/new
-- =========================================================================

-- 1. Add individual flavour price columns to the 'products' table
-- (Just like cooling_price_1kg, cooling_price_2kg, you can edit each flavour price directly in the Supabase Table Editor!)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_flavours BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_flavour TEXT DEFAULT 'Auto-Detect from Cake Name';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour_price_truffle NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour_price_black_forest NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour_price_red_velvet NUMERIC DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour_price_butterscotch NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour_price_pineapple NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour_price_vanilla NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour_price_black_currant NUMERIC DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour_price_mango NUMERIC DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour_price_strawberry NUMERIC DEFAULT 50;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour_price_rasmalai NUMERIC DEFAULT 100;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour_price_hazelnut NUMERIC DEFAULT 100;

-- Set default values for all existing rows
UPDATE public.products SET
    has_flavours = COALESCE(has_flavours, TRUE),
    flavour_price_truffle = COALESCE(flavour_price_truffle, 0),
    flavour_price_black_forest = COALESCE(flavour_price_black_forest, 0),
    flavour_price_red_velvet = COALESCE(flavour_price_red_velvet, 50),
    flavour_price_butterscotch = COALESCE(flavour_price_butterscotch, 0),
    flavour_price_pineapple = COALESCE(flavour_price_pineapple, 0),
    flavour_price_vanilla = COALESCE(flavour_price_vanilla, 0),
    flavour_price_black_currant = COALESCE(flavour_price_black_currant, 50),
    flavour_price_mango = COALESCE(flavour_price_mango, 50),
    flavour_price_strawberry = COALESCE(flavour_price_strawberry, 50),
    flavour_price_rasmalai = COALESCE(flavour_price_rasmalai, 100),
    flavour_price_hazelnut = COALESCE(flavour_price_hazelnut, 100);

-- 2. Optional: Dedicated flavour_prices table (for managing global flavour surcharges)
CREATE TABLE IF NOT EXISTS public.flavour_prices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'Cake Flavours',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.flavour_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read flavour_prices" ON public.flavour_prices;
CREATE POLICY "Allow public read flavour_prices" ON public.flavour_prices FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert flavour_prices" ON public.flavour_prices;
CREATE POLICY "Allow public insert flavour_prices" ON public.flavour_prices FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update flavour_prices" ON public.flavour_prices;
CREATE POLICY "Allow public update flavour_prices" ON public.flavour_prices FOR UPDATE USING (true);

INSERT INTO public.flavour_prices (id, name, price, category, is_available) VALUES
    ('chocolate_truffle', 'Dutch Chocolate Truffle', 0, 'Cake Flavours', true),
    ('black_forest', 'Classic Black Forest', 0, 'Cake Flavours', true),
    ('red_velvet', 'Royal Red Velvet', 50, 'Cake Flavours', true),
    ('butterscotch', 'Butterscotch Crunch', 0, 'Cake Flavours', true),
    ('pineapple', 'Fresh Pineapple', 0, 'Cake Flavours', true),
    ('vanilla', 'Classic Vanilla Bean', 0, 'Cake Flavours', true),
    ('black_currant', 'Black Currant Delight', 50, 'Cake Flavours', true),
    ('mango', 'Alphonso Mango', 50, 'Cake Flavours', true),
    ('strawberry', 'Fresh Strawberry', 50, 'Cake Flavours', true),
    ('rasmalai', 'Royal Rasmalai Fusion', 100, 'Cake Flavours', true),
    ('hazelnut_ferrero', 'Ferrero Nutty Hazelnut', 100, 'Cake Flavours', true)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();
