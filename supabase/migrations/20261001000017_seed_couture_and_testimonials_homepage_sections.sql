-- 017: Seed Couture Spotlight and Testimonials Homepage Sections
-- Velaash E-Commerce Platform

-- 1. Ensure enum values exist
ALTER TYPE public.homepage_section_type ADD VALUE IF NOT EXISTS 'couture_spotlight';
ALTER TYPE public.homepage_section_type ADD VALUE IF NOT EXISTS 'testimonials';

-- 2. Insert couture_spotlight if not present
INSERT INTO public.homepage_sections (section_type, title, display_order, is_active, content)
SELECT
  'couture_spotlight'::public.homepage_section_type,
  'The Craft of Velaash',
  4,
  true,
  jsonb_build_object(
    'tagline', 'Artisanal Craft & Slow Fashion',
    'headline', 'Consciously Crafted. Designed for Everyday Grace.',
    'description', 'At Velaash, we reject disposable seasonal trends. Every piece is envisioned as an heirloom essential — pairing the airy breathability of authentic Indian textiles with sleek, contemporary cuts that seamlessly carry you from boardroom poise to festive soirees.',
    'image_url', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80',
    'detail_badge_title', 'The Velaash Touch',
    'detail_badge_text', 'Hand-finished hems, concealed seams, and breathable natural textiles curated for lasting poise.',
    'cta_text', 'Explore The Full Catalog',
    'cta_link', '/shop'
  )
WHERE NOT EXISTS (
  SELECT 1 FROM public.homepage_sections WHERE section_type = 'couture_spotlight'
);

-- 3. Insert testimonials if not present
INSERT INTO public.homepage_sections (section_type, title, display_order, is_active, content)
SELECT
  'testimonials'::public.homepage_section_type,
  'Patron Testimonials',
  5,
  true,
  jsonb_build_object(
    'headline', 'Cherished by Our Patrons',
    'subtitle', 'Real experiences from women who celebrate everyday grace in our tailored silhouettes.',
    'items', jsonb_build_array(
      jsonb_build_object(
        'id', '1',
        'name', 'Ananya Sharma',
        'location', 'Mumbai',
        'rating', 5,
        'review', 'The fabric quality of the Chanderi Kurta set is simply unmatched. It breathes so well even during humid days, and the subtle gold zari trim feels wonderfully luxurious without being over the top.',
        'product_name', 'Chanderi Anarkali Set'
      ),
      jsonb_build_object(
        'id', '2',
        'name', 'Ritu Mathur',
        'location', 'Bangalore',
        'rating', 5,
        'review', 'Wore my Velaash co-ord set to an evening gallery preview and received countless compliments! The drape is exceptionally flattering, and the stitching is high-end boutique caliber.',
        'product_name', 'Silk Blend Co-Ord Ensemble'
      ),
      jsonb_build_object(
        'id', '3',
        'name', 'Dr. Divya Patel',
        'location', 'Ahmedabad',
        'rating', 5,
        'review', 'Fast dispatch, gorgeous unboxing packaging, and the cotton weave is heavenly. It holds its silhouette beautifully after multiple gentle washes. Velaash is my new staple.',
        'product_name', 'Everyday Classic Straight Kurta'
      )
    )
  )
WHERE NOT EXISTS (
  SELECT 1 FROM public.homepage_sections WHERE section_type = 'testimonials'
);

-- 4. Update display orders so sections are cleanly ordered sequentially
UPDATE public.homepage_sections SET display_order = 1 WHERE section_type = 'hero_banner';
UPDATE public.homepage_sections SET display_order = 2 WHERE section_type = 'category_grid';
UPDATE public.homepage_sections SET display_order = 3 WHERE section_type = 'featured_products';
UPDATE public.homepage_sections SET display_order = 4 WHERE section_type = 'couture_spotlight';
UPDATE public.homepage_sections SET display_order = 5 WHERE section_type = 'testimonials';
UPDATE public.homepage_sections SET display_order = 6 WHERE section_type = 'value_strip';
UPDATE public.homepage_sections SET display_order = 7 WHERE section_type IN ('newsletter', 'custom_html');
