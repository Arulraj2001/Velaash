-- 035: Order Refunds and Razorpay Refund Tracking
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Add refund tracking columns to public.orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_refund_id text,
  ADD COLUMN IF NOT EXISTS refund_status text DEFAULT 'not_applicable',
  ADD COLUMN IF NOT EXISTS refund_amount numeric(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS refund_arn text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

-- 2. Index for filtering orders by refund status in admin
CREATE INDEX IF NOT EXISTS idx_orders_refund_status
  ON public.orders (refund_status)
  WHERE refund_status IS NOT NULL AND refund_status <> 'not_applicable';

-- 3. Document refund_status states:
-- 'not_applicable': for COD / unpaid orders
-- 'initiated': refund requested via Razorpay API, awaiting bank settlement
-- 'processed': refund successfully credited to customer bank account
-- 'failed': refund attempt failed at gateway or requires manual owner review
COMMENT ON COLUMN public.orders.refund_status IS 'Lifecycle state of order refund: not_applicable, initiated, processed, failed';
