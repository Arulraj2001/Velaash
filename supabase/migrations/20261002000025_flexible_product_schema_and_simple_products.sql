-- 025: Flexible Product Schema and Simple Products (Non-clothing / Pooja / Brass / Un-sized products)
-- Velaash E-Commerce Platform (VELAASH TRADER'S)
-- Enables products without variants (simple products) and arbitrary specifications

-- 1. Add flexible product attributes to products table
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS has_variants boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  ADD COLUMN IF NOT EXISTS specifications jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Mark existing products with variants as has_variants = true
UPDATE public.products p
SET has_variants = true
WHERE EXISTS (
  SELECT 1 FROM public.product_variants pv WHERE pv.product_id = p.id
);

-- 3. Update stock_status sync trigger to support simple products
CREATE OR REPLACE FUNCTION public.handle_variant_stock_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_product_id uuid;
  target_has_variants boolean;
  total_stock integer;
  is_custom boolean;
  simple_stock integer;
BEGIN
  target_product_id := COALESCE(NEW.product_id, OLD.product_id);
  
  SELECT is_made_to_order, has_variants, stock_quantity 
  INTO is_custom, target_has_variants, simple_stock
  FROM public.products 
  WHERE id = target_product_id;
  
  IF target_has_variants = false THEN
    UPDATE public.products
    SET stock_status = CASE
      WHEN is_custom = true THEN 'made_to_measure'::public.stock_status
      WHEN simple_stock > 0 THEN 'in_stock'::public.stock_status
      ELSE 'out_of_stock'::public.stock_status
    END
    WHERE id = target_product_id;
  ELSE
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
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Update create_checkout_order_atomic to support simple products (variant_id IS NULL)
CREATE OR REPLACE FUNCTION public.create_checkout_order_atomic(
  p_idempotency_key text,
  p_customer_id uuid,
  p_payment_method public.payment_method,
  p_subtotal numeric,
  p_shipping_charge numeric,
  p_discount_amount numeric,
  p_total_amount numeric,
  p_shipping_address jsonb,
  p_coupon_code text,
  p_notes text,
  p_items jsonb
)
RETURNS TABLE(order_id uuid, order_number text, is_duplicate boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_coupon public.coupons%ROWTYPE;
  v_coupon_found boolean;
  v_expected_discount numeric;
  v_reservation record;
  v_product_reservation record;
BEGIN
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) = 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: idempotency key is required' USING ERRCODE = 'P0001';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: at least one order item is required' USING ERRCODE = 'P0001';
  END IF;

  SELECT o.id, o.order_number
  INTO v_order_id, v_order_number
  FROM public.orders AS o
  WHERE o.idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN QUERY SELECT v_order_id, v_order_number, true;
    RETURN;
  END IF;

  IF p_coupon_code IS NOT NULL THEN
    SELECT c.*
    INTO v_coupon
    FROM public.coupons AS c
    WHERE c.code = upper(btrim(p_coupon_code))
    FOR UPDATE;
    v_coupon_found := FOUND;

    SELECT o.id, o.order_number
    INTO v_order_id, v_order_number
    FROM public.orders AS o
    WHERE o.idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN QUERY SELECT v_order_id, v_order_number, true;
      RETURN;
    END IF;

    IF NOT v_coupon_found
      OR NOT v_coupon.is_active
      OR now() < v_coupon.valid_from
      OR now() > v_coupon.valid_until
      OR (v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit)
      OR p_subtotal < v_coupon.min_order_value
    THEN
      RAISE EXCEPTION 'COUPON_INVALID: coupon is no longer valid' USING ERRCODE = 'P0001';
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
      v_expected_discount := p_subtotal * v_coupon.discount_value / 100;
      IF v_coupon.max_discount_amount IS NOT NULL THEN
        v_expected_discount := least(v_expected_discount, v_coupon.max_discount_amount);
      END IF;
    ELSE
      v_expected_discount := least(v_coupon.discount_value, p_subtotal);
    END IF;
    v_expected_discount := round(v_expected_discount);

    IF v_expected_discount <> p_discount_amount THEN
      RAISE EXCEPTION 'COUPON_INVALID: coupon discount changed; please retry checkout' USING ERRCODE = 'P0001';
    END IF;
  ELSIF p_discount_amount <> 0 THEN
    RAISE EXCEPTION 'COUPON_INVALID: discount requires a valid coupon' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.orders AS inserted_order (
    idempotency_key,
    customer_id,
    status,
    payment_method,
    payment_status,
    subtotal,
    shipping_charge,
    discount_amount,
    total_amount,
    shipping_address,
    billing_address,
    coupon_code,
    notes
  )
  VALUES (
    p_idempotency_key,
    p_customer_id,
    'pending',
    p_payment_method,
    'pending',
    p_subtotal,
    p_shipping_charge,
    p_discount_amount,
    p_total_amount,
    p_shipping_address,
    p_shipping_address,
    CASE WHEN p_coupon_code IS NULL THEN NULL ELSE upper(btrim(p_coupon_code)) END,
    p_notes
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING inserted_order.id, inserted_order.order_number
  INTO v_order_id, v_order_number;

  IF v_order_id IS NULL THEN
    SELECT o.id, o.order_number
    INTO v_order_id, v_order_number
    FROM public.orders AS o
    WHERE o.idempotency_key = p_idempotency_key;

    RETURN QUERY SELECT v_order_id, v_order_number, true;
    RETURN;
  END IF;

  -- 4a. Reserve variant-based items (where variant_id IS NOT NULL)
  FOR v_reservation IN
    SELECT requested.variant_id, sum(requested.quantity)::integer AS quantity
    FROM jsonb_to_recordset(p_items) AS requested(variant_id uuid, quantity integer)
    WHERE requested.variant_id IS NOT NULL
    GROUP BY requested.variant_id
    ORDER BY requested.variant_id
  LOOP
    UPDATE public.product_variants AS variant
    SET stock_quantity = variant.stock_quantity - v_reservation.quantity
    FROM public.products AS product
    WHERE variant.id = v_reservation.variant_id
      AND product.id = variant.product_id
      AND variant.is_active
      AND product.is_active
      AND variant.stock_quantity >= v_reservation.quantity;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'OUT_OF_STOCK: requested variant is unavailable' USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  -- 4b. Reserve simple product items (where variant_id IS NULL)
  FOR v_product_reservation IN
    SELECT requested.product_id, sum(requested.quantity)::integer AS quantity
    FROM jsonb_to_recordset(p_items) AS requested(product_id uuid, variant_id uuid, quantity integer)
    WHERE requested.variant_id IS NULL
    GROUP BY requested.product_id
    ORDER BY requested.product_id
  LOOP
    UPDATE public.products AS product
    SET stock_quantity = product.stock_quantity - v_product_reservation.quantity,
        stock_status = CASE 
          WHEN (product.stock_quantity - v_product_reservation.quantity) > 0 THEN 'in_stock'::public.stock_status 
          ELSE 'out_of_stock'::public.stock_status 
        END,
        updated_at = now()
    WHERE product.id = v_product_reservation.product_id
      AND product.is_active
      AND product.stock_quantity >= v_product_reservation.quantity;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'OUT_OF_STOCK: requested product is unavailable' USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  IF (
    SELECT coalesce(sum(item.line_subtotal), 0)
    FROM jsonb_to_recordset(p_items) AS item(line_subtotal numeric)
  ) <> p_subtotal THEN
    RAISE EXCEPTION 'INVALID_INPUT: item totals do not match subtotal' USING ERRCODE = 'P0001';
  END IF;

  -- 4c. Insert order items with safe variant details snapshot
  INSERT INTO public.order_items (
    order_id,
    product_id,
    variant_id,
    product_name_snapshot,
    variant_details_snapshot,
    unit_price,
    quantity,
    subtotal
  )
  SELECT
    v_order_id,
    item.product_id,
    item.variant_id,
    item.title,
    CASE 
      WHEN item.variant_id IS NOT NULL THEN jsonb_build_object('size', coalesce(item.size, ''), 'color', coalesce(item.color, ''))
      ELSE '{}'::jsonb
    END,
    item.unit_price,
    item.quantity,
    item.line_subtotal
  FROM jsonb_to_recordset(p_items) AS item(
    product_id uuid,
    variant_id uuid,
    title text,
    size text,
    color text,
    unit_price numeric,
    quantity integer,
    line_subtotal numeric
  );

  IF p_coupon_code IS NOT NULL THEN
    UPDATE public.coupons
    SET usage_count = usage_count + 1,
        updated_at = now()
    WHERE id = v_coupon.id;
  END IF;

  RETURN QUERY SELECT v_order_id, v_order_number, false;
END;
$$;

-- 5. Update cancel_order_atomic to restore stock for simple products
CREATE OR REPLACE FUNCTION public.cancel_order_atomic(
  p_order_number text,
  p_user_id uuid,
  p_user_email text,
  p_reason text,
  p_is_admin boolean
)
RETURNS TABLE(cancelled boolean, error_message text, order_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item record;
  v_product_item record;
  v_cancel_note text;
BEGIN
  SELECT o.*
  INTO v_order
  FROM public.orders AS o
  WHERE o.order_number = p_order_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Order not found.'::text, NULL::uuid;
    RETURN;
  END IF;

  IF NOT p_is_admin AND NOT (
    v_order.customer_id = p_user_id
    OR (
      p_user_email IS NOT NULL
      AND lower(v_order.shipping_address->>'email') = lower(p_user_email)
    )
  ) THEN
    RETURN QUERY SELECT false, 'Order not found.'::text, NULL::uuid;
    RETURN;
  END IF;

  IF v_order.status NOT IN ('pending', 'confirmed', 'packed') THEN
    RETURN QUERY SELECT
      false,
      CASE
        WHEN v_order.status IN ('shipped', 'out_for_delivery', 'delivered')
          THEN 'This order has already been dispatched or delivered and cannot be cancelled online.'
        WHEN v_order.status IN ('cancelled', 'refunded')
          THEN 'This order is already cancelled or refunded.'
        ELSE format('Order in %s status cannot be cancelled.', v_order.status)
      END,
      NULL::uuid;
    RETURN;
  END IF;

  v_cancel_note := CASE
    WHEN nullif(btrim(p_reason), '') IS NOT NULL AND p_is_admin
      THEN 'Cancelled by admin: ' || btrim(p_reason)
    WHEN nullif(btrim(p_reason), '') IS NOT NULL
      THEN 'Cancelled by customer: ' || btrim(p_reason)
    WHEN p_is_admin
      THEN 'Cancelled by admin'
    ELSE 'Cancelled by customer via Account Dashboard'
  END;

  -- Restore variant stock
  FOR v_item IN
    SELECT oi.variant_id, sum(oi.quantity)::integer AS quantity
    FROM public.order_items AS oi
    WHERE oi.order_id = v_order.id
      AND oi.variant_id IS NOT NULL
    GROUP BY oi.variant_id
    ORDER BY oi.variant_id
  LOOP
    UPDATE public.product_variants AS variant
    SET stock_quantity = variant.stock_quantity + v_item.quantity
    WHERE variant.id = v_item.variant_id;
  END LOOP;

  -- Restore simple product stock
  FOR v_product_item IN
    SELECT oi.product_id, sum(oi.quantity)::integer AS quantity
    FROM public.order_items AS oi
    WHERE oi.order_id = v_order.id
      AND oi.variant_id IS NULL
      AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id
    ORDER BY oi.product_id
  LOOP
    UPDATE public.products AS product
    SET stock_quantity = product.stock_quantity + v_product_item.quantity,
        stock_status = 'in_stock'::public.stock_status,
        updated_at = now()
    WHERE product.id = v_product_item.product_id;
  END LOOP;

  UPDATE public.orders
  SET status = 'cancelled',
      cancel_reason = v_cancel_note,
      updated_at = now()
  WHERE id = v_order.id;

  INSERT INTO public.order_status_history (order_id, status, note, created_by)
  VALUES (v_order.id, 'cancelled', v_cancel_note, p_user_id);

  RETURN QUERY SELECT true, NULL::text, v_order.id;
END;
$$;
