-- Chocoloom: Insert 12 Dessert Items (10 Donuts + 2 Brownie Layer Cups)
-- Run in Supabase SQL Editor

INSERT INTO products (id, name, description, price, discount_price, image_url, category, stock, is_available)
VALUES
  ('50cc031f-a9d1-51cd-a94d-1113100c18c5', 'Lotus Biscoff Crunch Donut', 'Golden glazed gourmet donut coated in dark Belgian chocolate, topped with a whole Lotus Biscoff biscuit and crunchy speculoos crumbles.', 229.0, 189.0, NULL, 'Desserts', 100, true),
  ('aedd108f-b65d-50f4-93b3-5e750003d382', 'Oreo Cookie Crumble Donut', 'Soft ring donut frosted with rich milk chocolate glaze, heavily topped with crushed Oreo chocolate cookies and cream dust.', 219.0, 179.0, NULL, 'Desserts', 100, true),
  ('c185fda7-b3c4-5c5c-b70a-0efa1c0de83a', 'Choco Chip Overload Donut', 'Fluffy artisan donut dipped in smooth milk chocolate ganache and packed with dark chocolate chips for ultimate crunch.', 199.0, 169.0, NULL, 'Desserts', 100, true),
  ('cc116a43-54c6-5759-96bc-5c1a89bf7566', 'Golden Mango Marshmallow Donut', 'Indulgent chocolate frosted donut topped with soft twisted marshmallows, sponge cake crumble, and a slice of golden mango cake.', 249.0, 199.0, NULL, 'Desserts', 100, true),
  ('fa8bab80-6c7b-5d86-9340-cffba3c24e42', 'Dark Chocolate Biscoff Dust Donut', 'Rich dark chocolate glazed donut loaded with generous golden Biscoff speculoos dust and cookie crumbles.', 219.0, 179.0, NULL, 'Desserts', 100, true),
  ('f2d132e9-6723-579f-a7e3-c3d38068f0cd', 'Pistachio Matcha Swirl Donut', 'Decadent dark Belgian chocolate glazed donut topped with elegant bright green pistachio and matcha cream ribbon swirls.', 239.0, 199.0, NULL, 'Desserts', 100, true),
  ('0c4d46ba-b8a5-5373-9ae6-d481926e373f', 'Golden Kunafa Pistachio Donut', 'Exotic Middle-Eastern fusion donut coated in dark chocolate ganache, generously topped with crispy golden toasted kataifi kunafa and crushed pistachios.', 269.0, 219.0, NULL, 'Desserts', 100, true),
  ('c09bdc31-f52e-5a99-aad6-5435813f35d4', 'White Choco Zebra Drizzle Donut', 'Classic rich dark chocolate glazed ring donut patterned with fine white chocolate zebra drizzles.', 189.0, 159.0, NULL, 'Desserts', 100, true),
  ('1c64c6c5-e1b8-5a34-a808-f677a3468528', 'Rainbow Marshmallow Twist Donut', 'Soft milk chocolate glazed donut crowned with pastel pink, yellow, and white twisted marshmallow ropes.', 229.0, 189.0, NULL, 'Desserts', 100, true),
  ('984248e0-3c65-5040-bb41-f1504b395005', 'Dark Choco Whole Oreo Donut', 'Super loaded dark chocolate glazed donut centered with an entire dark chocolate Oreo biscuit and dark cookie dust.', 229.0, 189.0, NULL, 'Desserts', 100, true),
  ('77ef3639-ca82-593a-9ff3-dec084998ea9', 'Belgian Chocolate Brownie Layer Cup', 'Layers of dense fudge brownie cake and rich Belgian milk chocolate mousse, topped with dark chocolate brownie crumbles in a clear dessert cup.', 229.0, 189.0, NULL, 'Desserts', 100, true),
  ('2ce11777-10cf-5133-81c8-fe201a05d752', 'Royal Pistachio Brownie Layer Cup', 'Gourmet layers of moist dark fudge brownie and silky pistachio cream mousse, topped with brownie crumbs and roasted pistachio bits in a clear dessert cup.', 269.0, 219.0, NULL, 'Desserts', 100, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  discount_price = EXCLUDED.discount_price,
  category = EXCLUDED.category,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;