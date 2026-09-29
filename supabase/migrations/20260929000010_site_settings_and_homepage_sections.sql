-- 010: Dynamic Site Settings & Admin Homepage Sections Builder
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Site Settings Table (Key-Value JSONB Architecture)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for settings updated_at
CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. Homepage Builder Sections Table
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type public.homepage_section_type NOT NULL,
  title text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for homepage_sections updated_at
CREATE TRIGGER set_homepage_sections_updated_at
  BEFORE UPDATE ON public.homepage_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_homepage_sections_order ON public.homepage_sections (is_active, display_order);

-- 4. Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Site Settings
CREATE POLICY "Public can view public site settings"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true OR public.is_admin());

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update site settings"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete site settings"
  ON public.site_settings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 6. RLS Policies: Homepage Sections
CREATE POLICY "Public can view active homepage sections"
  ON public.homepage_sections
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert homepage sections"
  ON public.homepage_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update homepage sections"
  ON public.homepage_sections
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete homepage sections"
  ON public.homepage_sections
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 7. Seed Initial Default Site Settings
INSERT INTO public.site_settings (key, value, description, is_public)
VALUES
  (
    'store_profile',
    '{
      "name": "Velaash",
      "legal_name": "VELAASH TRADER''S",
      "tagline": "Contemporary Elegance, Timeless Style",
      "email": "bestrchandra@gmail.com",
      "phone": "+91 8508643832",
      "whatsapp_number": "+91 8508643832",
      "whatsapp_url": "https://wa.me/918508643832",
      "logo_url": "/brand/logo.svg",
      "favicon_url": "/favicon.ico"
    }'::jsonb,
    'Core business and brand identity info (email: temporary bestrchandra@gmail.com until custom domain email is set up)',
    true
  ),
  (
    'brand_colors',
    '{
      "primary_gold": "#F2A900",
      "accent_gold": "#CC6F00",
      "brand_dark": "#4D2A00",
      "light_gold": "#F9E6A8",
      "cream": "#FFFBF0"
    }'::jsonb,
    'Client branding color theme tokens',
    true
  ),
  (
    'shipping_rules',
    '{
      "free_shipping_threshold": 5000,
      "standard_shipping_charge": 250,
      "express_shipping_charge": 500
    }'::jsonb,
    'Shipping rates and free threshold in INR',
    true
  ),
  (
    'tax_settings',
    '{
      "gst_enabled": true,
      "gstin": null,
      "default_gst_rate": 5.00
    }'::jsonb,
    'Indian GST tax configuration',
    true
  ),
  (
    'payment_settings',
    '{
      "razorpay_enabled": true,
      "cod_enabled": true,
      "cod_max_order_value": 20000,
      "cod_handling_fee": 99
    }'::jsonb,
    'Payment gateway and Cash-On-Delivery limits',
    true
  ),
  (
    'announcement_bar',
    '{
      "is_enabled": true,
      "text": "Complimentary Bespoke Fitting & Express Shipping across India",
      "link": "#"
    }'::jsonb,
    'Top boutique notification banner text',
    true
  ),
  (
    'social_links',
    '{
      "instagram": "https://instagram.com/velaash",
      "facebook": "https://facebook.com/velaash",
      "whatsapp": "https://wa.me/918508643832",
      "pinterest": "https://pinterest.com/velaash"
    }'::jsonb,
    'Official social media profiles (Instagram and Facebook are placeholders awaiting client handles)',
    true
  ),
  (
    'seo_defaults',
    '{
      "meta_title": "Velaash | Luxury Indian Designer Clothing & Couture",
      "meta_description": "Exclusive Indian luxury clothing boutique celebrating timeless craftsmanship, royal silhouettes, and modern artistry."
    }'::jsonb,
    'Default search engine meta tags',
    true
  )
ON CONFLICT (key) DO NOTHING;

-- 8. Seed Initial Default Homepage Builder Sections
INSERT INTO public.homepage_sections (section_type, title, display_order, is_active, content)
VALUES
  (
    'hero_banner',
    'Royal Autumn-Winter Couture Collection',
    1,
    true,
    '{
      "headline": "Banarasi Silks & Royal Zardozi",
      "subheading": "Handcrafted couture pieces woven with real golden threads.",
      "cta_label": "Explore Collection",
      "cta_link": "/collections/bridal-festive",
      "bg_image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80"
    }'::jsonb
  ),
  (
    'category_grid',
    'Signature Collections',
    2,
    true,
    '{
      "layout": "grid-4",
      "categories": ["sarees", "lehengas", "anarkalis", "pre-order-couture"]
    }'::jsonb
  ),
  (
    'featured_products',
    'Curated Heirlooms',
    3,
    true,
    '{
      "collection_tag": "featured",
      "item_limit": 8
    }'::jsonb
  ),
  (
    'couture_spotlight',
    'The Artisan Story',
    4,
    true,
    '{
      "craft_title": "Centuries of Heritage in Every Thread",
      "description": "Our master weavers in Varanasi and Kanchipuram spend up to 180 hours on each bespoke piece.",
      "read_more_link": "/about"
    }'::jsonb
  ),
  (
    'testimonials',
    'Voices of Royalty',
    5,
    true,
    '{
      "items": [
        {
          "client_name": "Meera Singhania",
          "city": "Mumbai",
          "quote": "The bespoke bridal lehenga from Velaash was breathtaking. Every stitch exuded pure luxury."
        },
        {
          "client_name": "Ananya Roy",
          "city": "Kolkata",
          "quote": "Pure gold zari work that felt like wearing an heirloom. Unmatched craftsmanship."
        }
      ]
    }'::jsonb
  )
ON CONFLICT DO NOTHING;
