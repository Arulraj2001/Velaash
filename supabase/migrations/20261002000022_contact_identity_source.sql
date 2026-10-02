UPDATE public.site_settings
SET value = value - 'whatsapp_url',
    updated_at = now()
WHERE key = 'store_profile'
  AND value ? 'whatsapp_url';

UPDATE public.site_settings
SET value = value - 'whatsapp',
    updated_at = now()
WHERE key = 'social_links'
  AND value ? 'whatsapp';

UPDATE public.homepage_sections AS section
SET content = jsonb_set(
  section.content,
  '{items}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN item.value->>'icon' = 'MessageCircle'
          OR lower(coalesce(item.value->>'title', '')) LIKE '%whatsapp%'
          THEN item.value || '{"description":"Direct assistance and sizing guidance on WhatsApp."}'::jsonb
        ELSE item.value
      END
      ORDER BY item.ordinality
    )
    FROM jsonb_array_elements(section.content->'items') WITH ORDINALITY AS item(value, ordinality)
  ),
  true
)
WHERE jsonb_typeof(section.content->'items') = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(section.content->'items') AS item(value)
    WHERE item.value->>'icon' = 'MessageCircle'
      OR lower(coalesce(item.value->>'title', '')) LIKE '%whatsapp%'
  );