-- ==============================================================================
-- 012: Razorpay Online Order Cleanup & Inventory Restoration
-- Velaash E-Commerce Platform (VELAASH TRADER'S)
-- ==============================================================================

/**
 * Automatically cancels online-payment (Razorpay) orders that have remained
 * in 'pending' status for more than 30 minutes, releasing their soft-reserved
 * inventory back to product_variants.
 *
 * NOTE: Cash on Delivery (COD) orders are STRICTLY EXCLUDED from this cleanup,
 * as COD orders remain 'pending' until physically delivered by the logistics courier.
 */
CREATE OR REPLACE FUNCTION public.cancel_expired_pending_online_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_count integer := 0;
  v_order record;
  v_item record;
BEGIN
  -- 1. Find all online-payment orders stuck in pending status > 30 minutes
  FOR v_order IN
    SELECT id, order_number
    FROM public.orders
    WHERE payment_method = 'razorpay'
      AND payment_status = 'pending'
      AND status = 'pending'
      AND created_at < (now() - interval '30 minutes')
    FOR UPDATE SKIP LOCKED
  LOOP
    -- 2. Restore inventory for each item in the expired order
    FOR v_item IN
      SELECT variant_id, quantity
      FROM public.order_items
      WHERE order_id = v_order.id AND variant_id IS NOT NULL
    LOOP
      UPDATE public.product_variants
      SET stock_quantity = stock_quantity + v_item.quantity
      WHERE id = v_item.variant_id;
    END LOOP;

    -- 3. Transition order status to cancelled
    UPDATE public.orders
    SET status = 'cancelled',
        cancel_reason = 'Payment window expired (30 minutes without payment confirmation)',
        updated_at = now()
    WHERE id = v_order.id;

    -- 4. Record audit trail in order_status_history
    INSERT INTO public.order_status_history (order_id, status, note)
    VALUES (
      v_order.id,
      'cancelled',
      'Order automatically cancelled: 30-minute online payment window expired. Reserved stock released back to catalog.'
    );

    v_expired_count := v_expired_count + 1;
  END LOOP;

  RETURN v_expired_count;
END;
$$;

-- Schedule automatic execution every 15 minutes via pg_cron (if pg_cron extension is enabled):
-- SELECT cron.schedule(
--   'cancel-expired-online-orders-every-15m',
--   '*/15 * * * *',
--   'SELECT public.cancel_expired_pending_online_orders();'
-- );
