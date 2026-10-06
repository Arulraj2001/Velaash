-- 032: Missing Performance Indexes
-- Velaash E-Commerce Platform (VELAASH TRADER'S)
-- Addresses query patterns identified in the performance audit

-- 1. Admin products list sorted by updated_at DESC — previously required a full seq scan
CREATE INDEX IF NOT EXISTS idx_products_updated_at
  ON public.products (updated_at DESC);

-- 2. Order search by exact order_number (used in admin orders search)
CREATE INDEX IF NOT EXISTS idx_orders_order_number
  ON public.orders (order_number);

-- 3. Coupon code filter — sparse partial index (most rows have NULL)
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code
  ON public.orders (coupon_code)
  WHERE coupon_code IS NOT NULL;

-- 4. Trigram index on order_number for fast ILIKE search in admin orders
--    Requires pg_trgm extension (available by default on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_orders_order_number_trgm
  ON public.orders USING GIN (order_number gin_trgm_ops);

-- 5. Admin products filtered by is_active + updated_at (most common admin list query)
CREATE INDEX IF NOT EXISTS idx_products_active_updated
  ON public.products (is_active, updated_at DESC);

-- 6. Category_id + is_active compound index for admin product filtering by category
CREATE INDEX IF NOT EXISTS idx_products_category_active
  ON public.products (category_id, is_active, updated_at DESC);

-- 7. Product variants lookup by product_id + is_active — critical for join on product list
CREATE INDEX IF NOT EXISTS idx_variants_product_active_stock
  ON public.product_variants (product_id, is_active, stock_quantity);

-- 8. Product images lookup by product_id — speeds up the joined image fetch on product list
CREATE INDEX IF NOT EXISTS idx_product_images_product
  ON public.product_images (product_id, display_order, is_primary);

-- 9. Orders list: payment_status + status + created_at (common admin orders filter)
--    Extends the existing idx_orders_dashboard_perf for broader filter coverage
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created
  ON public.orders (payment_status, created_at DESC)
  WHERE status <> 'cancelled';
