-- Supabase Database Seed File for Velaash (VELAASH TRADER'S)
-- Realistic general clothing boutique categories hierarchy

-- 1. Insert Top-Level Categories
INSERT INTO public.categories (id, name, slug, description, image_url, display_order, is_active, parent_id)
VALUES
  (
    'a1111111-1111-4111-a111-111111111111',
    'Kurtas & Sets',
    'kurtas-sets',
    'Everyday and festive kurtas crafted from handpicked cottons and silks',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
    1,
    true,
    NULL
  ),
  (
    'a2222222-2222-4222-a222-222222222222',
    'Dresses',
    'dresses',
    'Refined midi, maxi, and shift dresses for relaxed sophistication',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
    2,
    true,
    NULL
  ),
  (
    'a3333333-3333-4333-a333-333333333333',
    'Co-ord Sets',
    'coord-sets',
    'Effortlessly paired top and bottom ensembles for elevated simplicity',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
    3,
    true,
    NULL
  ),
  (
    'a4444444-4444-4444-a444-444444444444',
    'Tops & Shirts',
    'tops-shirts',
    'Crisp shirts, breezy tunics, and delicately detailed blouses',
    'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=600&q=80',
    4,
    true,
    NULL
  ),
  (
    'a5555555-5555-4555-a555-555555555555',
    'Bottoms',
    'bottoms',
    'Comfortable trousers, flowing palazzos, and versatile culottes',
    'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=600&q=80',
    5,
    true,
    NULL
  ),
  (
    'a6666666-6666-4666-a666-666666666666',
    'Loungewear',
    'loungewear',
    'Soft mulmul and modal separates designed for tranquil moments',
    'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?auto=format&fit=crop&w=600&q=80',
    6,
    true,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- 2. Insert Sub-Categories (2-3 under each parent)
INSERT INTO public.categories (id, name, slug, description, display_order, is_active, parent_id)
VALUES
  -- Under Kurtas & Sets
  (
    'b1111111-1111-4111-b111-111111111111',
    'Straight Kurtas',
    'straight-kurtas',
    'Classic straight-cut silhouettes for effortless elegance',
    1,
    true,
    'a1111111-1111-4111-a111-111111111111'
  ),
  (
    'b1111111-1111-4111-b111-222222222222',
    'Anarkali & Flared Sets',
    'anarkali-flared-sets',
    'Graceful flowing flares with coordinated dupattas',
    2,
    true,
    'a1111111-1111-4111-a111-111111111111'
  ),
  (
    'b1111111-1111-4111-b111-333333333333',
    'Short Kurtis & Tunics',
    'short-kurtis-tunics',
    'Versatile pairings for denims and trousers',
    3,
    true,
    'a1111111-1111-4111-a111-111111111111'
  ),

  -- Under Dresses
  (
    'b2222222-2222-4222-b222-111111111111',
    'Midi Dresses',
    'midi-dresses',
    'Flattering lengths tailored in breathable weaves',
    1,
    true,
    'a2222222-2222-4222-a222-222222222222'
  ),
  (
    'b2222222-2222-4222-b222-222222222222',
    'Maxi Dresses',
    'maxi-dresses',
    'Sweeping hemlines with understated elegance',
    2,
    true,
    'a2222222-2222-4222-a222-222222222222'
  ),
  (
    'b2222222-2222-4222-b222-333333333333',
    'Wrap & Tiered Dresses',
    'wrap-tiered-dresses',
    'Dynamic silhouettes with flattering cinch ties',
    3,
    true,
    'a2222222-2222-4222-a222-222222222222'
  ),

  -- Under Co-ord Sets
  (
    'b3333333-3333-4333-b333-111111111111',
    'Pure Linen Sets',
    'linen-coord-sets',
    'Cool, breathable luxury for warm summer afternoons',
    1,
    true,
    'a3333333-3333-4333-a333-333333333333'
  ),
  (
    'b3333333-3333-4333-b333-222222222222',
    'Artisanal Printed Sets',
    'printed-coord-sets',
    'Hand-block and contemporary geometric prints',
    2,
    true,
    'a3333333-3333-4333-a333-333333333333'
  ),
  (
    'b3333333-3333-4333-b333-333333333333',
    'Occasion & Festive Sets',
    'festive-coord-sets',
    'Subtle metallic threadwork and evening coordinates',
    3,
    true,
    'a3333333-3333-4333-a333-333333333333'
  ),

  -- Under Tops & Shirts
  (
    'b4444444-4444-4444-b444-111111111111',
    'Tailored Shirts',
    'tailored-shirts',
    'Sharp collars and relaxed fits in cotton and poplin',
    1,
    true,
    'a4444444-4444-4444-a444-444444444444'
  ),
  (
    'b4444444-4444-4444-b444-222222222222',
    'Embroidered Tops',
    'embroidered-tops',
    'Delicate necklines and handcrafted sleeve motifs',
    2,
    true,
    'a4444444-4444-4444-a444-444444444444'
  ),

  -- Under Bottoms
  (
    'b5555555-5555-4555-b555-111111111111',
    'Pants & Trousers',
    'pants-trousers',
    'Structured fits with comfortable elasticated waists',
    1,
    true,
    'a5555555-5555-4555-a555-555555555555'
  ),
  (
    'b5555555-5555-4555-b555-222222222222',
    'Palazzos & Culottes',
    'palazzos-culottes',
    'Wide-leg volume crafted in lightweight cottons',
    2,
    true,
    'a5555555-5555-4555-a555-555555555555'
  ),

  -- Under Loungewear
  (
    'b6666666-6666-4666-b666-111111111111',
    'Lounge Sets',
    'lounge-sets',
    'Matching notch-collar sets in breathable cotton',
    1,
    true,
    'a6666666-6666-4666-a666-666666666666'
  ),
  (
    'b6666666-6666-4666-b666-222222222222',
    'Kaftans & Robes',
    'kaftans-robes',
    'Airy silhouettes for serene comfort at home',
    2,
    true,
    'a6666666-6666-4666-a666-666666666666'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  parent_id = EXCLUDED.parent_id;

-- 3. Upsert Real Default Site Settings
INSERT INTO public.site_settings (key, value, description, is_public)
VALUES
  (
    'store_profile',
    '{
      "name": "Velaash",
      "legal_name": "VELAASH TRADER''S",
      "tagline": "Contemporary Elegance, Timeless Style",
      "email": "bestrchandra@gmail.com",
      "phone": "+91 8508643832",
      "whatsapp_number": "+91 8508643832",
      "whatsapp_url": "https://wa.me/918508643832",
      "logo_url": "/brand/logo.svg",
      "favicon_url": "/favicon.ico"
    }'::jsonb,
    'Core business and brand identity info (email: temporary bestrchandra@gmail.com until custom domain email is set up)',
    true
  ),
  (
    'social_links',
    '{
      "instagram": "https://instagram.com/velaash",
      "facebook": "https://facebook.com/velaash",
      "whatsapp": "https://wa.me/918508643832",
      "pinterest": "https://pinterest.com/velaash"
    }'::jsonb,
    'Official social media profiles (Instagram and Facebook are placeholders awaiting client handles)',
    true
  ),
  (
    'announcement_bar',
    '{
      "is_enabled": true,
      "text": "Complimentary express delivery on orders above ₹999 | Use code VELAASH10 for 10% off",
      "link": "/collections/new-arrivals"
    }'::jsonb,
    'Top boutique notification banner text',
    true
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public,
  updated_at = now();

-- 4. Insert 14 Sample Clothing Products
INSERT INTO public.products (id, name, slug, description, category_id, base_price, compare_at_price, fabric, care_instructions, is_active, is_featured, stock_status, created_at)
VALUES
  -- Kurtas & Sets
  ('p1111111-1111-4111-b111-111111111111', 'Chanderi Embroidered Kurta Set', 'chanderi-embroidered-kurta-set', 'Handcrafted in breathable Chanderi cotton-silk with delicate golden zari neck detailing and coordinating palazzo.', 'a1111111-1111-4111-a111-111111111111', 4250.00, 5200.00, 'Chanderi Cotton Silk', 'Dry clean only', true, true, 'in_stock', now() - interval '3 days'),
  ('p1111111-1111-4111-b111-222222222222', 'A-Line Pintuck Cotton Kurta', 'a-line-pintuck-cotton-kurta', 'Pure breathable mulmul with tailored horizontal pintucks and subtle wooden button placket.', 'a1111111-1111-4111-a111-111111111111', 2450.00, NULL, '100% Mulmul Cotton', 'Gentle hand wash', true, false, 'in_stock', now() - interval '5 days'),
  ('p1111111-1111-4111-b111-333333333333', 'Hand-Block Printed Anarkali Ensemble', 'hand-block-printed-anarkali-ensemble', 'Flowing 24-kali silhouette printed with natural azo-free pigments, paired with an organza floral dupatta.', 'a1111111-1111-4111-a111-111111111111', 5800.00, 6900.00, 'Pure Cotton Cambric', 'Dry clean recommended', true, true, 'in_stock', now() - interval '40 days'),

  -- Dresses
  ('p2222222-2222-4222-b222-111111111111', 'Tiered Organic Cotton Midi Dress', 'tiered-organic-cotton-midi-dress', 'Airy three-tier gathered skirt with feminine flutter sleeves and functional side seam pockets.', 'a2222222-2222-4222-a222-222222222222', 3600.00, 4500.00, 'Organic Slub Cotton', 'Machine wash cold', true, true, 'in_stock', now() - interval '4 days'),
  ('p2222222-2222-4222-b222-222222222222', 'Relaxed Linen Belted Shirt Dress', 'relaxed-linen-belted-shirt-dress', 'Pure European linen crafted with mother-of-pearl buttons and a coordinating self-fabric tie belt.', 'a2222222-2222-4222-a222-222222222222', 4100.00, NULL, '100% European Linen', 'Gentle cycle, line dry', true, false, 'in_stock', now() - interval '20 days'),
  ('p2222222-2222-4222-b222-333333333333', 'Mulberry Silk Flared Maxi Dress', 'mulberry-silk-flared-maxi-dress', 'Sumptuous silk twill falling effortlessly into a sweeping ankle-grazing silhouette for twilight soirees.', 'a2222222-2222-4222-a222-222222222222', 6950.00, 8500.00, 'Pure Mulberry Silk', 'Specialist dry clean', true, true, 'in_stock', now() - interval '60 days'),

  -- Co-ord Sets
  ('p3333333-3333-4333-b333-111111111111', 'Artisanal Linen Tunic & Palazzo Set', 'artisanal-linen-tunic-palazzo-set', 'Structured split-neck tunic matched with high-waisted wide leg palazzos in breathable pure slub linen.', 'a3333333-3333-4333-a333-333333333333', 4800.00, 5800.00, 'Pure Slub Linen', 'Dry clean only', true, true, 'in_stock', now() - interval '2 days'),
  ('p3333333-3333-4333-b333-222222222222', 'Woven Cotton Notch-Lapel Co-ord Set', 'woven-cotton-notch-lapel-coord-set', 'Relaxed tailored blazer silhouette paired with straight pull-on trousers for understated elegance.', 'a3333333-3333-4333-a333-333333333333', 3950.00, NULL, 'Handloom Cotton', 'Gentle hand wash', true, false, 'in_stock', now() - interval '12 days'),
  ('p3333333-3333-4333-b333-333333333333', 'Peplum Embroidered Co-ord Ensemble', 'peplum-embroidered-coord-ensemble', 'Flattering cinched peplum tunic featuring tone-on-tone embroidery, accompanied by ankle-tapered pants.', 'a3333333-3333-4333-a333-333333333333', 5400.00, 6500.00, 'Cotton Silk Blend', 'Dry clean only', true, true, 'in_stock', now() - interval '45 days'),

  -- Tops & Shirts
  ('p4444444-4444-4444-b444-111111111111', 'Breezy Mandarin Collar Cotton Shirt', 'breezy-mandarin-collar-cotton-shirt', 'Casual yet elevated boyfriend fit shirt in lightweight organic poplin with curved hemline.', 'a4444444-4444-4444-a444-444444444444', 1950.00, 2400.00, 'Organic Cotton Poplin', 'Machine wash warm', true, false, 'in_stock', now() - interval '1 day'),
  ('p4444444-4444-4444-b444-222222222222', 'Delicate Pintuck Handloom Tunic', 'delicate-pintuck-handloom-tunic', 'Relaxed tunic silhouette with micro-pleats across the yoke and soft mother-of-pearl buttons.', 'a4444444-4444-4444-a444-444444444444', 2200.00, NULL, 'Fine Handloom Cotton', 'Gentle cycle', true, false, 'in_stock', now() - interval '15 days'),

  -- Bottoms
  ('p5555555-5555-4555-b555-111111111111', 'High-Rise Wide Leg Cotton Trousers', 'high-rise-wide-leg-cotton-trousers', 'Tailored front pleats, elasticated back comfort waistband, and clean wide silhouette in durable cotton twill.', 'a5555555-5555-4555-a555-555555555555', 2600.00, 3200.00, 'Structured Cotton Twill', 'Machine wash cold', true, true, 'in_stock', now() - interval '6 days'),
  ('p5555555-5555-4555-b555-222222222222', 'Pleated Relaxed Linen Palazzos', 'pleated-relaxed-linen-palazzos', 'Sweeping wide flared hemline crafted from natural washed linen with side pockets.', 'a5555555-5555-4555-a555-555555555555', 2850.00, NULL, 'Natural Washed Linen', 'Line dry in shade', true, false, 'in_stock', now() - interval '25 days'),

  -- Loungewear
  ('p6666666-6666-4666-b666-111111111111', 'Organic Cotton Notch-Collar Lounge Set', 'organic-cotton-notch-collar-lounge-set', 'Silky soft 100% organic cotton set with piped notch lapels and drawstring matching pajama pants.', 'a6666666-6666-4666-a666-666666666666', 3200.00, 3999.00, '100% Organic Cotton', 'Machine wash gentle', true, true, 'in_stock', now() - interval '5 days')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  base_price = EXCLUDED.base_price,
  compare_at_price = EXCLUDED.compare_at_price,
  fabric = EXCLUDED.fabric,
  care_instructions = EXCLUDED.care_instructions,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  stock_status = EXCLUDED.stock_status;

-- 5. Insert Product Variants
INSERT INTO public.product_variants (id, product_id, size, color, color_hex, sku, stock_quantity, is_active)
VALUES
  ('v1111111-1111-4111-c111-111111111111', 'p1111111-1111-4111-b111-111111111111', 'S', 'Ivory', '#FFFFF0', 'VEL-KRT-01-S-IVR', 4, true),
  ('v1111111-1111-4111-c111-111111111112', 'p1111111-1111-4111-b111-111111111111', 'M', 'Ivory', '#FFFFF0', 'VEL-KRT-01-M-IVR', 5, true),
  ('v1111111-1111-4111-c111-111111111113', 'p1111111-1111-4111-b111-111111111111', 'L', 'Ivory', '#FFFFF0', 'VEL-KRT-01-L-IVR', 3, true),
  ('v1111111-1111-4111-c111-111111111114', 'p1111111-1111-4111-b111-111111111111', 'M', 'Sage Green', '#8A9A86', 'VEL-KRT-01-M-SGE', 6, true),

  ('v2222222-2222-4222-c222-111111111111', 'p2222222-2222-4222-b222-111111111111', 'S', 'Terracotta', '#C86D51', 'VEL-DRS-01-S-TER', 4, true),
  ('v2222222-2222-4222-c222-111111111112', 'p2222222-2222-4222-b222-111111111111', 'M', 'Terracotta', '#C86D51', 'VEL-DRS-01-M-TER', 4, true),
  ('v2222222-2222-4222-c222-111111111113', 'p2222222-2222-4222-b222-111111111111', 'M', 'Olive Green', '#6B7D56', 'VEL-DRS-01-M-OLV', 4, true),

  ('v2222222-2222-4222-c222-333333333331', 'p2222222-2222-4222-b222-333333333333', 'S', 'Dusty Rose', '#DCAE96', 'VEL-DRS-03-S-RSE', 2, true),
  ('v2222222-2222-4222-c222-333333333332', 'p2222222-2222-4222-b222-333333333333', 'M', 'Dusty Rose', '#DCAE96', 'VEL-DRS-03-M-RSE', 2, true),

  ('v3333333-3333-4333-c333-111111111111', 'p3333333-3333-4333-b333-111111111111', 'S', 'Oatmeal', '#E5DEC9', 'VEL-CRD-01-S-OAT', 4, true),
  ('v3333333-3333-4333-c333-111111111112', 'p3333333-3333-4333-b333-111111111111', 'M', 'Oatmeal', '#E5DEC9', 'VEL-CRD-01-M-OAT', 6, true),
  ('v3333333-3333-4333-c333-111111111113', 'p3333333-3333-4333-b333-111111111111', 'M', 'Charcoal', '#36454F', 'VEL-CRD-01-M-CHR', 3, true),

  ('v5555555-5555-4555-c555-111111111111', 'p5555555-5555-4555-b555-111111111111', 'S', 'Khaki Beige', '#C3B091', 'VEL-BTM-01-S-KHK', 2, true),
  ('v5555555-5555-4555-c555-111111111112', 'p5555555-5555-4555-b555-111111111111', 'M', 'Khaki Beige', '#C3B091', 'VEL-BTM-01-M-KHK', 1, true),
  ('v5555555-5555-4555-c555-111111111113', 'p5555555-5555-4555-b555-111111111111', 'M', 'Classic Black', '#1A1A1A', 'VEL-BTM-01-M-BLK', 1, true)
ON CONFLICT (id) DO UPDATE SET
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active;

-- 6. Insert Product Images (Primary + Secondary Hover Images)
INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
VALUES
  ('i1111111-1111-4111-d111-111111111111', 'p1111111-1111-4111-b111-111111111111', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', 'Chanderi Embroidered Kurta Set Front View', 1, true),
  ('i1111111-1111-4111-d111-111111111112', 'p1111111-1111-4111-b111-111111111111', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', 'Chanderi Embroidered Kurta Set Fabric Detail', 2, false),

  ('i2222222-2222-4222-d222-111111111111', 'p2222222-2222-4222-b222-111111111111', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80', 'Tiered Organic Cotton Midi Dress', 1, true),
  ('i2222222-2222-4222-d222-111111111112', 'p2222222-2222-4222-b222-111111111111', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80', 'Tiered Dress Movement View', 2, false),

  ('i3333333-3333-4333-d333-111111111111', 'p3333333-3333-4333-b333-111111111111', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', 'Artisanal Linen Tunic & Palazzo Set', 1, true),
  ('i3333333-3333-4333-d333-111111111112', 'p3333333-3333-4333-b333-111111111111', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80', 'Artisanal Linen Set Detail', 2, false),

  ('i5555555-5555-4555-d555-111111111111', 'p5555555-5555-4555-b555-111111111111', 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80', 'High-Rise Wide Leg Cotton Trousers', 1, true),
  ('i5555555-5555-4555-d555-111111111112', 'p5555555-5555-4555-b555-111111111111', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80', 'High-Rise Trousers Fit View', 2, false)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  is_primary = EXCLUDED.is_primary;

-- 7. Insert Sample Approved Reviews
INSERT INTO public.reviews (id, product_id, customer_name, rating, title, comment, is_verified_purchase, is_approved)
VALUES
  ('r1111111-1111-4111-e111-111111111111', 'p1111111-1111-4111-b111-111111111111', 'Ananya Sharma', 5, 'Exquisite Craftsmanship', 'The Chanderi cotton feels so rich and breathable. Perfect fit and fast delivery!', true, true),
  ('r1111111-1111-4111-e111-111111111112', 'p1111111-1111-4111-b111-111111111111', 'Pooja Mehta', 5, 'Worth every penny', 'The delicate zari embroidery is understated yet luxurious.', true, true),
  ('r2222222-2222-4222-e222-111111111111', 'p2222222-2222-4222-b222-111111111111', 'Deepika Rao', 5, 'My new favorite dress', 'The tiered flare is so comfortable and breezy. Received compliments all day.', true, true)
ON CONFLICT (id) DO UPDATE SET
  rating = EXCLUDED.rating,
  is_approved = EXCLUDED.is_approved;


