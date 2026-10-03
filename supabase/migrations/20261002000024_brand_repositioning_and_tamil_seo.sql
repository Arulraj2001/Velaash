-- 024: Brand Repositioning & Tamil SEO Keywords
-- Velaash Lifestyle Platform (VELAASH TRADER'S)
-- Repositioning from women's-only clothing to broader lifestyle store
-- (clothing for men and women, plus traditional pooja and brass essentials)

-- 1. Update store_profile tagline in site_settings
UPDATE public.site_settings
SET value = jsonb_set(
  value,
  '{tagline}',
  '"Velaash — Everyday essentials for every home"'::jsonb
),
updated_at = now()
WHERE key = 'store_profile';

-- 2. Update seo_defaults (title, description, and additive Tamil/English keywords)
UPDATE public.site_settings
SET value = jsonb_build_object(
  'meta_title', 'Velaash — Everyday essentials for every home',
  'meta_description', 'Shop clothing for men and women, plus traditional pooja and brass essentials, at Velaash.',
  'keywords', 'Velaash, Everyday essentials, Clothing for men and women, Pooja essentials, Brass essentials, ஆடை, கடை'
),
updated_at = now()
WHERE key = 'seo_defaults';

-- 3. Update hero_banner title & content in homepage_sections
UPDATE public.homepage_sections
SET title = 'Everyday essentials for every home',
    content = jsonb_set(
      jsonb_set(
        content,
        '{headline}',
        '"Everyday essentials for every home"'::jsonb
      ),
      '{subtitle}',
      '"Clothing for men and women, plus traditional pooja and brass essentials."'::jsonb
    ),
    updated_at = now()
WHERE section_type = 'hero_banner';

-- 4. Update testimonials section in homepage_sections
UPDATE public.homepage_sections
SET title = 'Customer Reviews',
    content = jsonb_set(
      jsonb_set(
        content,
        '{headline}',
        '"Loved by Our Customers"'::jsonb
      ),
      '{subtitle}',
      '"Real experiences from customers who celebrate quality and everyday grace."'::jsonb
    ),
    updated_at = now()
WHERE section_type = 'testimonials';
