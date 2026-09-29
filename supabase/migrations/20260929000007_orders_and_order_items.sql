-- 007: Orders, Order Items, and Order Status History Audit Trail
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT public.generate_order_number(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_method public.payment_method NOT NULL DEFAULT 'razorpay',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  shipping_charge numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (shipping_charge >= 0),
  discount_amount numeric(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  total_amount numeric(12,2) NOT NULL CHECK (total_amount >= 0),
  
  -- Frozen address snapshot so historical orders remain immutable
  shipping_address jsonb NOT NULL,
  billing_address jsonb,
  
  -- Payment Gateway & Marketing
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  coupon_code text,
  notes text,
  cancel_reason text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for orders updated_at
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name_snapshot text NOT NULL,
  variant_details_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity >= 1),
  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Order Status History (Audit Trail for State Machine)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger to record every order status change in history
CREATE OR REPLACE FUNCTION public.handle_order_status_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.order_status_history (order_id, status, note, created_by)
    VALUES (
      NEW.id,
      NEW.status,
      CASE
        WHEN TG_OP = 'INSERT' THEN 'Order registered with initial status: ' || NEW.status::text
        ELSE 'Order status updated from ' || OLD.status::text || ' to ' || NEW.status::text
      END,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_status_changed
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_status_audit();

-- 4. Indexes for Fast Order Lookups & State Queries
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history (order_id);

-- 5. Enable RLS on Orders & Items
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: Orders
-- Customers can view only their own orders
CREATE POLICY "Customers can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR public.is_admin());

-- Only admins can update orders (e.g. status, notes, tracking)
-- Client users cannot directly update price or status
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Direct client INSERT is restricted: creation must run via trusted server-side logic (service_role)
CREATE POLICY "Admins can insert orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 7. RLS Policies: Order Items
-- Customers can view items in their own orders
CREATE POLICY "Customers can view own order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.customer_id = auth.uid() OR public.is_admin())
    )
  );

-- Direct client INSERT/UPDATE on items is disallowed to protect unit_price and subtotal
CREATE POLICY "Admins can manage order items"
  ON public.order_items
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. RLS Policies: Order Status History
-- Customers can view audit history of their own orders
CREATE POLICY "Customers can view own order status history"
  ON public.order_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND (o.customer_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Admins can manage order status history"
  ON public.order_status_history
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
