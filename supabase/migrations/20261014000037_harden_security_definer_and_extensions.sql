-- 037: Harden Security Definer Functions & Relocate Extensions
-- Fixes Supabase Security Advisor Warnings:
-- 1. extension_in_public (pg_trgm)
-- 2. anon_security_definer_function_executable
-- 3. authenticated_security_definer_function_executable

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Move pg_trgm extension out of public schema to extensions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
  ) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Switch non-privileged trigger & helper functions to SECURITY INVOKER
-- ─────────────────────────────────────────────────────────────────────────────

-- Updated_at trigger does not need elevated permissions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Coupon normalization only transforms text, needs no elevated permissions
CREATE OR REPLACE FUNCTION public.handle_coupon_code_normalization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.code := upper(trim(NEW.code));
  RETURN NEW;
END;
$$;

-- is_admin / is_admin_owner RLS helpers
-- MUST remain SECURITY DEFINER to avoid infinite recursion when evaluated inside admin_users RLS policy
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid() AND role = 'owner'
  );
$$;

-- is_admin and is_admin_owner must be executable by anon so that RLS policies
-- on public tables (categories, products, homepage_sections) can evaluate
-- 'is_active = true OR public.is_admin()' without throwing 42501 permission denied.
-- When called by anon, auth.uid() is null so it safely returns false.
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_owner() TO anon, authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Revoke public/anon/authenticated execution on internal database procedures
-- ─────────────────────────────────────────────────────────────────────────────

-- Order number generator sequence helper (only internal & service_role)
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO service_role;

-- Admin dashboard metrics RPC (only service_role)
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_metrics(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics(text) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Revoke direct RPC execution from anon on trigger functions
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.handle_new_customer() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_customer() TO postgres, supabase_auth_admin, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_default_address() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_delete_default_address() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_primary_product_image() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_variant_stock_change() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_order_status_audit() FROM PUBLIC, anon;


