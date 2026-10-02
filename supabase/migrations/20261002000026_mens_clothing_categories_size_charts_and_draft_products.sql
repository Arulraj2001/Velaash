-- 026: Men's Clothing Top-Level Category, Subcategories, Size Charts, and Draft Products
-- Velaash Lifestyle Expansion (Men's Apparel)

-- 1. Insert Top-Level Category: Men
INSERT INTO public.categories (
  id,
  name,
  slug,
  description,
  display_order,
  is_active,
  parent_id,
  seo_title,
  seo_description
)
VALUES (
  'a7777777-7777-4777-a777-777777777777',
  'Men',
  'men',
  'Contemporary handcrafted clothing for men, tailored in premium natural fabrics.',
  7,
  true,
  null,
  'Men''s Clothing Collection | Velaash',
  'Shop handcrafted shirts, kurtas, t-shirts, and bottoms for men at Velaash. Crafted in pure cotton, linen, and artisanal weaves.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true,
  display_order = EXCLUDED.display_order;

-- 2. Insert Men's Subcategories (2-Level Hierarchy under Men)
-- 2a. Men's Shirts
INSERT INTO public.categories (
  id,
  name,
  slug,
  description,
  display_order,
  is_active,
  parent_id,
  seo_title,
  seo_description
)
VALUES (
  'b7777777-7777-4777-b777-111111111111',
  'Shirts',
  'men-shirts',
  'Casual, formal, and resort shirts tailored in pure linen and crisp handloom cotton.',
  1,
  true,
  'a7777777-7777-4777-a777-777777777777',
  'Men''s Shirts — Linen & Cotton Shirts | Velaash',
  'Discover handcrafted men''s shirts in pure breathable linen and lightweight cotton.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  display_order = EXCLUDED.display_order,
  is_active = true;

-- 2b. Men's Kurtas
INSERT INTO public.categories (
  id,
  name,
  slug,
  description,
  display_order,
  is_active,
  parent_id,
  seo_title,
  seo_description
)
VALUES (
  'b7777777-7777-4777-b777-222222222222',
  'Kurtas',
  'men-kurtas',
  'Short and classic length kurtas with subtle embroidery and mandarin collars.',
  2,
  true,
  'a7777777-7777-4777-a777-777777777777',
  'Men''s Kurtas — Handcrafted Ethnic Wear | Velaash',
  'Shop elegant men''s kurtas for festive occasions and comfortable everyday wear.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  display_order = EXCLUDED.display_order,
  is_active = true;

-- 2c. Men's T-Shirts
INSERT INTO public.categories (
  id,
  name,
  slug,
  description,
  display_order,
  is_active,
  parent_id,
  seo_title,
  seo_description
)
VALUES (
  'b7777777-7777-4777-b777-333333333333',
  'T-Shirts',
  'men-t-shirts',
  'Everyday crew necks and polo t-shirts crafted from ultra-fine combed cotton.',
  3,
  true,
  'a7777777-7777-4777-a777-777777777777',
  'Men''s T-Shirts & Polos | Velaash',
  'Ultra-soft everyday tees and knit polos for effortless casual style.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  display_order = EXCLUDED.display_order,
  is_active = true;

-- 2d. Men's Bottoms
INSERT INTO public.categories (
  id,
  name,
  slug,
  description,
  display_order,
  is_active,
  parent_id,
  seo_title,
  seo_description
)
VALUES (
  'b7777777-7777-4777-b777-444444444444',
  'Bottoms',
  'men-bottoms',
  'Relaxed drawstring trousers, tailored chinos, and easy linen pants for men.',
  4,
  true,
  'a7777777-7777-4777-a777-777777777777',
  'Men''s Bottoms — Trousers & Pants | Velaash',
  'Comfort-fit trousers and breathable linen bottoms designed for all-day ease.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  display_order = EXCLUDED.display_order,
  is_active = true;

-- 3. Category-Level Size Charts for Men's Categories
-- 3a. Men's Shirts Size Chart
INSERT INTO public.size_charts (
  id,
  category_id,
  product_id,
  name,
  measurement_unit,
  chart_data
)
VALUES (
  'c7777777-7777-4777-c777-111111111111',
  'b7777777-7777-4777-b777-111111111111',
  null,
  'Men''s Shirts Size Chart',
  'inches',
  '{
    "headers": ["Size", "Chest (in)", "Collar (in)", "Shoulder (in)", "Length (in)", "Sleeve (in)"],
    "rows": [
      { "Size": "S", "Chest (in)": "38", "Collar (in)": "15.0", "Shoulder (in)": "17.5", "Length (in)": "28.5", "Sleeve (in)": "24.5" },
      { "Size": "M", "Chest (in)": "40", "Collar (in)": "15.5", "Shoulder (in)": "18.0", "Length (in)": "29.0", "Sleeve (in)": "25.0" },
      { "Size": "L", "Chest (in)": "42", "Collar (in)": "16.0", "Shoulder (in)": "18.5", "Length (in)": "29.5", "Sleeve (in)": "25.5" },
      { "Size": "XL", "Chest (in)": "44", "Collar (in)": "16.5", "Shoulder (in)": "19.0", "Length (in)": "30.0", "Sleeve (in)": "26.0" },
      { "Size": "XXL", "Chest (in)": "46", "Collar (in)": "17.0", "Shoulder (in)": "19.5", "Length (in)": "30.5", "Sleeve (in)": "26.5" }
    ],
    "tips": [
      "Chest: Measure around the fullest part of your chest, keeping the measuring tape horizontal.",
      "Collar: Measure around the base of your neck where your shirt collar sits.",
      "Shoulder: Measure across the back from the tip of one shoulder bone to the other.",
      "Length: Measure from the highest point of the shoulder down to the desired hemline.",
      "Fits true to regular fit. If you prefer a relaxed silhouette, consider one size up."
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  chart_data = EXCLUDED.chart_data;

-- 3b. Men's Kurtas Size Chart
INSERT INTO public.size_charts (
  id,
  category_id,
  product_id,
  name,
  measurement_unit,
  chart_data
)
VALUES (
  'c7777777-7777-4777-c777-222222222222',
  'b7777777-7777-4777-b777-222222222222',
  null,
  'Men''s Kurtas Size Chart',
  'inches',
  '{
    "headers": ["Size", "Chest (in)", "Shoulder (in)", "Kurta Length (in)", "Sleeve (in)"],
    "rows": [
      { "Size": "S", "Chest (in)": "38", "Shoulder (in)": "17.5", "Kurta Length (in)": "40.0", "Sleeve (in)": "24.5" },
      { "Size": "M", "Chest (in)": "40", "Shoulder (in)": "18.0", "Kurta Length (in)": "41.0", "Sleeve (in)": "25.0" },
      { "Size": "L", "Chest (in)": "42", "Shoulder (in)": "18.5", "Kurta Length (in)": "42.0", "Sleeve (in)": "25.5" },
      { "Size": "XL", "Chest (in)": "44", "Shoulder (in)": "19.0", "Kurta Length (in)": "43.0", "Sleeve (in)": "26.0" },
      { "Size": "XXL", "Chest (in)": "46", "Shoulder (in)": "19.5", "Kurta Length (in)": "44.0", "Sleeve (in)": "26.5" }
    ],
    "tips": [
      "Chest: Measure under your arms around the fullest part of your chest.",
      "Length: Classic knee-length cut measured from the shoulder seam.",
      "Garment measurements include 4-5 inches of ease for traditional relaxed drape."
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  chart_data = EXCLUDED.chart_data;

-- 3c. Men's T-Shirts Size Chart
INSERT INTO public.size_charts (
  id,
  category_id,
  product_id,
  name,
  measurement_unit,
  chart_data
)
VALUES (
  'c7777777-7777-4777-c777-333333333333',
  'b7777777-7777-4777-b777-333333333333',
  null,
  'Men''s T-Shirts Size Chart',
  'inches',
  '{
    "headers": ["Size", "Chest (in)", "Length (in)", "Shoulder (in)", "Sleeve (in)"],
    "rows": [
      { "Size": "S", "Chest (in)": "38", "Length (in)": "27.0", "Shoulder (in)": "17.0", "Sleeve (in)": "8.0" },
      { "Size": "M", "Chest (in)": "40", "Length (in)": "28.0", "Shoulder (in)": "17.5", "Sleeve (in)": "8.5" },
      { "Size": "L", "Chest (in)": "42", "Length (in)": "29.0", "Shoulder (in)": "18.0", "Sleeve (in)": "9.0" },
      { "Size": "XL", "Chest (in)": "44", "Length (in)": "30.0", "Shoulder (in)": "18.5", "Sleeve (in)": "9.5" },
      { "Size": "XXL", "Chest (in)": "46", "Length (in)": "31.0", "Shoulder (in)": "19.0", "Sleeve (in)": "10.0" }
    ],
    "tips": [
      "Chest: Measure across the fullest part of your torso.",
      "Length: Measured from high shoulder point to bottom hem.",
      "Regular fit cut. Pre-shrunk 100% combed cotton jersey."
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  chart_data = EXCLUDED.chart_data;

-- 3d. Men's Bottoms Size Chart
INSERT INTO public.size_charts (
  id,
  category_id,
  product_id,
  name,
  measurement_unit,
  chart_data
)
VALUES (
  'c7777777-7777-4777-c777-444444444444',
  'b7777777-7777-4777-b777-444444444444',
  null,
  'Men''s Bottoms Size Chart',
  'inches',
  '{
    "headers": ["Size", "Waist (in)", "Hip (in)", "Inseam (in)", "Outseam (in)"],
    "rows": [
      { "Size": "S", "Waist (in)": "30", "Hip (in)": "38", "Inseam (in)": "30.5", "Outseam (in)": "40.0" },
      { "Size": "M", "Waist (in)": "32", "Hip (in)": "40", "Inseam (in)": "31.0", "Outseam (in)": "41.0" },
      { "Size": "L", "Waist (in)": "34", "Hip (in)": "42", "Inseam (in)": "31.5", "Outseam (in)": "41.5" },
      { "Size": "XL", "Waist (in)": "36", "Hip (in)": "44", "Inseam (in)": "32.0", "Outseam (in)": "42.0" },
      { "Size": "XXL", "Waist (in)": "38", "Hip (in)": "46", "Inseam (in)": "32.5", "Outseam (in)": "42.5" }
    ],
    "tips": [
      "Waist: Measure around your natural waistline where you comfortably wear your pants.",
      "Inseam: Measure from the crotch point down to the ankle hem.",
      "Elasticated waistband with drawstring allows ~1.5 inches of flexibility."
    ]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  chart_data = EXCLUDED.chart_data;
