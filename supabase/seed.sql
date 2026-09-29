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

