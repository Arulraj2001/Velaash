-- Velaash E-Commerce Platform (VELAASH TRADER'S)
-- Migration: 20260930000015_shiprocket_settings
-- Purpose: Seeds the shiprocket_settings key in site_settings.
--          Admin can update this via the admin panel or directly in the table.
--          Used by:
--            - /api/shiprocket/serviceability (pickup_postcode)
--            - pushToShiprocketAction (pickup_location_name)
--            - createOrderAction (pickup_postcode, default_weight_kg)

INSERT INTO public.site_settings (key, value, description, is_public)
VALUES (
  'shiprocket_settings',
  '{
    "pickup_postcode": "600001",
    "pickup_location_name": "Primary",
    "default_weight_kg": 0.5,
    "auto_push_on_pack": false
  }'::jsonb,
  'Shiprocket logistics integration settings. pickup_postcode: store/warehouse postcode. pickup_location_name: must match name in Shiprocket dashboard. default_weight_kg: fallback per-order weight if not specified per-product. auto_push_on_pack: reserved for future use.',
  false
)
ON CONFLICT (key) DO NOTHING;
