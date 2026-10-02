-- 023: Promo Popup Site Setting
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

INSERT INTO public.site_settings (key, value, description, is_public)
VALUES (
  'promo_popup',
  '{
    "is_enabled": false,
    "featured_coupon_id": null,
    "popup_title": "Special Offer",
    "popup_description": "Use this code at checkout to enjoy an exclusive discount on your order.",
    "delay_seconds": 9
  }'::jsonb,
  'Site-wide promotional offer popup configuration tied to an active coupon.',
  true
)
ON CONFLICT (key) DO NOTHING;
