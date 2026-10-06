-- 031: Performance Indexes & Consolidated Dashboard Aggregate RPC
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. High-Performance Composite Indexes for Orders & Fulfillment
CREATE INDEX IF NOT EXISTS idx_orders_dashboard_perf 
  ON public.orders (payment_status, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_action 
  ON public.orders (status, payment_status);

-- 2. Index on order_items to eliminate Full Table Scan during admin catalog checks
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
  ON public.order_items (product_id);

-- 3. Partial Index on Low Stock Product Variants for lightning-fast inventory alerts
CREATE INDEX IF NOT EXISTS idx_variants_low_stock 
  ON public.product_variants (stock_quantity) 
  WHERE is_active = true AND stock_quantity <= 5;

-- 4. Partial Index on Approved Product Reviews for PDP speed
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved 
  ON public.reviews (product_id, created_at DESC) 
  WHERE is_approved = true;

-- 5. Consolidated PostgreSQL Function: Computes all dashboard counts & metrics in 1 sub-10ms call
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics(p_role text DEFAULT 'staff')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending_count bigint := 0;
  v_confirmed_count bigint := 0;
  v_pending_paid_count bigint := 0;
  v_total_orders bigint := 0;
  v_low_stock_count bigint := 0;
  
  v_total_revenue numeric := 0;
  v_today_revenue numeric := 0;
  v_week_revenue numeric := 0;
  v_month_revenue numeric := 0;
  v_paid_orders_count bigint := 0;
  v_aov numeric := 0;
  
  v_trend jsonb := '[]'::jsonb;
  v_result jsonb;
BEGIN
  -- 1. Operational Counts
  SELECT 
    count(*) FILTER (WHERE status = 'pending'),
    count(*) FILTER (WHERE status = 'confirmed'),
    count(*) FILTER (WHERE status = 'pending' AND payment_status = 'paid'),
    count(*)
  INTO 
    v_pending_count,
    v_confirmed_count,
    v_pending_paid_count,
    v_total_orders
  FROM public.orders;

  SELECT count(*)
  INTO v_low_stock_count
  FROM public.product_variants
  WHERE is_active = true AND stock_quantity <= 5;

  -- 2. Owner Financial Metrics (Only computed if p_role = 'owner')
  IF p_role = 'owner' THEN
    SELECT 
      coalesce(sum(total_amount), 0),
      count(*),
      coalesce(sum(total_amount) FILTER (WHERE created_at >= date_trunc('day', now())), 0),
      coalesce(sum(total_amount) FILTER (WHERE created_at >= now() - interval '7 days'), 0),
      coalesce(sum(total_amount) FILTER (WHERE created_at >= now() - interval '30 days'), 0)
    INTO 
      v_total_revenue,
      v_paid_orders_count,
      v_today_revenue,
      v_week_revenue,
      v_month_revenue
    FROM public.orders
    WHERE payment_status = 'paid' AND status <> 'cancelled';

    IF v_paid_orders_count > 0 THEN
      v_aov := round(v_total_revenue / v_paid_orders_count, 2);
    END IF;

    -- 14-Day Sales Trend aggregation directly in Postgres
    WITH daily_buckets AS (
      SELECT 
        to_char(d, 'YYYY-MM-DD') AS bucket_date
      FROM generate_series(
        CURRENT_DATE - INTERVAL '13 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      ) AS d
    ),
    order_sums AS (
      SELECT 
        to_char(created_at, 'YYYY-MM-DD') AS order_date,
        coalesce(sum(total_amount), 0) AS daily_rev,
        count(*) AS daily_orders
      FROM public.orders
      WHERE payment_status = 'paid' 
        AND status <> 'cancelled'
        AND created_at >= CURRENT_DATE - INTERVAL '13 days'
      GROUP BY to_char(created_at, 'YYYY-MM-DD')
    )
    SELECT coalesce(jsonb_agg(
      jsonb_build_object(
        'date', b.bucket_date,
        'revenue', coalesce(s.daily_rev, 0),
        'orders', coalesce(s.daily_orders, 0)
      )
      ORDER BY b.bucket_date ASC
    ), '[]'::jsonb)
    INTO v_trend
    FROM daily_buckets b
    LEFT JOIN order_sums s ON b.bucket_date = s.order_date;
  END IF;

  -- 3. Package and return full metrics object
  v_result := jsonb_build_object(
    'operational', jsonb_build_object(
      'pendingOrdersCount', v_pending_count,
      'ordersNeedingActionCount', v_confirmed_count + v_pending_paid_count,
      'lowStockCount', v_low_stock_count,
      'totalOrdersCount', v_total_orders
    ),
    'financial', CASE 
      WHEN p_role = 'owner' THEN jsonb_build_object(
        'totalRevenue', v_total_revenue,
        'revenueToday', v_today_revenue,
        'revenueThisWeek', v_week_revenue,
        'revenueThisMonth', v_month_revenue,
        'aov', v_aov,
        'salesTrend14Days', v_trend
      )
      ELSE NULL
    END
  );

  RETURN v_result;
END;
$$;
