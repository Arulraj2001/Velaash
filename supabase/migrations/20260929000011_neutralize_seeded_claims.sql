-- Migration 011: Neutralize previously seeded unconfirmed claims and fabricated content
-- Ensures any database instances that ran migration 010 previously are updated
-- with clean, neutral placeholder text that the client can personalize later.

-- 1. Neutralize announcement_bar in site_settings unconditionally
UPDATE public.site_settings
SET value = jsonb_build_object(
  'is_enabled', true,
  'text', 'Welcome to Velaash — New Arrivals Every Week',
  'link', '/shop'
)
WHERE key = 'announcement_bar';

-- 2. Neutralize seo_defaults in site_settings unconditionally
UPDATE public.site_settings
SET value = jsonb_build_object(
  'meta_title', 'Velaash | Modern Everyday Luxury & Contemporary Clothing',
  'meta_description', 'Contemporary clothing designed with refined fabrics and effortless silhouettes for your everyday and occasion wardrobe.'
)
WHERE key = 'seo_defaults';

-- 3. Purge unverified homepage sections (couture spotlight, unverified testimonials)
DELETE FROM public.homepage_sections
WHERE section_type IN ('couture_spotlight', 'testimonials');

-- 4. Update hero_banner in homepage_sections to neutral placeholders
UPDATE public.homepage_sections
SET
  title = 'Modern Everyday Luxury',
  content = jsonb_build_object(
    'headline', 'Modern Everyday Luxury',
    'subheading', 'Quality clothing designed for everyday elegance and effortless refinement.',
    'cta_label', 'Explore Collection',
    'cta_link', '/shop',
    'bg_image', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80'
  )
WHERE section_type = 'hero_banner';

-- 5. Update category_grid in homepage_sections to real general clothing categories
UPDATE public.homepage_sections
SET
  title = 'Explore Categories',
  content = jsonb_build_object(
    'layout', 'grid-4',
    'categories', jsonb_build_array('kurtas-sets', 'dresses', 'co-ord-sets', 'tops-tunics')
  )
WHERE section_type = 'category_grid';

-- 6. Insert value_strip if not already present
INSERT INTO public.homepage_sections (section_type, title, display_order, is_active, content)
VALUES
  (
    'value_strip',
    'Our Commitments',
    4,
    true,
    '{
      "items": [
        { "title": "Pan-India Delivery", "description": "Reliable shipping across India" },
        { "title": "Easy Returns", "description": "Hassle-free return & exchange policy" },
        { "title": "Secure Payments", "description": "100% encrypted & protected checkout" },
        { "title": "WhatsApp Support", "description": "Personal assistance on +91 8508643832" }
      ]
    }'::jsonb
  )
ON CONFLICT DO NOTHING;
