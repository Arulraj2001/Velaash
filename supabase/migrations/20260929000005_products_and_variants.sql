-- 005: Products & Product Variants
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  base_price numeric(12,2) NOT NULL CHECK (base_price >= 0),
  compare_at_price numeric(12,2) CHECK (compare_at_price IS NULL OR compare_at_price >= base_price),
  fabric text,
  care_instructions text,
  craftsmanship text,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  is_made_to_order boolean NOT NULL DEFAULT false,
  stock_status public.stock_status NOT NULL DEFAULT 'in_stock',
  
  -- Physical Logistics & Indian Taxation Fields
  weight_grams integer CHECK (weight_grams IS NULL OR weight_grams > 0),
  length_cm numeric(6,2) CHECK (length_cm IS NULL OR length_cm > 0),
  width_cm numeric(6,2) CHECK (width_cm IS NULL OR width_cm > 0),
  height_cm numeric(6,2) CHECK (height_cm IS NULL OR height_cm > 0),
  hsn_code text DEFAULT '6204',
  gst_rate numeric(4,2) NOT NULL DEFAULT 5.00 CHECK (gst_rate >= 0 AND gst_rate <= 28),
  
  -- Boutique Specific Attributes
  blouse_included boolean DEFAULT false,
  saree_length_meters numeric(4,2),
  
  -- SEO
  seo_title text,
  seo_description text,
  seo_keywords text[] DEFAULT '{}'::text[],
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. Product Variants Table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL,
  color text NOT NULL,
  color_hex text CHECK (color_hex IS NULL OR color_hex ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'),
  sku text NOT NULL UNIQUE,
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  price_override numeric(12,2) CHECK (price_override IS NULL OR price_override >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_size_color UNIQUE (product_id, size, color)
);

-- Trigger for variant updated_at
CREATE TRIGGER set_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Automatic stock_status synchronization based on variant inventory
CREATE OR REPLACE FUNCTION public.handle_variant_stock_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_product_id uuid;
  total_stock integer;
  is_custom boolean;
BEGIN
  target_product_id := COALESCE(NEW.product_id, OLD.product_id);
  
  SELECT is_made_to_order INTO is_custom 
  FROM public.products 
  WHERE id = target_product_id;
  
  SELECT COALESCE(SUM(stock_quantity), 0) INTO total_stock
  FROM public.product_variants
  WHERE product_id = target_product_id AND is_active = true;

  UPDATE public.products
  SET stock_status = CASE
    WHEN is_custom = true THEN 'made_to_measure'::public.stock_status
    WHEN total_stock > 0 THEN 'in_stock'::public.stock_status
    ELSE 'out_of_stock'::public.stock_status
  END
  WHERE id = target_product_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_variant_stock_update
  AFTER INSERT OR UPDATE OF stock_quantity, is_active OR DELETE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_variant_stock_change();

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON public.products (is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON public.products (stock_status);
CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants (sku);
CREATE INDEX IF NOT EXISTS idx_variants_product_active ON public.product_variants (product_id, is_active);

-- 5. Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: Products
CREATE POLICY "Public can view active products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 7. RLS Policies: Product Variants
CREATE POLICY "Public can view active variants"
  ON public.product_variants
  FOR SELECT
  TO anon, authenticated
  USING (
    (is_active = true AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id AND p.is_active = true
    )) OR public.is_admin()
  );

CREATE POLICY "Admins can insert variants"
  ON public.product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update variants"
  ON public.product_variants
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete variants"
  ON public.product_variants
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
