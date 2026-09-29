-- ============================================================================
-- Supabase Database Seed File for Velaash (VELAASH TRADER'S)
-- Curated for Indian Ethnic & Contemporary Women's Fashion
-- Run directly in Supabase SQL Editor. Safe to run multiple times (ON CONFLICT).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TOP-LEVEL CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, description, image_url, display_order, is_active, parent_id)
VALUES
  ('a1111111-1111-4111-a111-111111111111', 'Kurtas & Suits', 'kurtas-sets', 'Handcrafted everyday and festive kurtas, anarkalis, and suit ensembles', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', 1, true, NULL),
  ('a2222222-2222-4222-a222-222222222222', 'Sarees & Drapes', 'sarees-drapes', 'Pure Chanderi, Maheshwari, organza, and pre-draped contemporary sarees', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', 2, true, NULL),
  ('a3333333-3333-4333-a333-333333333333', 'Co-ord Sets', 'coord-sets', 'Effortlessly coordinated top and bottom ensembles tailored in breathable weaves', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', 3, true, NULL),
  ('a4444444-4444-4444-a444-444444444444', 'Dresses & Gowns', 'dresses', 'Refined midi, maxi, and angrakha dresses designed for relaxed elegance', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80', 4, true, NULL),
  ('a5555555-5555-4555-a555-555555555555', 'Tops & Tunics', 'tops-shirts', 'Crisp cotton shirts, breezy handloom tunics, and embroidered blouses', 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80', 5, true, NULL),
  ('a6666666-6666-4666-a666-666666666666', 'Bottoms & Palazzos', 'bottoms', 'Tailored cotton trousers, sweeping flared palazzos, and draped dhoti pants', 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80', 6, true, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 2. SUB-CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, description, display_order, is_active, parent_id)
VALUES
  ('b1111111-1111-4111-b111-111111111111', 'Straight Kurtas', 'straight-kurtas', 'Classic straight-cut silhouettes with fine neck embroidery', 1, true, 'a1111111-1111-4111-a111-111111111111'),
  ('b1111111-1111-4111-b111-222222222222', 'Anarkali & Flared Sets', 'anarkali-flared-sets', 'Graceful 24-kali flared anarkalis with coordinated dupattas', 2, true, 'a1111111-1111-4111-a111-111111111111'),
  ('b1111111-1111-4111-b111-333333333333', 'Short Kurtis & Tunics', 'short-kurtis-tunics', 'Contemporary everyday kurtis paired with pants or denims', 3, true, 'a1111111-1111-4111-a111-111111111111'),
  ('b2222222-2222-4222-b222-111111111111', 'Chanderi & Silk Sarees', 'chanderi-silk-sarees', 'Lightweight silk-cotton handlooms with heritage zari borders', 1, true, 'a2222222-2222-4222-a222-222222222222'),
  ('b2222222-2222-4222-b222-222222222222', 'Organza & Floral Sarees', 'organza-sarees', 'Airy pastel organza sarees with delicate floral motif prints', 2, true, 'a2222222-2222-4222-a222-222222222222'),
  ('b2222222-2222-4222-b222-333333333333', 'Pre-Draped Sarees', 'pre-draped-sarees', 'Modern ready-to-wear sarees with stitched pleats for hassle-free drape', 3, true, 'a2222222-2222-4222-a222-222222222222'),
  ('b3333333-3333-4333-b333-111111111111', 'Pure Linen Sets', 'linen-coord-sets', 'Breathable luxury slub linen sets for warm summer days', 1, true, 'a3333333-3333-4333-a333-333333333333'),
  ('b3333333-3333-4333-b333-222222222222', 'Printed Co-ords', 'printed-coord-sets', 'Hand-block and botanical prints on soft mulmul and modal', 2, true, 'a3333333-3333-4333-a333-333333333333'),
  ('b3333333-3333-4333-b333-333333333333', 'Festive & Embroidered Sets', 'festive-coord-sets', 'Refined gota-patti and threadwork evening coordinates', 3, true, 'a3333333-3333-4333-a333-333333333333'),
  ('b4444444-4444-4444-b444-111111111111', 'Midi Dresses', 'midi-dresses', 'Flattering lengths tailored in breathable cottons and linens', 1, true, 'a4444444-4444-4444-a444-444444444444'),
  ('b4444444-4444-4444-b444-222222222222', 'Maxi Dresses', 'maxi-dresses', 'Sweeping bohemian hemlines crafted for relaxed soirees', 2, true, 'a4444444-4444-4444-a444-444444444444'),
  ('b4444444-4444-4444-b444-333333333333', 'Angrakha & Tiered Dresses', 'tiered-dresses', 'Traditional cross-body ties with modern tiered volume', 3, true, 'a4444444-4444-4444-a444-444444444444'),
  ('b5555555-5555-4555-b555-111111111111', 'Handloom Tunics', 'handloom-tunics', 'Micro-pleated tunics in hand-spun organic cotton', 1, true, 'a5555555-5555-4555-a555-555555555555'),
  ('b5555555-5555-4555-b555-222222222222', 'Mandarin Collar Shirts', 'mandarin-collar-shirts', 'Elevated everyday boyfriend shirts in crisp poplin', 2, true, 'a5555555-5555-4555-a555-555555555555'),
  ('b5555555-5555-4555-b555-333333333333', 'Embroidered Tops', 'embroidered-tops', 'Delicate Chikankari and Kashmiri inspired neckline motifs', 3, true, 'a5555555-5555-4555-a555-555555555555'),
  ('b6666666-6666-4666-b666-111111111111', 'Trousers & Pants', 'pants-trousers', 'Structured front pleats with all-day elastic back comfort', 1, true, 'a6666666-6666-4666-a666-666666666666'),
  ('b6666666-6666-4666-b666-222222222222', 'Flared Palazzos', 'palazzos-culottes', 'Voluminous sweeping hemlines in breathable mulmul and linen', 2, true, 'a6666666-6666-4666-a666-666666666666'),
  ('b6666666-6666-4666-b666-333333333333', 'Draped Dhoti Pants', 'dhoti-pants', 'Contemporary draped silhouettes designed for ethnic tops', 3, true, 'a6666666-6666-4666-a666-666666666666')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  parent_id = EXCLUDED.parent_id;

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS (AUTHENTIC INDIAN WEAR CATALOG)
-- ----------------------------------------------------------------------------
INSERT INTO public.products (
  id, name, slug, description, category_id, base_price, compare_at_price,
  fabric, care_instructions, craftsmanship, is_active, is_featured, stock_status,
  hsn_code, gst_rate, blouse_included, saree_length_meters, created_at
)
VALUES
  (
    'c1111111-1111-4111-c111-000000000001',
    'Chanderi Embroidered Kurta Set',
    'chanderi-embroidered-kurta-set',
    'Crafted in luxurious Chanderi silk blend with a pure cotton inner lining. Detailed with delicate zardozi and thread embroidery around the jewel neckline, paired with straight-cut palazzos and a sheer organza dupatta.',
    'a1111111-1111-4111-a111-111111111111',
    4250.00,
    5200.00,
    'Chanderi Silk Blend with 100% Mulmul Cotton Lining',
    'Dry clean only for the first two washes. Subsequently gentle hand wash in cold water.',
    'Hand-guided zardozi and threadwork along neckline and cuffs',
    true,
    true,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '1 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000002',
    'A-Line Pintuck Mulmul Kurta',
    'a-line-pintuck-mulmul-kurta',
    'Pure breathable 60x60 mulmul cotton featuring tailored horizontal pintucks across the front yoke. Styled with mother-of-pearl buttons and deep side pockets for effortless everyday elegance.',
    'a1111111-1111-4111-a111-111111111111',
    2450.00,
    NULL,
    '100% Breathable Mulmul Cotton',
    'Machine wash cold on gentle cycle. Line dry in shade.',
    'Precision hand-stitched pintucks with mother-of-pearl button placket',
    true,
    false,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '2 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000003',
    'Hand-Block Printed Anarkali Ensemble',
    'hand-block-printed-anarkali-ensemble',
    'Voluminous 24-kali flared anarkali handcrafted by Rajasthani artisans using natural vegetable dyes. Paired with a churidar and a coordinated Kota Doria dupatta with subtle gota patti border work.',
    'a1111111-1111-4111-a111-111111111111',
    5800.00,
    6900.00,
    'Pure Cambric Cotton & Kota Doria Dupatta',
    'Dry clean recommended to preserve natural vegetable block prints.',
    'Traditional Sanganeri hand-block printing with gota patti detailing',
    true,
    true,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '3 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000004',
    'Lucknowi Chikankari Straight Kurta',
    'lucknowi-chikankari-straight-kurta',
    'Soft modal cotton kurta adorned with authentic hand-embroidered Bakhiya and Phanda stitches. Subtle and dignified, ideal for intimate gatherings and formal occasions.',
    'a1111111-1111-4111-a111-111111111111',
    3600.00,
    4200.00,
    'Fine Modal Cotton',
    'Gentle hand wash with mild liquid detergent. Do not wring.',
    'Authentic Lucknowi hand Chikankari embroidery',
    true,
    true,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '4 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000005',
    'Pure Maheshwari Zari Border Saree',
    'pure-maheshwari-zari-border-saree',
    'Handwoven Maheshwari silk-cotton saree featuring the traditional Bugdi border and lustrous gold zari pallu stripes. Lightweight, regal, and comfortable for all-day celebrations.',
    'a2222222-2222-4222-a222-222222222222',
    6800.00,
    8200.00,
    'Handwoven Maheshwari Silk Cotton',
    'Dry clean only. Store wrapped in soft muslin cloth.',
    'Handloom woven on traditional pit looms with pure gold zari',
    true,
    true,
    'in_stock',
    '5208',
    5.00,
    true,
    5.50,
    now() - interval '5 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000006',
    'Chanderi Floral Organza Saree',
    'chanderi-floral-organza-saree',
    'Delicate pastel organza saree featuring hand-painted botanical rose motifs and scalloped hand-embroidered borders. Includes an unstitched raw silk blouse piece.',
    'a2222222-2222-4222-a222-222222222222',
    7450.00,
    8900.00,
    'Pure Tissue Organza Silk',
    'Professional dry clean only. Steam iron only on low heat.',
    'Hand-painted floral art with scalloped zardozi cutwork border',
    true,
    true,
    'in_stock',
    '5208',
    5.00,
    true,
    5.50,
    now() - interval '6 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000007',
    'Ready-to-Wear Georgette Pre-Draped Saree',
    'ready-to-wear-georgette-pre-draped-saree',
    'Modern pre-stitched pleated saree crafted in cascading micro-georgette. Includes an elasticated waistband and tailored pallu brooch attachment for effortless 1-minute draping.',
    'a2222222-2222-4222-a222-222222222222',
    4950.00,
    5900.00,
    'Fluid Micro-Georgette with Satin Lining',
    'Dry clean or gentle hand wash in cold water.',
    'Precision pre-stitched pleating with concealed side zipper',
    true,
    false,
    'in_stock',
    '5208',
    5.00,
    true,
    5.50,
    now() - interval '7 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000008',
    'Pure Linen Tunic & Palazzo Set',
    'pure-linen-tunic-and-palazzo-set',
    'Relaxed resort-style two-piece set in pure European washed linen. Boat neck tunic with high-side slits paired with wide-leg elasticated palazzos with deep functional pockets.',
    'a3333333-3333-4333-a333-333333333333',
    4800.00,
    5600.00,
    '100% European Washed Linen',
    'Machine wash cold with like colors. Warm iron while slightly damp.',
    'Tailored French seams with mother-of-pearl back closure',
    true,
    true,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '8 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000009',
    'Handloom Woven Cotton Notch Lapel Set',
    'handloom-woven-cotton-notch-lapel-set',
    'Structured short blazer jacket paired with straight ankle-length trousers in breathable textured handloom cotton weave.',
    'a3333333-3333-4333-a333-333333333333',
    3950.00,
    4800.00,
    'Hand-spun Organic Textured Cotton',
    'Hand wash separately in cold water using mild detergent.',
    'Hand-loomed textured weave with tailored notch collar',
    true,
    false,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '9 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000010',
    'Peplum Embroidered Festive Co-ord',
    'peplum-embroidered-festive-coord',
    'Flared peplum top embellished with mirrorwork along the neckline and hem, paired with flared sharara trousers in lustrous viscose modal.',
    'a3333333-3333-4333-a333-333333333333',
    5200.00,
    6400.00,
    'Viscose Modal Satin',
    'Dry clean only to protect hand embroidery.',
    'Artisan mirrorwork and thread embroidery detailing',
    true,
    true,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '10 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000011',
    'Tiered Organic Cotton Midi Dress',
    'tiered-organic-cotton-midi-dress',
    'A breezy three-tiered midi dress cut from soft slub cotton. Features flutter cap sleeves, a square neck, and a smocked back panel for an adaptive silhouette.',
    'a4444444-4444-4444-a444-444444444444',
    3200.00,
    3900.00,
    '100% Slub Cotton',
    'Machine wash cold gentle. Line dry.',
    'Hand-gathered tiered ruffles with smocked elastic back',
    true,
    true,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '11 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000012',
    'Relaxed Linen Belted Shirt Dress',
    'relaxed-linen-belted-shirt-dress',
    'Collar shirt dress with roll-up cuffed sleeves, tonal fabric belt, and side slits crafted in premium softened linen.',
    'a4444444-4444-4444-a444-444444444444',
    4400.00,
    NULL,
    'Pure Washed Linen',
    'Gentle machine wash cold. Iron damp.',
    'Point collar with tonal self-fabric belt and horn buttons',
    true,
    false,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '12 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000013',
    'Flared Angrakha Maxi Dress',
    'flared-angrakha-maxi-dress',
    'Floor-length maxi dress inspired by traditional Rajasthani angrakha cross-body silhouettes, with tassel tie-ups and gold foil print motifs.',
    'a4444444-4444-4444-a444-444444444444',
    4600.00,
    5400.00,
    'Fine Rayon Slub with Cotton Voile Lining',
    'Gentle hand wash inside out. Do not rub foil print directly.',
    'Handmade fabric latkans (tassels) and traditional angrakha overlap',
    true,
    true,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '13 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000014',
    'Breezy Mandarin Collar Cotton Shirt',
    'breezy-mandarin-collar-cotton-shirt',
    'Elevated casual boyfriend-fit shirt in lightweight organic poplin with curved hemline and subtle drop shoulders.',
    'a5555555-5555-4555-a555-555555555555',
    1950.00,
    2400.00,
    '100% Organic Cotton Poplin',
    'Machine wash warm. Tumble dry low or line dry.',
    'Clean-finished felled seams and mandarin collar',
    true,
    false,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '14 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000015',
    'Delicate Pintuck Handloom Tunic',
    'delicate-pintuck-handloom-tunic',
    'Relaxed tunic silhouette with micro-pleats across the yoke, subtle side slits, and soft mother-of-pearl buttons. Ideal paired with trousers or palazzos.',
    'a5555555-5555-4555-a555-555555555555',
    2200.00,
    NULL,
    'Fine Handloom Cotton',
    'Gentle cycle in cold water. Iron on medium.',
    'Hand-stitched yoke micro-pleating',
    true,
    false,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '15 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000016',
    'High-Rise Wide Leg Cotton Trousers',
    'high-rise-wide-leg-cotton-trousers',
    'Tailored front pleats, elasticated back comfort waistband, and clean wide silhouette in durable cotton twill with deep front slash pockets.',
    'a6666666-6666-4666-a666-666666666666',
    2600.00,
    3200.00,
    'Structured Cotton Twill (98% Cotton, 2% Elastane)',
    'Machine wash cold. Wash dark colors separately.',
    'Tailored trouser waistband with hidden elastic comfort insert',
    true,
    true,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '16 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000017',
    'Pleated Relaxed Linen Palazzos',
    'pleated-relaxed-linen-palazzos',
    'Sweeping wide flared hemline crafted from natural washed linen. Features an adjustable drawstring waistband and deep side pockets.',
    'a6666666-6666-4666-a666-666666666666',
    2850.00,
    NULL,
    '100% Natural Washed European Linen',
    'Machine wash gentle. Line dry in shade.',
    'Double-turned wide flare hem with French seams',
    true,
    false,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '17 days'
  ),
  (
    'c1111111-1111-4111-c111-000000000018',
    'Draped Modal Dhoti Pants',
    'draped-modal-dhoti-pants',
    'Modern draped ethnic bottom with pre-formed cowl pleats along the thighs. Silky soft modal fabric that falls effortlessly, pairing beautifully with short kurtis.',
    'a6666666-6666-4666-a666-666666666666',
    2150.00,
    2700.00,
    'Heavy Modal Satin Blend',
    'Gentle hand wash or delicate machine cycle.',
    'Precision engineered cowl draping with elastic waistband',
    true,
    true,
    'in_stock',
    '6204',
    5.00,
    false,
    NULL,
    now() - interval '18 days'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  base_price = EXCLUDED.base_price,
  compare_at_price = EXCLUDED.compare_at_price,
  fabric = EXCLUDED.fabric,
  care_instructions = EXCLUDED.care_instructions,
  craftsmanship = EXCLUDED.craftsmanship,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  stock_status = EXCLUDED.stock_status,
  hsn_code = EXCLUDED.hsn_code,
  gst_rate = EXCLUDED.gst_rate,
  blouse_included = EXCLUDED.blouse_included,
  saree_length_meters = EXCLUDED.saree_length_meters;

-- ----------------------------------------------------------------------------
-- 4. PRODUCT VARIANTS (SIZES XS to XXL & AUTHENTIC INDIAN COLOR PALETTE)
-- ----------------------------------------------------------------------------
INSERT INTO public.product_variants (id, product_id, size, color, color_hex, sku, stock_quantity, is_active)
VALUES
  ('d1111111-1111-4111-d111-000000000001', 'c1111111-1111-4111-c111-000000000001', 'XS', 'Kora Ivory', '#FDFBF7', 'VEL-KRT-01-XS-IVR', 3, true),
  ('d1111111-1111-4111-d111-000000000002', 'c1111111-1111-4111-c111-000000000001', 'S', 'Kora Ivory', '#FDFBF7', 'VEL-KRT-01-S-IVR', 5, true),
  ('d1111111-1111-4111-d111-000000000003', 'c1111111-1111-4111-c111-000000000001', 'M', 'Kora Ivory', '#FDFBF7', 'VEL-KRT-01-M-IVR', 6, true),
  ('d1111111-1111-4111-d111-000000000004', 'c1111111-1111-4111-c111-000000000001', 'L', 'Kora Ivory', '#FDFBF7', 'VEL-KRT-01-L-IVR', 4, true),
  ('d1111111-1111-4111-d111-000000000005', 'c1111111-1111-4111-c111-000000000001', 'XL', 'Kora Ivory', '#FDFBF7', 'VEL-KRT-01-XL-IVR', 3, true),
  ('d1111111-1111-4111-d111-000000000006', 'c1111111-1111-4111-c111-000000000001', 'M', 'Sage Green', '#8A9A86', 'VEL-KRT-01-M-SGE', 5, true),
  ('d1111111-1111-4111-d111-000000000007', 'c1111111-1111-4111-c111-000000000001', 'L', 'Sage Green', '#8A9A86', 'VEL-KRT-01-L-SGE', 4, true),
  ('d1111111-1111-4111-d111-000000000010', 'c1111111-1111-4111-c111-000000000002', 'S', 'Haldi Yellow', '#E8A735', 'VEL-KRT-02-S-YEL', 4, true),
  ('d1111111-1111-4111-d111-000000000011', 'c1111111-1111-4111-c111-000000000002', 'M', 'Haldi Yellow', '#E8A735', 'VEL-KRT-02-M-YEL', 6, true),
  ('d1111111-1111-4111-d111-000000000012', 'c1111111-1111-4111-c111-000000000002', 'L', 'Haldi Yellow', '#E8A735', 'VEL-KRT-02-L-YEL', 3, true),
  ('d1111111-1111-4111-d111-000000000020', 'c1111111-1111-4111-c111-000000000003', 'S', 'Gulabi Pink', '#D86D7F', 'VEL-KRT-03-S-PNK', 3, true),
  ('d1111111-1111-4111-d111-000000000021', 'c1111111-1111-4111-c111-000000000003', 'M', 'Gulabi Pink', '#D86D7F', 'VEL-KRT-03-M-PNK', 5, true),
  ('d1111111-1111-4111-d111-000000000022', 'c1111111-1111-4111-c111-000000000003', 'L', 'Gulabi Pink', '#D86D7F', 'VEL-KRT-03-L-PNK', 4, true),
  ('d1111111-1111-4111-d111-000000000030', 'c1111111-1111-4111-c111-000000000004', 'S', 'Powder Blue', '#B0E0E6', 'VEL-KRT-04-S-BLU', 4, true),
  ('d1111111-1111-4111-d111-000000000031', 'c1111111-1111-4111-c111-000000000004', 'M', 'Powder Blue', '#B0E0E6', 'VEL-KRT-04-M-BLU', 6, true),
  ('d1111111-1111-4111-d111-000000000032', 'c1111111-1111-4111-c111-000000000004', 'L', 'Powder Blue', '#B0E0E6', 'VEL-KRT-04-L-BLU', 4, true),
  ('d1111111-1111-4111-d111-000000000040', 'c1111111-1111-4111-c111-000000000005', 'Free Size', 'Royal Indigo', '#273C75', 'VEL-SAR-01-FS-IND', 5, true),
  ('d1111111-1111-4111-d111-000000000041', 'c1111111-1111-4111-c111-000000000005', 'Free Size', 'Maroon Wine', '#6E2639', 'VEL-SAR-01-FS-MAR', 4, true),
  ('d1111111-1111-4111-d111-000000000050', 'c1111111-1111-4111-c111-000000000006', 'Free Size', 'Blush Peach', '#FFDAB9', 'VEL-SAR-02-FS-PCH', 4, true),
  ('d1111111-1111-4111-d111-000000000060', 'c1111111-1111-4111-c111-000000000007', 'S', 'Emerald Green', '#1B4D3E', 'VEL-SAR-03-S-EMR', 3, true),
  ('d1111111-1111-4111-d111-000000000061', 'c1111111-1111-4111-c111-000000000007', 'M', 'Emerald Green', '#1B4D3E', 'VEL-SAR-03-M-EMR', 4, true),
  ('d1111111-1111-4111-d111-000000000062', 'c1111111-1111-4111-c111-000000000007', 'L', 'Emerald Green', '#1B4D3E', 'VEL-SAR-03-L-EMR', 3, true),
  ('d1111111-1111-4111-d111-000000000070', 'c1111111-1111-4111-c111-000000000008', 'S', 'Natural Oatmeal', '#E5DEC9', 'VEL-CRD-01-S-OAT', 4, true),
  ('d1111111-1111-4111-d111-000000000071', 'c1111111-1111-4111-c111-000000000008', 'M', 'Natural Oatmeal', '#E5DEC9', 'VEL-CRD-01-M-OAT', 6, true),
  ('d1111111-1111-4111-d111-000000000072', 'c1111111-1111-4111-c111-000000000008', 'L', 'Natural Oatmeal', '#E5DEC9', 'VEL-CRD-01-L-OAT', 5, true),
  ('d1111111-1111-4111-d111-000000000073', 'c1111111-1111-4111-c111-000000000008', 'M', 'Charcoal Slate', '#36454F', 'VEL-CRD-01-M-CHR', 3, true),
  ('d1111111-1111-4111-d111-000000000080', 'c1111111-1111-4111-c111-000000000009', 'S', 'Terracotta Rust', '#C86D51', 'VEL-CRD-02-S-TER', 3, true),
  ('d1111111-1111-4111-d111-000000000081', 'c1111111-1111-4111-c111-000000000009', 'M', 'Terracotta Rust', '#C86D51', 'VEL-CRD-02-M-TER', 5, true),
  ('d1111111-1111-4111-d111-000000000090', 'c1111111-1111-4111-c111-000000000010', 'S', 'Dusty Rose', '#DCAE96', 'VEL-CRD-03-S-RSE', 3, true),
  ('d1111111-1111-4111-d111-000000000091', 'c1111111-1111-4111-c111-000000000010', 'M', 'Dusty Rose', '#DCAE96', 'VEL-CRD-03-M-RSE', 4, true),
  ('d1111111-1111-4111-d111-000000000100', 'c1111111-1111-4111-c111-000000000011', 'S', 'Terracotta Rust', '#C86D51', 'VEL-DRS-01-S-TER', 4, true),
  ('d1111111-1111-4111-d111-000000000101', 'c1111111-1111-4111-c111-000000000011', 'M', 'Terracotta Rust', '#C86D51', 'VEL-DRS-01-M-TER', 5, true),
  ('d1111111-1111-4111-d111-000000000102', 'c1111111-1111-4111-c111-000000000011', 'L', 'Terracotta Rust', '#C86D51', 'VEL-DRS-01-L-TER', 3, true),
  ('d1111111-1111-4111-d111-000000000110', 'c1111111-1111-4111-c111-000000000012', 'M', 'Olive Green', '#6B7D56', 'VEL-DRS-02-M-OLV', 4, true),
  ('d1111111-1111-4111-d111-000000000111', 'c1111111-1111-4111-c111-000000000012', 'L', 'Olive Green', '#6B7D56', 'VEL-DRS-02-L-OLV', 3, true),
  ('d1111111-1111-4111-d111-000000000120', 'c1111111-1111-4111-c111-000000000013', 'S', 'Peacock Teal', '#005F73', 'VEL-DRS-03-S-TEA', 3, true),
  ('d1111111-1111-4111-d111-000000000121', 'c1111111-1111-4111-c111-000000000013', 'M', 'Peacock Teal', '#005F73', 'VEL-DRS-03-M-TEA', 5, true),
  ('d1111111-1111-4111-d111-000000000130', 'c1111111-1111-4111-c111-000000000014', 'S', 'Kora Ivory', '#FDFBF7', 'VEL-TOP-01-S-IVR', 5, true),
  ('d1111111-1111-4111-d111-000000000131', 'c1111111-1111-4111-c111-000000000014', 'M', 'Kora Ivory', '#FDFBF7', 'VEL-TOP-01-M-IVR', 6, true),
  ('d1111111-1111-4111-d111-000000000140', 'c1111111-1111-4111-c111-000000000015', 'M', 'Sage Green', '#8A9A86', 'VEL-TOP-02-M-SGE', 4, true),
  ('d1111111-1111-4111-d111-000000000150', 'c1111111-1111-4111-c111-000000000016', 'S', 'Khaki Beige', '#C3B091', 'VEL-BTM-01-S-KHK', 4, true),
  ('d1111111-1111-4111-d111-000000000151', 'c1111111-1111-4111-c111-000000000016', 'M', 'Khaki Beige', '#C3B091', 'VEL-BTM-01-M-KHK', 6, true),
  ('d1111111-1111-4111-d111-000000000152', 'c1111111-1111-4111-c111-000000000016', 'L', 'Khaki Beige', '#C3B091', 'VEL-BTM-01-L-KHK', 4, true),
  ('d1111111-1111-4111-d111-000000000160', 'c1111111-1111-4111-c111-000000000017', 'S', 'Natural Oatmeal', '#E5DEC9', 'VEL-BTM-02-S-OAT', 4, true),
  ('d1111111-1111-4111-d111-000000000161', 'c1111111-1111-4111-c111-000000000017', 'M', 'Natural Oatmeal', '#E5DEC9', 'VEL-BTM-02-M-OAT', 5, true),
  ('d1111111-1111-4111-d111-000000000170', 'c1111111-1111-4111-c111-000000000018', 'Free Size', 'Classic Black', '#1A1A1A', 'VEL-BTM-03-FS-BLK', 5, true),
  ('d1111111-1111-4111-d111-000000000171', 'c1111111-1111-4111-c111-000000000018', 'Free Size', 'Maroon Wine', '#6E2639', 'VEL-BTM-03-FS-MAR', 4, true)
ON CONFLICT (id) DO UPDATE SET
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  color_hex = EXCLUDED.color_hex,
  sku = EXCLUDED.sku,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 5. PRODUCT IMAGES (HIGH QUALITY AUTHENTIC WEAR PHOTOGRAPHY)
-- ----------------------------------------------------------------------------
INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
VALUES
  ('e1111111-1111-4111-e111-000000000001', 'c1111111-1111-4111-c111-000000000001', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', 'Chanderi Embroidered Kurta Set Front View', 1, true),
  ('e1111111-1111-4111-e111-000000000002', 'c1111111-1111-4111-c111-000000000001', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', 'Chanderi Kurta Fabric Detail and Neck Embroidery', 2, false),
  ('e1111111-1111-4111-e111-000000000010', 'c1111111-1111-4111-c111-000000000002', 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80', 'Haldi Yellow Pintuck Mulmul Kurta', 1, true),
  ('e1111111-1111-4111-e111-000000000020', 'c1111111-1111-4111-c111-000000000003', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80', 'Gulabi Pink Flared Anarkali Kurta Set', 1, true),
  ('e1111111-1111-4111-e111-000000000030', 'c1111111-1111-4111-c111-000000000004', 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=800&q=80', 'Lucknowi Hand Chikankari Straight Kurta', 1, true),
  ('e1111111-1111-4111-e111-000000000040', 'c1111111-1111-4111-c111-000000000005', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', 'Royal Indigo Maheshwari Zari Border Saree', 1, true),
  ('e1111111-1111-4111-e111-000000000041', 'c1111111-1111-4111-c111-000000000005', 'https://images.unsplash.com/photo-1610030469668-932b7245749c?auto=format&fit=crop&w=800&q=80', 'Maheshwari Saree Pallu Zari Detailing', 2, false),
  ('e1111111-1111-4111-e111-000000000050', 'c1111111-1111-4111-c111-000000000006', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80', 'Blush Peach Organza Saree Drape', 1, true),
  ('e1111111-1111-4111-e111-000000000060', 'c1111111-1111-4111-c111-000000000007', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80', 'Emerald Green Ready-to-Wear Georgette Saree', 1, true),
  ('e1111111-1111-4111-e111-000000000070', 'c1111111-1111-4111-c111-000000000008', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', 'Pure Linen Tunic and Palazzo Co-ord Set', 1, true),
  ('e1111111-1111-4111-e111-000000000071', 'c1111111-1111-4111-c111-000000000008', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80', 'Linen Co-ord Weave Detail', 2, false),
  ('e1111111-1111-4111-e111-000000000080', 'c1111111-1111-4111-c111-000000000009', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80', 'Terracotta Notch-Lapel Co-ord Set', 1, true),
  ('e1111111-1111-4111-e111-000000000090', 'c1111111-1111-4111-c111-000000000010', 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80', 'Dusty Rose Peplum Embroidered Co-ord', 1, true),
  ('e1111111-1111-4111-e111-000000000100', 'c1111111-1111-4111-c111-000000000011', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80', 'Tiered Organic Cotton Midi Dress in Terracotta', 1, true),
  ('e1111111-1111-4111-e111-000000000110', 'c1111111-1111-4111-c111-000000000012', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', 'Relaxed Olive Linen Belted Shirt Dress', 1, true),
  ('e1111111-1111-4111-e111-000000000120', 'c1111111-1111-4111-c111-000000000013', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80', 'Flared Peacock Teal Angrakha Dress', 1, true),
  ('e1111111-1111-4111-e111-000000000130', 'c1111111-1111-4111-c111-000000000014', 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80', 'Mandarin Collar Boyfriend Fit Poplin Shirt', 1, true),
  ('e1111111-1111-4111-e111-000000000140', 'c1111111-1111-4111-c111-000000000015', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', 'Fine Micro-Pintuck Handloom Tunic', 1, true),
  ('e1111111-1111-4111-e111-000000000150', 'c1111111-1111-4111-c111-000000000016', 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80', 'High-Rise Wide Leg Cotton Trousers Front View', 1, true),
  ('e1111111-1111-4111-e111-000000000151', 'c1111111-1111-4111-c111-000000000016', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80', 'High-Rise Trousers Fit and Pockets', 2, false),
  ('e1111111-1111-4111-e111-000000000160', 'c1111111-1111-4111-c111-000000000017', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80', 'Pleated Relaxed Linen Palazzos Flare', 1, true),
  ('e1111111-1111-4111-e111-000000000170', 'c1111111-1111-4111-c111-000000000018', 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80', 'Draped Cowl Modal Dhoti Pants', 1, true)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  alt_text = EXCLUDED.alt_text,
  display_order = EXCLUDED.display_order,
  is_primary = EXCLUDED.is_primary;

-- ----------------------------------------------------------------------------
-- 6. REVIEWS (AUTHENTIC INDIAN SHOPPER REVIEWS)
-- ----------------------------------------------------------------------------
INSERT INTO public.reviews (id, product_id, customer_name, rating, title, comment, is_verified_purchase, is_approved, created_at)
VALUES
  (
    'f1111111-1111-4111-f111-000000000001',
    'c1111111-1111-4111-c111-000000000001',
    'Pooja Sharma',
    5,
    'Exquisite Craftsmanship & Breathable Fabric',
    'Wore this for a family puja in Delhi heat. The Chanderi cotton feels so light and breathable! The inner mulmul lining prevents any sheer issues. Received so many compliments.',
    true,
    true,
    now() - interval '2 days'
  ),
  (
    'f1111111-1111-4111-f111-000000000002',
    'c1111111-1111-4111-c111-000000000001',
    'Ananya Iyer',
    5,
    'Worth every penny',
    'The subtle zardozi work on the neckline is understated yet regal. Size M fit me true to measurement chart.',
    true,
    true,
    now() - interval '3 days'
  ),
  (
    'f1111111-1111-4111-f111-000000000003',
    'c1111111-1111-4111-c111-000000000005',
    'Kavita Reddy',
    5,
    'Stunning Handloom Saree',
    'The Maheshwari zari border shines with authentic elegance. It drapes like a dream and doesn''t balloon up at all. Delivery to Hyderabad was prompt in 3 days.',
    true,
    true,
    now() - interval '4 days'
  ),
  (
    'f1111111-1111-4111-f111-000000000004',
    'c1111111-1111-4111-c111-000000000008',
    'Sunita Nair',
    5,
    'Favorite Travel Co-ord Set',
    'Pure linen comfort at its finest! The side pockets in both the tunic and pants are a lifesaver. Will definitely order the charcoal variant next.',
    true,
    true,
    now() - interval '5 days'
  ),
  (
    'f1111111-1111-4111-f111-000000000005',
    'c1111111-1111-4111-c111-000000000011',
    'Dr. Shalini Swaminathan',
    5,
    'Superb Slub Cotton Quality',
    'Very well stitched midi dress. The flutter sleeves and three tiers create a wonderful breezy flare. Very happy with Velaash.',
    true,
    true,
    now() - interval '6 days'
  ),
  (
    'f1111111-1111-4111-f111-000000000006',
    'c1111111-1111-4111-c111-000000000003',
    'Radhika Kulkarni',
    5,
    'Royal 24-Kali Flare',
    'The flare on this anarkali is magnificent! Authentic hand block print with zero bleeding in cold water. Beautiful Kota dupatta.',
    true,
    true,
    now() - interval '7 days'
  ),
  (
    'f1111111-1111-4111-f111-000000000007',
    'c1111111-1111-4111-c111-000000000016',
    'Sneha Banerjee',
    4,
    'Comfortable waistband and good fall',
    'Structured yet comfortable for work. Size L gives a clean relaxed fit. Would love more pastel shades!',
    true,
    true,
    now() - interval '8 days'
  )
ON CONFLICT (id) DO UPDATE SET
  rating = EXCLUDED.rating,
  title = EXCLUDED.title,
  comment = EXCLUDED.comment,
  is_approved = EXCLUDED.is_approved;

-- ----------------------------------------------------------------------------
-- 7. COUPONS (VALID DISCOUNT CODES FOR INDIAN SHOPPERS)
-- ----------------------------------------------------------------------------
INSERT INTO public.coupons (id, code, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, usage_count, valid_from, valid_until, is_active)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'WELCOME500', 'flat', 500.00, 2500.00, NULL, 5000, 24, '2026-09-24T11:22:15.005Z', '2027-03-28T11:22:15.006Z', true),
  ('10000000-0000-4000-8000-000000000002', 'VELAASH10', 'percentage', 10.00, 1500.00, 1000.00, 10000, 89, '2026-09-19T11:22:15.006Z', '2027-03-28T11:22:15.006Z', true),
  ('10000000-0000-4000-8000-000000000003', 'FESTIVE15', 'percentage', 15.00, 4000.00, 1500.00, 2000, 15, '2026-09-28T11:22:15.006Z', '2026-12-28T11:22:15.006Z', true),
  ('10000000-0000-4000-8000-000000000004', 'FREESHIP', 'flat', 99.00, 999.00, NULL, 5000, 12, '2026-09-27T11:22:15.006Z', '2026-12-28T11:22:15.006Z', true)
ON CONFLICT (code) DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_value = EXCLUDED.min_order_value,
  max_discount_amount = EXCLUDED.max_discount_amount,
  usage_limit = EXCLUDED.usage_limit,
  usage_count = EXCLUDED.usage_count,
  valid_from = EXCLUDED.valid_from,
  valid_until = EXCLUDED.valid_until,
  is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 8. SAMPLE ORDERS (FOR ADMIN ORDER MANAGEMENT TESTING)
-- ----------------------------------------------------------------------------
INSERT INTO public.orders (
  id, order_number, customer_id, status, payment_method, payment_status,
  subtotal, shipping_charge, discount_amount, total_amount, shipping_address, billing_address,
  coupon_code, notes, created_at
)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    'VEL-2026-00001',
    NULL,
    'confirmed',
    'cod',
    'pending',
    4250.00,
    0.00,
    0.00,
    4250.00,
    '{"fullName":"Pooja Sharma","phone":"+91 9820123456","email":"pooja.sharma@example.com","addressLine1":"Flat 402, Sea Breeze Heights, Worli Sea Face","city":"Mumbai","state":"Maharashtra","pincode":"400030","addressType":"home"}'::jsonb,
    '{"fullName":"Pooja Sharma","phone":"+91 9820123456","email":"pooja.sharma@example.com","addressLine1":"Flat 402, Sea Breeze Heights, Worli Sea Face","city":"Mumbai","state":"Maharashtra","pincode":"400030","addressType":"home"}'::jsonb,
    NULL,
    'Sample verified customer COD order',
    now() - interval '1 days'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'VEL-2026-00002',
    NULL,
    'packed',
    'razorpay',
    'paid',
    6800.00,
    0.00,
    500.00,
    6300.00,
    '{"fullName":"Ananya Iyer","phone":"+91 9880198765","email":"ananya.iyer@example.com","addressLine1":"Villa 14, Palm Meadows, Whitefield","city":"Bengaluru","state":"Karnataka","pincode":"560066","addressType":"home"}'::jsonb,
    '{"fullName":"Ananya Iyer","phone":"+91 9880198765","email":"ananya.iyer@example.com","addressLine1":"Villa 14, Palm Meadows, Whitefield","city":"Bengaluru","state":"Karnataka","pincode":"560066","addressType":"home"}'::jsonb,
    'WELCOME500',
    'Paid online via Razorpay (razorpay_order_id: order_mock_rzp_001)',
    now() - interval '2 days'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'VEL-2026-00003',
    NULL,
    'delivered',
    'razorpay',
    'paid',
    4800.00,
    0.00,
    480.00,
    4320.00,
    '{"fullName":"Kavita Reddy","phone":"+91 9849012345","email":"kavita.reddy@example.com","addressLine1":"House 12, Road No 36, Jubilee Hills","city":"Hyderabad","state":"Telangana","pincode":"500033","addressType":"home"}'::jsonb,
    '{"fullName":"Kavita Reddy","phone":"+91 9849012345","email":"kavita.reddy@example.com","addressLine1":"House 12, Road No 36, Jubilee Hills","city":"Hyderabad","state":"Telangana","pincode":"500033","addressType":"home"}'::jsonb,
    'VELAASH10',
    'Delivered successfully with BlueDart Air',
    now() - interval '3 days'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  payment_status = EXCLUDED.payment_status,
  total_amount = EXCLUDED.total_amount;

-- ----------------------------------------------------------------------------
-- 9. ORDER ITEMS
-- ----------------------------------------------------------------------------
INSERT INTO public.order_items (
  id, order_id, product_id, variant_id, product_name_snapshot,
  variant_details_snapshot, unit_price, quantity, subtotal
)
VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'c1111111-1111-4111-c111-000000000001',
    'd1111111-1111-4111-d111-000000000003',
    'Chanderi Embroidered Kurta Set',
    '{"size":"M","color":"Kora Ivory","sku":"VEL-KRT-01-M-IVR"}'::jsonb,
    4250.00,
    1,
    4250.00
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'c1111111-1111-4111-c111-000000000005',
    'd1111111-1111-4111-d111-000000000040',
    'Pure Maheshwari Zari Border Saree',
    '{"size":"Free Size","color":"Royal Indigo","sku":"VEL-SAR-01-FS-IND"}'::jsonb,
    6800.00,
    1,
    6800.00
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000003',
    'c1111111-1111-4111-c111-000000000008',
    'd1111111-1111-4111-d111-000000000071',
    'Pure Linen Tunic & Palazzo Set',
    '{"size":"M","color":"Natural Oatmeal","sku":"VEL-CRD-01-M-OAT"}'::jsonb,
    4800.00,
    1,
    4800.00
  )
ON CONFLICT (id) DO UPDATE SET
  unit_price = EXCLUDED.unit_price,
  quantity = EXCLUDED.quantity,
  subtotal = EXCLUDED.subtotal;

-- ----------------------------------------------------------------------------
-- 10. SITE SETTINGS (VERIFIED BUSINESS & BRAND PROFILE)
-- ----------------------------------------------------------------------------
INSERT INTO public.site_settings (key, value, description, is_public)
VALUES
  (
    'store_profile',
    '{
      "name": "Velaash",
      "legal_name": "VELAASH TRADER''S",
      "tagline": "Contemporary Elegance, Handcrafted in India",
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
    'Official social media profile links',
    true
  ),
  (
    'shipping_policy',
    '{
      "free_shipping_threshold": 1999,
      "standard_shipping_fee": 99,
      "cod_available": true,
      "cod_fee": 50,
      "estimated_days_metro": 3,
      "estimated_days_rest_of_india": 6
    }'::jsonb,
    'Pan-India delivery fees and transit estimations',
    true
  ),
  (
    'returns_policy',
    '{
      "return_window_days": 7,
      "exchange_window_days": 10,
      "is_returnable": true,
      "conditions": "Items must be unused, unwashed, and returned in original packaging with tags intact."
    }'::jsonb,
    'Hassle-free 7-day doorstep return and exchange terms',
    true
  ),
  (
    'announcement_bar',
    '{
      "is_enabled": true,
      "text": "Festive Special: Enjoy Complimentary Shipping on Orders Above ₹1,999 | Use Code WELCOME500 for ₹500 Off",
      "link": "/shop"
    }'::jsonb,
    'Top notification announcement ribbon',
    true
  ),
  (
    'payment_settings',
    '{
      "razorpay_enabled": true,
      "cod_enabled": true,
      "supported_currencies": ["INR"]
    }'::jsonb,
    'Active checkout payment methods',
    true
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 11. HOMEPAGE BUILDER SECTIONS (DYNAMIC ORDER & CONTENT)
-- ----------------------------------------------------------------------------
INSERT INTO public.homepage_sections (id, section_type, title, display_order, is_active, content)
VALUES
  (
    '40000000-0000-4000-8000-000000000001',
    'hero_banner',
    'Hero Banner',
    1,
    true,
    '{
      "headline": "Handcrafted Indian Textiles for the Contemporary Soul",
      "subheadline": "Effortless silhouettes in breathable Chanderi, pure linen, and fine Mulmul. Designed for modern life, rooted in tradition.",
      "cta_text": "Explore Collection",
      "cta_link": "/shop",
      "image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=2000&q=85"
    }'::jsonb
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    'category_grid',
    'Curated Collections',
    2,
    true,
    '{
      "subtitle": "Discover our signature edits crafted for comfort and grace."
    }'::jsonb
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    'featured_products',
    'Featured Arrivals',
    3,
    true,
    '{
      "subtitle": "Handpicked favorites from our latest artisan weaving cycles.",
      "limit": 8
    }'::jsonb
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    'value_strip',
    'The Velaash Promise',
    4,
    true,
    '{
      "items": [
        {
          "title": "Authentic Handlooms",
          "description": "Woven with pure natural fibers by certified master weavers"
        },
        {
          "title": "All-India Delivery",
          "description": "Fast doorstep dispatch across 26,000+ Indian postal codes"
        },
        {
          "title": "Easy 7-Day Exchange",
          "description": "Doorstep size exchanges and hassle-free returns"
        },
        {
          "title": "Secure Payments",
          "description": "UPI, Credit/Debit cards, Net Banking, and Cash on Delivery"
        }
      ]
    }'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  content = EXCLUDED.content;
