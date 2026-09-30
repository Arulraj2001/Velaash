-- Migration 014: Homepage Builder and Site Settings Consolidation
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Ensure 'newsletter' exists in homepage_section_type enum
ALTER TYPE public.homepage_section_type ADD VALUE IF NOT EXISTS 'newsletter';

-- 2. Clean up any redundant duplicate seeded rows in homepage_sections
-- Keep the cleanly structured sections
DELETE FROM public.homepage_sections
WHERE id IN (
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000003',
  '40000000-0000-4000-8000-000000000004',
  'a3f5b925-2af5-4508-8a62-47836c1fe589'
);

-- 3. Ensure default 5 sections are present with clean display orders
UPDATE public.homepage_sections
SET display_order = 1
WHERE section_type = 'hero_banner';

UPDATE public.homepage_sections
SET display_order = 2
WHERE section_type = 'category_grid';

UPDATE public.homepage_sections
SET display_order = 3
WHERE section_type = 'featured_products';

UPDATE public.homepage_sections
SET display_order = 4
WHERE section_type = 'value_strip';

-- 4. Initialize tax_settings if missing
INSERT INTO public.site_settings (key, value, description, is_public)
VALUES (
  'tax_settings',
  jsonb_build_object(
    'gst_enabled', true,
    'gstin', null,
    'default_gst_rate', 5.00
  ),
  'Indian GST tax configuration',
  true
)
ON CONFLICT (key) DO NOTHING;

-- 5. Initialize seo_defaults if missing
INSERT INTO public.site_settings (key, value, description, is_public)
VALUES (
  'seo_defaults',
  jsonb_build_object(
    'meta_title', 'Velaash | Modern Everyday Luxury & Contemporary Clothing',
    'meta_description', 'Contemporary clothing designed with refined fabrics and effortless silhouettes for your everyday and occasion wardrobe.'
  ),
  'Default search engine meta tags',
  true
)
ON CONFLICT (key) DO NOTHING;
