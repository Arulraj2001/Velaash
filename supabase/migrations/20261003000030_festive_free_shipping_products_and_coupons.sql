-- 030: Festive Free Shipping Columns for Products & Coupons
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Add optional festive shipping columns directly to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS free_shipping_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_shipping_start timestamptz,
  ADD COLUMN IF NOT EXISTS free_shipping_end timestamptz,
  ADD COLUMN IF NOT EXISTS free_shipping_badge_text text DEFAULT '🌾 Festive Special: Free Delivery';

-- 2. Index for rapid lookup of active festive products during campaign periods
CREATE INDEX IF NOT EXISTS idx_products_free_shipping
  ON public.products (free_shipping_active, free_shipping_start, free_shipping_end)
  WHERE free_shipping_active = true;

COMMENT ON COLUMN public.products.free_shipping_active IS
  'Toggles automatic festive free shipping for this specific product without requiring minimum order threshold.';

COMMENT ON COLUMN public.products.free_shipping_start IS
  'Start timestamp for the product-level festive free shipping offer.';

COMMENT ON COLUMN public.products.free_shipping_end IS
  'Expiration timestamp for the product-level festive free shipping offer. Offer automatically ends after this time.';

COMMENT ON COLUMN public.products.free_shipping_badge_text IS
  'Custom badge text displayed on product card, PDP banner, cart, and checkout summary.';
