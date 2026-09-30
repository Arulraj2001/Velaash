-- 014: Order Tracking and Admin Notes
-- Velaash E-Commerce Platform (VELAASH TRADER'S)
-- Supports Phase 5B Admin Order Management: courier name, tracking number, and private admin notes.

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS courier_name text,
ADD COLUMN IF NOT EXISTS admin_notes text;

CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders (tracking_number);
