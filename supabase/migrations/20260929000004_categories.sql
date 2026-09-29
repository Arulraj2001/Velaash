-- 004: Product Categories Hierarchy
-- Velaash E-Commerce Platform (VELAASH TRADER'S)

-- 1. Categories Table with Self-referencing Parent ID
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_category_parent_not_self CHECK (parent_id IS NULL OR parent_id <> id)
);

-- Trigger for updated_at
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. Indexes for Fast Hierarchy & Slug Lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON public.categories (is_active, display_order);

-- 3. Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Public and anonymous visitors can view only active categories
CREATE POLICY "Public can view active categories"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.is_admin());

-- Only admins can insert, update, or delete categories
CREATE POLICY "Admins can insert categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
