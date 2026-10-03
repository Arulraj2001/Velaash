-- 029: Add cod_disabled_display_mode to payment_settings
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

UPDATE public.site_settings
SET value = jsonb_set(
  COALESCE(value, '{}'::jsonb),
  '{cod_disabled_display_mode}',
  '"hidden"'::jsonb,
  true
),
updated_at = NOW()
WHERE key = 'payment_settings';
