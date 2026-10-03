-- 027: Pooja & Brass Items Category, Subcategories, and Simple Product Draft Shells
-- Velaash Lifestyle Expansion (Brassware & Sacred Decor)

-- 1. Insert Top-Level Category: Pooja & Brass Items
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
  'a8888888-8888-4888-a888-888888888888',
  'Pooja & Brass Items',
  'pooja-and-brass',
  'Traditional lamps, handcrafted brassware, and sacred essentials for your home and pooja room.',
  8,
  true,
  null,
  'Pooja & Brass Items Collection | Velaash',
  'Discover traditional brass kuthuvilakku, lamps, diyas, and sacred pooja accessories at Velaash.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true,
  display_order = EXCLUDED.display_order,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

-- 2. Insert Subcategories under Pooja & Brass Items
-- 2a. Lamps & Diyas
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
  'b8888888-8888-4888-b888-111111111111',
  'Lamps & Diyas',
  'lamps-diyas',
  'Traditional brass kuthuvilakku, table lamps, hanging lamps, and handcrafted oil diyas.',
  1,
  true,
  'a8888888-8888-4888-a888-888888888888',
  'Lamps & Diyas — Traditional Brass Lighting | Velaash',
  'Shop traditional brass kuthuvilakku, table lamps, and festive diyas at Velaash.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  display_order = EXCLUDED.display_order,
  is_active = true,
  description = EXCLUDED.description,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

-- 2b. Pooja Accessories
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
  'b8888888-8888-4888-b888-222222222222',
  'Pooja Accessories',
  'pooja-accessories',
  'Bells, brass aarti plates, incense holders, and sacred pooja essentials.',
  2,
  true,
  'a8888888-8888-4888-a888-888888888888',
  'Pooja Accessories — Sacred Brassware | Velaash',
  'Discover brass bells, pooja thalis, and traditional accessories at Velaash.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  display_order = EXCLUDED.display_order,
  is_active = true,
  description = EXCLUDED.description,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

-- 3. Insert Simple Product Draft Shells under Lamps & Diyas (STRICTLY DEACTIVATED: is_active = false)
-- 3a. DRAFT — Traditional Brass Kuthuvilakku
INSERT INTO public.products (
  id,
  name,
  slug,
  description,
  category_id,
  base_price,
  compare_at_price,
  has_variants,
  stock_quantity,
  specifications,
  fabric,
  care_instructions,
  craftsmanship,
  is_active,
  is_featured,
  is_made_to_order,
  stock_status,
  hsn_code,
  gst_rate,
  seo_title,
  seo_description
)
VALUES (
  'c8888888-8888-4888-c888-111111111111',
  'DRAFT — Traditional Brass Kuthuvilakku',
  'draft-traditional-brass-kuthuvilakku',
  'Placeholder draft shell — awaiting client specifications and photography',
  'b8888888-8888-4888-b888-111111111111',
  2499.00,
  2999.00,
  false,
  10,
  '[
    {"label": "Material", "value": "Brass"},
    {"label": "Finish", "value": "Gold-tone"},
    {"label": "Height", "value": "[placeholder — awaiting real measurement]"},
    {"label": "Weight", "value": "[placeholder — awaiting real measurement]"}
  ]'::jsonb,
  null,
  null,
  null,
  false,
  false,
  false,
  'in_stock',
  '7419',
  12.00,
  'DRAFT — Traditional Brass Kuthuvilakku | Velaash',
  'Placeholder draft shell for brass kuthuvilakku.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  base_price = EXCLUDED.base_price,
  compare_at_price = EXCLUDED.compare_at_price,
  has_variants = EXCLUDED.has_variants,
  stock_quantity = EXCLUDED.stock_quantity,
  specifications = EXCLUDED.specifications,
  fabric = EXCLUDED.fabric,
  care_instructions = EXCLUDED.care_instructions,
  craftsmanship = EXCLUDED.craftsmanship,
  is_active = false,
  is_featured = false,
  stock_status = EXCLUDED.stock_status,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

-- 3b. DRAFT — Traditional Brass Lamp
INSERT INTO public.products (
  id,
  name,
  slug,
  description,
  category_id,
  base_price,
  compare_at_price,
  has_variants,
  stock_quantity,
  specifications,
  fabric,
  care_instructions,
  craftsmanship,
  is_active,
  is_featured,
  is_made_to_order,
  stock_status,
  hsn_code,
  gst_rate,
  seo_title,
  seo_description
)
VALUES (
  'c8888888-8888-4888-c888-222222222222',
  'DRAFT — Traditional Brass Lamp',
  'draft-traditional-brass-lamp',
  'Placeholder draft shell — awaiting client specifications and photography',
  'b8888888-8888-4888-b888-111111111111',
  1899.00,
  2299.00,
  false,
  10,
  '[
    {"label": "Material", "value": "Brass"},
    {"label": "Finish", "value": "Gold-tone"},
    {"label": "Height", "value": "[placeholder — awaiting real measurement]"},
    {"label": "Weight", "value": "[placeholder — awaiting real measurement]"}
  ]'::jsonb,
  null,
  null,
  null,
  false,
  false,
  false,
  'in_stock',
  '7419',
  12.00,
  'DRAFT — Traditional Brass Lamp | Velaash',
  'Placeholder draft shell for traditional brass lamp.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  base_price = EXCLUDED.base_price,
  compare_at_price = EXCLUDED.compare_at_price,
  has_variants = EXCLUDED.has_variants,
  stock_quantity = EXCLUDED.stock_quantity,
  specifications = EXCLUDED.specifications,
  fabric = EXCLUDED.fabric,
  care_instructions = EXCLUDED.care_instructions,
  craftsmanship = EXCLUDED.craftsmanship,
  is_active = false,
  is_featured = false,
  stock_status = EXCLUDED.stock_status,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;
