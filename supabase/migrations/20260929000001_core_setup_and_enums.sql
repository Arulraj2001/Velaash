-- 001: Core Setup, Extensions, Trigger Functions, and Enums
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Enable Necessary Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Domain Custom Types & Enums
DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'refunded',
    'payment_failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM (
    'razorpay',
    'cod'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.discount_type AS ENUM (
    'percentage',
    'flat'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.stock_status AS ENUM (
    'in_stock',
    'out_of_stock',
    'backorder',
    'made_to_measure'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.address_type AS ENUM (
    'home',
    'work',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.admin_role AS ENUM (
    'owner',
    'staff'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.homepage_section_type AS ENUM (
    'hero_banner',
    'featured_products',
    'category_grid',
    'testimonials',
    'couture_spotlight',
    'value_strip',
    'custom_html'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Order Number Generation Sequence & Helper
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year text;
  seq_val bigint;
BEGIN
  current_year := to_char(now(), 'YYYY');
  seq_val := nextval('public.order_number_seq');
  RETURN 'VEL-' || current_year || '-' || lpad(seq_val::text, 5, '0');
END;
$$;
