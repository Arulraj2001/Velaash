import { z } from "zod";

/**
 * Size Chart Table Data structure stored as JSONB in `size_charts.chart_data`.
 */
export interface AdminCategorySizeChartData {
  id?: string;
  name: string;
  measurement_unit: "inches" | "cm";
  headers: string[];
  rows: Record<string, string>[];
  tips?: string[];
}

/**
 * Category item represented in the admin management dashboard.
 */
export interface AdminCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  parent_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  product_count: number;
  subcategories?: AdminCategoryItem[];
  size_chart?: AdminCategorySizeChartData | null;
}

/**
 * Zod validation schema for Size Chart within category form.
 */
export const AdminCategorySizeChartSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Size chart name is required").max(100),
  measurement_unit: z.enum(["inches", "cm"]).default("inches"),
  headers: z.array(z.string().trim().min(1)).min(1, "At least one column header is required"),
  rows: z
    .array(z.record(z.string(), z.string()))
    .min(1, "At least one measurement row is required"),
  tips: z.array(z.string().trim()).optional(),
});

/**
 * Zod validation schema for creating/updating categories.
 */
export const AdminCategoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(120, "Slug cannot exceed 120 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  parent_id: z.string().uuid().optional().nullable(),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().nullable(),
  image_url: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  display_order: z.number().int().min(0, "Display order must be a non-negative number").default(0),
  is_active: z.boolean().default(true),
  seo_title: z.string().trim().max(70, "SEO title should not exceed 70 characters").optional().nullable(),
  seo_description: z.string().trim().max(170, "SEO description should not exceed 170 characters").optional().nullable(),
  size_chart: AdminCategorySizeChartSchema.optional().nullable(),
});

export type AdminCategoryFormData = z.infer<typeof AdminCategoryFormSchema>;
