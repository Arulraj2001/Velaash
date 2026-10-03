-- 028: Customer Checkout Policy & Sign-In Requirement Toggle
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

INSERT INTO public.site_settings (key, value, description, is_public)
VALUES (
  'checkout_policy',
  '{"require_sign_in_to_order": false}'::jsonb,
  'Customer account requirements and guest checkout policy for order placement',
  true
)
ON CONFLICT (key) DO NOTHING;
