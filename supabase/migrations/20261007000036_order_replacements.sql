-- 036: Order Replacements and WhatsApp Unboxing Video Verification
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Create order_replacements table
CREATE TABLE IF NOT EXISTS public.order_replacements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  item_title text NOT NULL,
  current_size text,
  current_color text,
  desired_size text,
  desired_color text,
  reason text NOT NULL,
  customer_phone text NOT NULL,
  customer_notes text,
  status text NOT NULL DEFAULT 'pending_video_review' CHECK (
    status IN (
      'pending_video_review',
      'video_verified',
      'approved',
      'store_credit_issued',
      'refund_approved',
      'rejected',
      'completed'
    )
  ),
  video_reviewed boolean NOT NULL DEFAULT false,
  video_reviewed_at timestamptz,
  rejection_reason text,
  store_credit_code text,
  store_credit_amount numeric(12,2),
  replacement_courier text,
  replacement_tracking_number text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Trigger for updated_at
DROP TRIGGER IF EXISTS set_order_replacements_updated_at ON public.order_replacements;
CREATE TRIGGER set_order_replacements_updated_at
  BEFORE UPDATE ON public.order_replacements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_order_replacements_order_id ON public.order_replacements(order_id);
CREATE INDEX IF NOT EXISTS idx_order_replacements_order_number ON public.order_replacements(order_number);
CREATE INDEX IF NOT EXISTS idx_order_replacements_status ON public.order_replacements(status);
CREATE INDEX IF NOT EXISTS idx_order_replacements_customer_id ON public.order_replacements(customer_id);

-- 4. Enable Row Level Security
ALTER TABLE public.order_replacements ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Admins full access on order_replacements" ON public.order_replacements;
CREATE POLICY "Admins full access on order_replacements"
  ON public.order_replacements
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Customers view own order_replacements" ON public.order_replacements;
CREATE POLICY "Customers view own order_replacements"
  ON public.order_replacements
  FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
  );

DROP POLICY IF EXISTS "Customers insert own order_replacements" ON public.order_replacements;
CREATE POLICY "Customers insert own order_replacements"
  ON public.order_replacements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id = auth.uid() OR
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
  );

COMMENT ON TABLE public.order_replacements IS 'Tracks customer doorstep replacement & exchange requests and owner WhatsApp unboxing video verification lifecycle.';
