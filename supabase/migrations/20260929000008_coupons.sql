-- 008: Discount Coupons & Promotions
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type public.discount_type NOT NULL,
  discount_value numeric(12,2) NOT NULL CHECK (discount_value > 0),
  min_order_value numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (min_order_value >= 0),
  max_discount_amount numeric(12,2) CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),
  usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
  usage_count integer NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL CHECK (valid_until > valid_from),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_percentage_value CHECK (
    discount_type <> 'percentage' OR (discount_value > 0 AND discount_value <= 100)
  )
);

-- Trigger for coupons updated_at
CREATE TRIGGER set_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Normalize coupon code to uppercase on insert/update
CREATE OR REPLACE FUNCTION public.handle_coupon_code_normalization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.code := upper(trim(NEW.code));
  RETURN NEW;
END;
$$;

CREATE TRIGGER normalize_coupon_code
  BEFORE INSERT OR UPDATE OF code ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_coupon_code_normalization();

-- 2. Indexes for Fast Code Lookup & Validity Checks
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_validity ON public.coupons (code, is_active, valid_from, valid_until);

-- 3. Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Public and authenticated shoppers can view active and valid coupons for checkout validation
CREATE POLICY "Public can view valid active coupons"
  ON public.coupons
  FOR SELECT
  TO anon, authenticated
  USING (
    (is_active = true AND now() >= valid_from AND now() <= valid_until)
    OR public.is_admin()
  );

-- Only admins can create, modify, or deactivate coupons
CREATE POLICY "Admins can insert coupons"
  ON public.coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update coupons"
  ON public.coupons
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete coupons"
  ON public.coupons
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
