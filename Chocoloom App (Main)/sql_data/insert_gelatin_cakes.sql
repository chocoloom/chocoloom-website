-- Chocoloom: Insert 3 Gelatin Cakes (Out of Stock / Unavailable)
-- Run in Supabase SQL Editor

INSERT INTO products (id, name, description, price, discount_price, image_url, category, stock, is_available)
VALUES
  ('3ad47ea1-26f8-5815-ba2b-abed5a62191b', 'Rainbow Fresh Fruit Gelatin Cake', 'Translucent clear gelatin bundt ring filled with vibrant sections of fresh strawberries, green grapes, red grapes, mangoes, and diced apples.', 1599.0, 1299.0, NULL, 'Gelatin Cakes', 0, false),
  ('e942ea85-1038-5157-aca5-356e9bd0a15b', 'Dark Chocolate Cherry Gelatin Bundt Cake', 'Glossy fluted dark chocolate mousse bundt cake crowned with translucent dark ruby red cherry berry gelatin glaze.', 1799.0, 1499.0, NULL, 'Gelatin Cakes', 0, false),
  ('16464fa9-abb3-520e-afad-07ab43272721', 'Purple Blueberry Gelatin Mirror Cake', 'Sleek glossy royal purple blueberry mirror glaze gelatin cake decorated with fresh blueberries, edible pansy flowers, and white chocolate twigs.', 1699.0, 1399.0, NULL, 'Gelatin Cakes', 0, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  discount_price = EXCLUDED.discount_price,
  category = EXCLUDED.category,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;