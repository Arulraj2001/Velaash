-- Velaash E-Commerce Platform (VELAASH TRADER'S)
-- Migration: 20260930000016_shiprocket_order_columns
-- Purpose: Adds first-class columns for Shiprocket logistics data on orders.
--
--   shiprocket_order_id   – Shiprocket's own order identifier (for cancellations/amendments)
--   shiprocket_shipment_id – Internal shipment ID returned at order creation
--   tracking_number       – AWB code (was already added in 000001 but never written by code)
--   courier_name          – Partner name (was already added in 000001 but never written)
--
-- All four columns already existed via migration 000001 for tracking_number/courier_name.
-- We only add the two new Shiprocket-specific ID columns here.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shiprocket_order_id   text,
  ADD COLUMN IF NOT EXISTS shiprocket_shipment_id text;

-- Optional: GIN-style index not needed on text IDs; a btree is sufficient
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id
  ON public.orders (shiprocket_order_id)
  WHERE shiprocket_order_id IS NOT NULL;

COMMENT ON COLUMN public.orders.shiprocket_order_id IS
  'Shiprocket order ID returned when an order is pushed for fulfillment. Used for amendments/cancellations via Shiprocket API.';

COMMENT ON COLUMN public.orders.shiprocket_shipment_id IS
  'Shiprocket shipment ID returned at order creation. Required for AWB generation if not auto-assigned.';

COMMENT ON COLUMN public.orders.tracking_number IS
  'AWB / tracking number. Written by both the manual Mark-as-Shipped flow and the Push-to-Shiprocket action.';

COMMENT ON COLUMN public.orders.courier_name IS
  'Courier / delivery partner name. Written by both the manual and Shiprocket fulfillment flows.';
