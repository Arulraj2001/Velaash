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

  IF v_order.payment_status IN ('paid', 'refunded') THEN
    RETURN QUERY SELECT
      false,
      'Paid orders require refund processing before cancellation. Please contact support.'::text,
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

REVOKE ALL ON FUNCTION public.cancel_order_atomic(text, uuid, text, text, boolean)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_atomic(text, uuid, text, text, boolean)
TO service_role;