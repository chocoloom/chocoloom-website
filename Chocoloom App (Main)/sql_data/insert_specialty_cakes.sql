-- Chocoloom: Insert 16 new Specialty Birthday & Custom Bento Cakes
-- Run in Supabase SQL Editor

INSERT INTO products (id, name, description, price, discount_price, image_url, category, stock, is_available)
VALUES
  ('039d316d-f63a-50fd-a99b-cc175e33e5cf', 'Royal Maroon Twenty One Velvet Cake', 'Luxurious deep maroon velvet cake with piped shell borders, delicate gold pearls, hanging star & moon charms, and elegant Twenty One script.', 1899.0, 1599.0, NULL, 'Specialty Cakes', 100, true),
  ('86917aaf-008c-5000-8d5f-af2ee198a7ef', 'Floral Garden Chapter 26 Cake', 'Elegant cream frosted cake bordered with delicate pink & white dried floral wreath, sugar pearls, and Chapter 26 script.', 1799.0, 1499.0, NULL, 'Specialty Cakes', 100, true),
  ('853a7a67-9ecf-5de6-bbf4-0c628b2bfcbc', 'Vintage Blue Heart Meadow Cake', 'Heart-shaped vintage piped cake with sky blue & white watercolor finish, detailed with royal navy sugar flower petals and pearl accents.', 1999.0, 1699.0, NULL, 'Specialty Cakes', 100, true),
  ('a6964c77-57d9-5e76-89e4-44a291fe3b28', 'Arch Textured White Gold Birthday Cake', 'Modern half-moon arch vertical cake with embossed damask texture, white floral bas-relief, and gold Happy Birthday script.', 2199.0, 1799.0, NULL, 'Specialty Cakes', 100, true),
  ('551e9cb1-9a26-558f-9060-f9f209e36d11', 'Lavender Butterfly Blossom Cake', 'Spectacular 3D butterfly-shaped birthday cake in lavender & cream whip frosting, crowned with purple sugar roses and cute mini glasses.', 2299.0, 1899.0, NULL, 'Specialty Cakes', 100, true),
  ('f2788783-d775-59a9-8fab-74b433a5617c', 'Pink Butterfly Gold 21 Bento Cake', 'Delicate white bento cake presented in an eco takeaway box, decorated with pink 3D butterflies, gold leaf outline, mini hearts, and gold 21 topper.', 899.0, 749.0, NULL, 'Bento Cakes', 100, true),
  ('63b091bf-1bcd-58d0-a6d6-5961bb332fda', 'Pink Ombre Butterfly Pearl Cake', 'Gorgeous multi-layer pink ombre cake with golden stroke edges, 3D pink butterflies, shimmering gold & pearl spheres, and gold Happy Birthday topper.', 1999.0, 1699.0, NULL, 'Specialty Cakes', 100, true),
  ('c9d8eb5b-b2da-5eca-9c78-9073ac9f24d6', 'Royal Magenta Swan Ruffle Cake', 'Exquisite roll cake frosted in intense magenta buttercream ruffles, adorned with white pearls and a majestic 3D white swan with golden crown.', 2199.0, 1799.0, NULL, 'Specialty Cakes', 100, true),
  ('9f8f9f43-8e68-542e-9d90-80e3ad5092fa', 'Ocean Blue Butterfly Chapter 27 Cake', 'Sky blue & navy textured brushstroke cake detailed with 3D blue butterflies, silver foil flakes, sugar pearls, and Chapter 27 script.', 1899.0, 1599.0, NULL, 'Specialty Cakes', 100, true),
  ('15d5268d-78a6-5874-bcf9-eeda12e864ce', 'Blush Pink Butterfly Rose Wing Cake', 'Spectacular 3D butterfly-shaped cake in soft blush pink, with one wing sculpted from piped roses & hydrangeas, and the other wing lined with delicate pearls.', 2399.0, 1999.0, NULL, 'Specialty Cakes', 100, true),
  ('96116c7c-30b7-5392-a82b-bd664da92c5d', 'Heart Photo Filmstrip Memory Cake', 'Heart-shaped vanilla cream cake wrapped with black & white photo filmstrip memory frames, piped shell borders, and elegant black ribbon candle.', 1999.0, 1699.0, NULL, 'Specialty Cakes', 100, true),
  ('d313f63b-404a-55a3-924f-985eea97293f', 'Three Tier Ombre Love You Sister Cake', 'Stunning 3-tier mini cake in dusty mauve, pale pink, and deep maroon tones with real flowers and piped text LOVE YOU SISTER.', 2299.0, 1899.0, NULL, 'Specialty Cakes', 100, true),
  ('97c89148-c828-5082-907c-0c2f6dc02149', 'Pure White Ribbon Love Anniversary Cake', 'Pristine white frosted cake wrapped with a sheer burgundy organza ribbon bow, gold LOVE topper, and red base disc Happy Anniversary.', 1799.0, 1499.0, NULL, 'Specialty Cakes', 100, true),
  ('05d71c07-3544-5f7f-9052-2ac4e793011b', 'Magenta Half-Moon Tulip Cake', 'Vibrant magenta half-moon cake decorated with white pearl polka dots, sheer pink ribbon bow, and fresh pink tulips.', 1949.0, 1649.0, NULL, 'Specialty Cakes', 100, true),
  ('0687c450-3bd4-538d-a4c2-c01fe85bc38a', 'Pink Textured Rose Half-Moon Birthday Cake', 'Cross-hatch textured pink half-moon cake topped with real pink roses, baby''s breath, gold foil flakes, pearls, and gold mirror Happy Birthday topper.', 2099.0, 1749.0, NULL, 'Specialty Cakes', 100, true),
  ('8e52a48b-d153-5efe-8238-a1ea82da6e0c', 'Floral Daisy Chapter 25 Bento Cake', 'Delicate white bento cake in an eco clam box with hand-piped pink and white daisy flowers, gold leaf centers, and gold calligraphy Chapter 25 script.', 899.0, 749.0, NULL, 'Bento Cakes', 100, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  discount_price = EXCLUDED.discount_price,
  category = EXCLUDED.category,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available;