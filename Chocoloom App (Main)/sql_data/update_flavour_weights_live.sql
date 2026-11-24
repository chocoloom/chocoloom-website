-- =========================================================================
-- CHOCOLOOM LIVE SQL MIGRATION: FLAVOUR WEIGHTS & PRODUCT CUSTOMIZATION
-- Works seamlessly in Supabase SQL Editor and Neon PostgreSQL Console
-- Project URL: https://icedyeuagmkgitkoznxr.supabase.co
-- Supabase SQL Editor: https://supabase.com/dashboard/project/icedyeuagmkgitkoznxr/sql/new
-- =========================================================================

-- 1. Ensure 'products' table has the 'flavour_prices' JSONB column for per-flavour weight variations
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour_prices JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_flavours BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_weight BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_cooling BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_flavour TEXT DEFAULT 'Auto-Detect from Cake Name';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flavour TEXT;

-- 2. Create the dedicated 'flavour_weights' table for global flavour KG weight management
CREATE TABLE IF NOT EXISTS public.flavour_weights (
    id TEXT PRIMARY KEY,                       -- e.g. 'vanilla', 'chocolate', 'red_velvet'
    name TEXT NOT NULL,                        -- e.g. 'Vanilla', 'Chocolate', 'Royal Red Velvet'
    icon TEXT DEFAULT '🎂',                    -- e.g. '🍦', '🍫', '❤️'
    category TEXT DEFAULT 'normal',            -- 'normal' or 'cooling'
    price_half_kg NUMERIC NOT NULL DEFAULT 0,  -- 0.5 KG Price (₹)
    price_1kg NUMERIC NOT NULL DEFAULT 0,      -- 1.0 KG Price (₹)
    price_1_5kg NUMERIC NOT NULL DEFAULT 0,    -- 1.5 KG Price (₹)
    price_2kg NUMERIC NOT NULL DEFAULT 0,      -- 2.0 KG Price (₹)
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Configure Row Level Security (RLS) policies for full live access
ALTER TABLE public.flavour_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read flavour_weights" ON public.flavour_weights;
CREATE POLICY "Allow public read flavour_weights" ON public.flavour_weights FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert flavour_weights" ON public.flavour_weights;
CREATE POLICY "Allow public insert flavour_weights" ON public.flavour_weights FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update flavour_weights" ON public.flavour_weights;
CREATE POLICY "Allow public update flavour_weights" ON public.flavour_weights FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete flavour_weights" ON public.flavour_weights;
CREATE POLICY "Allow public delete flavour_weights" ON public.flavour_weights FOR DELETE USING (true);

-- 4. Seed all 15 Flavours with standard weights
INSERT INTO public.flavour_weights (id, name, icon, category, price_half_kg, price_1kg, price_1_5kg, price_2kg, is_available) VALUES
    ('vanilla', 'Vanilla', '🍦', 'normal', 0, 0, 0, 0, true),
    ('butterscotch', 'Butterscotch', '🧈', 'normal', 0, 0, 0, 0, true),
    ('strawberry', 'Strawberry', '🍓', 'normal', 50, 100, 150, 200, true),
    ('pineapple', 'Pineapple', '🍍', 'normal', 0, 0, 0, 0, true),
    ('chocolate', 'Chocolate', '🍫', 'normal', 0, 0, 0, 0, true),
    ('blueberry', 'Blueberry', '🫐', 'cooling', 50, 100, 150, 200, true),
    ('black_currant', 'Black Currant', '🍇', 'cooling', 50, 100, 150, 200, true),
    ('black_forest', 'Black Forest', '🍒', 'cooling', 0, 0, 0, 0, true),
    ('milk_badam', 'Milk Badam', '🥛', 'cooling', 100, 200, 300, 400, true),
    ('honey_almond', 'Honey Almond', '🍯', 'cooling', 100, 200, 300, 400, true),
    ('red_velvet', 'Red Velvet', '❤️', 'cooling', 50, 100, 150, 200, true),
    ('white_forest', 'White Forest', '🍰', 'cooling', 0, 0, 0, 0, true),
    ('caramel', 'Caramel', '🍮', 'cooling', 50, 100, 150, 200, true),
    ('milky_butterscotch', 'Milky Butterscotch', '🍨', 'cooling', 50, 100, 150, 200, true),
    ('nutty_bubble', 'Nutty Bubble', '🫧', 'cooling', 100, 200, 300, 400, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    price_half_kg = EXCLUDED.price_half_kg,
    price_1kg = EXCLUDED.price_1kg,
    price_1_5kg = EXCLUDED.price_1_5kg,
    price_2kg = EXCLUDED.price_2kg,
    updated_at = NOW();

-- 5. Enable Supabase Realtime for live updates without refreshing
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.flavour_weights;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;
