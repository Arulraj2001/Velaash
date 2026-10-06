-- 034: Returns Policy Enhancements & Product-Level Returnable (Final Sale) Toggle
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Add returnable & final sale override columns directly to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_returnable boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS return_override_note text;

-- 2. Partial index for rapid filtering/lookup of non-returnable (Final Sale) items
CREATE INDEX IF NOT EXISTS idx_products_non_returnable
  ON public.products (id)
  WHERE is_returnable = false;

COMMENT ON COLUMN public.products.is_returnable IS
  'Toggles whether this product is eligible for returns and exchanges (false = Final Sale / Non-Returnable).';

COMMENT ON COLUMN public.products.return_override_note IS
  'Optional custom reason or disclosure for non-returnable items (e.g. Made-to-order couture, custom stitching, hygiene wear).';
