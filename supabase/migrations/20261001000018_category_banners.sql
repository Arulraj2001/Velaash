-- 018: Add Category Header Banner Fields
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Add dedicated banner columns to categories table
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS banner_image_url text,
  ADD COLUMN IF NOT EXISTS banner_badge text,
  ADD COLUMN IF NOT EXISTS banner_subtitle text;

-- 2. Add documentation comments
COMMENT ON COLUMN public.categories.banner_image_url IS 'High-resolution letterbox banner image displayed on the category storefront page';
COMMENT ON COLUMN public.categories.banner_badge IS 'Gold pill badge text displayed above category heading (e.g. Timeless Indian Weaves)';
COMMENT ON COLUMN public.categories.banner_subtitle IS 'Editorial description for the category banner header';
