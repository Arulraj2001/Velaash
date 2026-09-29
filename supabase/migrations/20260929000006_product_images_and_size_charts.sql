-- 006: Product Images & Boutique Size Charts
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Product Images Table
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  alt_text text,
  display_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger to maintain single primary image per product
CREATE OR REPLACE FUNCTION public.handle_primary_product_image()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.product_images
    SET is_primary = false
    WHERE product_id = NEW.product_id
      AND id <> NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_single_primary_image
  BEFORE INSERT OR UPDATE OF is_primary ON public.product_images
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION public.handle_primary_product_image();

-- 2. Size Charts Table (Category level or Product-specific overrides)
CREATE TABLE IF NOT EXISTS public.size_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  chart_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  measurement_unit text NOT NULL DEFAULT 'inches',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_size_chart_target CHECK (category_id IS NOT NULL OR product_id IS NOT NULL)
);

-- Trigger for updated_at on size_charts
CREATE TRIGGER set_size_charts_updated_at
  BEFORE UPDATE ON public.size_charts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_images_product_order ON public.product_images (product_id, display_order);
CREATE INDEX IF NOT EXISTS idx_images_variant ON public.product_images (variant_id);
CREATE INDEX IF NOT EXISTS idx_size_charts_category ON public.size_charts (category_id);
CREATE INDEX IF NOT EXISTS idx_size_charts_product ON public.size_charts (product_id);

-- 4. Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_charts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Product Images
CREATE POLICY "Public can view product images"
  ON public.product_images
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id AND (p.is_active = true OR public.is_admin())
    )
  );

CREATE POLICY "Admins can insert product images"
  ON public.product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update product images"
  ON public.product_images
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete product images"
  ON public.product_images
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 6. RLS Policies: Size Charts
CREATE POLICY "Public can view size charts"
  ON public.size_charts
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert size charts"
  ON public.size_charts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update size charts"
  ON public.size_charts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete size charts"
  ON public.size_charts
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
