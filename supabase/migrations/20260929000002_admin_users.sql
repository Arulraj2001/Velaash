-- 002: Admin Users & Authorization Infrastructure
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.admin_role NOT NULL DEFAULT 'staff',
  full_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER set_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. Security Definer Helper Functions for RLS
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

-- 3. Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Admins can view all admin users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (public.is_admin() OR auth.uid() = id);

CREATE POLICY "Owners can insert admin users"
  ON public.admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_owner());

CREATE POLICY "Owners can update admin users"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_owner())
  WITH CHECK (public.is_admin_owner());

CREATE POLICY "Owners can delete admin users"
  ON public.admin_users
  FOR DELETE
  TO authenticated
  USING (public.is_admin_owner());
