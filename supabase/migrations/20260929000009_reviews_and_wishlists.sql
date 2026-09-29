-- 009: Product Reviews Moderation & Customer Wishlists
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text NOT NULL,
  is_verified_purchase boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for reviews updated_at
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. Customer Wishlists Table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_wishlist_customer_product UNIQUE (customer_id, product_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON public.reviews (product_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON public.reviews (customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_customer ON public.wishlists (customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON public.wishlists (product_id);

-- 4. Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Reviews
-- Public can read approved reviews, customers can also view their own submitted reviews
CREATE POLICY "Public can view approved reviews"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (is_approved = true OR customer_id = auth.uid() OR public.is_admin());

-- Customers can submit reviews (moderation flag is_approved defaults to false)
CREATE POLICY "Customers can insert reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid() AND
    (is_approved = false OR public.is_admin())
  );

-- Customers can update their own reviews
CREATE POLICY "Customers can update own reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid() OR public.is_admin())
  WITH CHECK (
    (customer_id = auth.uid() AND is_approved = false) OR public.is_admin()
  );

-- Customers can delete their own reviews
CREATE POLICY "Customers can delete own reviews"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid() OR public.is_admin());

-- Admins can moderate/approve/manage all reviews
CREATE POLICY "Admins can manage all reviews"
  ON public.reviews
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. RLS Policies: Wishlists
CREATE POLICY "Customers can view own wishlist"
  ON public.wishlists
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Customers can insert into own wishlist"
  ON public.wishlists
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can remove from own wishlist"
  ON public.wishlists
  FOR DELETE
  TO authenticated
  USING (customer_id = auth.uid());
