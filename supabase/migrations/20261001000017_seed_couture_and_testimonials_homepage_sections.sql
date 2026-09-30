-- 017: Seed Couture Spotlight, Testimonials, and Occasion Strip Homepage Sections
-- Velaash E-Commerce Platform

-- 1. Ensure enum values exist
ALTER TYPE public.homepage_section_type ADD VALUE IF NOT EXISTS 'occasion_strip';
ALTER TYPE public.homepage_section_type ADD VALUE IF NOT EXISTS 'couture_spotlight';
ALTER TYPE public.homepage_section_type ADD VALUE IF NOT EXISTS 'testimonials';

-- 2. Update hero_banner to include all 3 dynamic slides if not already set
UPDATE public.homepage_sections
SET content = jsonb_set(
  content,
  '{slides}',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'slide-1',
      'tag', 'Spring / Summer 2026',
      'headline', COALESCE(content->>'headline', 'Modern Everyday Luxury'),
      'subtitle', COALESCE(content->>'subtitle', 'Effortless silhouettes, refined textures, and contemporary wardrobe essentials designed for everyday elegance.'),
      'cta_text', COALESCE(content->>'cta_text', 'Explore Collection'),
      'cta_link', COALESCE(content->>'cta_link', '/shop'),
      'secondary_cta_text', COALESCE(content->>'secondary_cta_text', 'Kurtas & Sets'),
      'secondary_cta_link', COALESCE(content->>'secondary_cta_link', '/collections/kurtas-sets'),
      'bg_image', COALESCE(content->>'bg_image', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85')
    ),
    jsonb_build_object(
      'id', 'slide-2',
      'tag', 'Festive Capsule',
      'headline', 'Timeless Grace, Artisanal Craft',
      'subtitle', 'Handcrafted threadwork, rich jewel tones, and opulent fabrics tailored for your special celebrations.',
      'cta_text', 'Shop Festive',
      'cta_link', '/collections/kurtas-sets',
      'secondary_cta_text', 'Dresses',
      'secondary_cta_link', '/collections/dresses',
      'bg_image', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=2000&q=85'
    ),
    jsonb_build_object(
      'id', 'slide-3',
      'tag', 'Contemporary Co-Ords',
      'headline', 'The Art of Breathable Dressing',
      'subtitle', 'Pure cottons and relaxed co-ords designed to keep you poised from morning meetings to evening dinners.',
      'cta_text', 'Discover Co-ords',
      'cta_link', '/collections/co-ord-sets',
      'secondary_cta_text', 'View All',
      'secondary_cta_link', '/shop',
      'bg_image', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2000&q=85'
    )
  ),
  true
)
WHERE section_type = 'hero_banner'
  AND (content->'slides' IS NULL OR jsonb_array_length(content->'slides') = 0);

-- 3. Insert occasion_strip if not present
INSERT INTO public.homepage_sections (section_type, title, display_order, is_active, content)
SELECT
  'occasion_strip'::public.homepage_section_type,
  'Shop by Occasion',
  2,
  true,
  jsonb_build_object(
    'title', 'Shop by Occasion',
    'subtitle', 'Thoughtfully curated palettes and cuts styled for life''s special celebrations and effortless daily poise.',
    'items', jsonb_build_array(
      jsonb_build_object(
        'id', 'occ-1',
        'name', 'Festive Capsule',
        'subtitle', 'Zari, Silk Blends & Brocades',
        'slug', 'festive',
        'image', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
        'href', '/collections/kurtas-sets'
      ),
      jsonb_build_object(
        'id', 'occ-2',
        'name', 'Workday Grace',
        'subtitle', 'Clean cuts & breathable comfort',
        'slug', 'workwear',
        'image', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
        'href', '/shop?sort=newest'
      ),
      jsonb_build_object(
        'id', 'occ-3',
        'name', 'Evening Soirées',
        'subtitle', 'Statement Co-Ords & Drapes',
        'slug', 'evening',
        'image', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
        'href', '/collections/co-ord-sets'
      ),
      jsonb_build_object(
        'id', 'occ-4',
        'name', 'Casual Brunches',
        'subtitle', 'Airy silhouettes & subtle prints',
        'slug', 'brunch',
        'image', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80',
        'href', '/collections/dresses'
      )
    )
  )
WHERE NOT EXISTS (
  SELECT 1 FROM public.homepage_sections WHERE section_type = 'occasion_strip'
);

-- 4. Insert couture_spotlight if not present
INSERT INTO public.homepage_sections (section_type, title, display_order, is_active, content)
SELECT
  'couture_spotlight'::public.homepage_section_type,
  'The Craft of Velaash',
  5,
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

-- 5. Insert testimonials if not present
INSERT INTO public.homepage_sections (section_type, title, display_order, is_active, content)
SELECT
  'testimonials'::public.homepage_section_type,
  'Patron Testimonials',
  6,
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

-- 6. Update display orders so sections are cleanly ordered sequentially
UPDATE public.homepage_sections SET display_order = 1 WHERE section_type = 'hero_banner';
UPDATE public.homepage_sections SET display_order = 2 WHERE section_type = 'occasion_strip';
UPDATE public.homepage_sections SET display_order = 3 WHERE section_type = 'category_grid';
UPDATE public.homepage_sections SET display_order = 4 WHERE section_type = 'featured_products';
UPDATE public.homepage_sections SET display_order = 5 WHERE section_type = 'couture_spotlight';
UPDATE public.homepage_sections SET display_order = 6 WHERE section_type = 'testimonials';
UPDATE public.homepage_sections SET display_order = 7 WHERE section_type = 'value_strip';
UPDATE public.homepage_sections SET display_order = 8 WHERE section_type IN ('newsletter', 'custom_html');
