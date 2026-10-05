import { z } from "zod";
import type { StockStatus } from "@/types/database.types";

/**
 * Product item for the admin data table
 */
export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  category_name: string;
  base_price: number;
  compare_at_price: number | null;
  total_stock: number;
  is_active: boolean;
  is_featured: boolean;
  stock_status: StockStatus;
  thumbnail_url: string | null;
  variants_count: number;
  skus: string[];
  variants: {
    id: string;
    size: string;
    color: string;
    sku: string;
    stock_quantity: number;
    price_override?: number | null;
    is_active?: boolean;
  }[];
  has_variants?: boolean;
  stock_quantity?: number;
  specifications?: { label: string; value: string }[];
  updated_at: string;
  created_at: string;
  has_orders: boolean;
}

/**
 * Product Image item in the admin form
 */
export interface AdminProductImageFormItem {
  id?: string;
  image_url: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
  variant_id?: string | null;
  file?: File;
}

/**
 * Product Variant item in the admin form
 */
export interface AdminProductVariantFormItem {
  id?: string;
  size: string;
  color: string;
  color_hex?: string | null;
  sku: string;
  stock_quantity: number;
  price_override?: number | null;
  is_active: boolean;
}

/**
 * Detailed product structure for editing
 */
export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  base_price: number;
  compare_at_price: number | null;
  fabric: string | null;
  care_instructions: string | null;
  craftsmanship: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_made_to_order: boolean;
  stock_status: StockStatus;
  weight_grams: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  hsn_code: string | null;
  gst_rate: number;
  blouse_included: boolean | null;
  saree_length_meters: number | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  has_variants?: boolean;
  stock_quantity?: number;
  specifications?: { label: string; value: string }[];
  images: AdminProductImageFormItem[];
  variants: AdminProductVariantFormItem[];
  size_chart_id?: string | null;
  free_shipping_active?: boolean;
  free_shipping_start?: string | null;
  free_shipping_end?: string | null;
  free_shipping_badge_text?: string | null;
  created_at: string;
  updated_at: string;
  has_orders?: boolean;
}

/**
 * Single specification row (label + value pair)
 */
export const SpecificationItemSchema = z.object({
  label: z.string().trim().min(1, "Label is required"),
  value: z.string().trim().min(1, "Value is required"),
});

export type SpecificationItem = z.infer<typeof SpecificationItemSchema>;

/**
 * Zod validation schema for image items
 */
export const ProductImageSchema = z.object({
  id: z.string().optional(),
  image_url: z.string().url("Valid image URL is required"),
  alt_text: z.string().trim().min(2, "Alt text is required for accessibility and SEO"),
  is_primary: z.boolean().default(false),
  display_order: z.number().int().default(0),
  variant_id: z.string().optional().nullable(),
});

/**
 * Zod validation schema for variant items
 */
export const ProductVariantFormSchema = z.object({
  id: z.string().optional(),
  size: z.string().trim().min(1, "Size is required"),
  color: z.string().trim().min(1, "Color is required"),
  color_hex: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Invalid hex color format (e.g. #FFFFFF)")
    .optional()
    .nullable()
    .or(z.literal("")),
  sku: z.string().trim().min(2, "SKU must be at least 2 characters"),
  stock_quantity: z.coerce.number().int().min(0, "Stock cannot be negative"),
  price_override: z.coerce.number().positive("Price override must be positive").optional().nullable(),
  is_active: z.boolean().default(true),
});

/**
 * Full Product Form Zod Schema
 */
export const AdminProductFormSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  category_id: z.string().uuid("Please select a valid category"),
  description: z.string().trim().optional().nullable(),
  base_price: z.coerce.number().positive("Base price must be a positive number"),
  compare_at_price: z.coerce
    .number()
    .positive("Compare-at price must be a positive number")
    .optional()
    .nullable()
    .or(z.literal(0).transform(() => null)),
  fabric: z.string().trim().optional().nullable(),
  care_instructions: z.string().trim().optional().nullable(),
  craftsmanship: z.string().trim().optional().nullable(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_made_to_order: z.boolean().default(false),

  // Indian Logistics & Taxation (Shiprocket & GST compliance)
  weight_grams: z.coerce.number().int().positive("Weight must be positive").optional().nullable(),
  length_cm: z.coerce.number().positive("Length must be positive").optional().nullable(),
  width_cm: z.coerce.number().positive("Width must be positive").optional().nullable(),
  height_cm: z.coerce.number().positive("Height must be positive").optional().nullable(),
  hsn_code: z.string().trim().default("6204").optional().nullable(),
  gst_rate: z.coerce.number().min(0, "GST rate must be at least 0").max(28, "GST rate cannot exceed 28%").default(5),

  // Garment Specific Attributes
  blouse_included: z.boolean().optional().nullable(),
  saree_length_meters: z.coerce.number().positive("Saree length must be positive").optional().nullable(),

  seo_title: z
    .string()
    .trim()
    .max(70, "SEO Title should not exceed 70 characters for optimal search snippets")
    .optional()
    .nullable(),
  seo_description: z
    .string()
    .trim()
    .max(170, "SEO Description should not exceed 170 characters for optimal search snippets")
    .optional()
    .nullable(),
  seo_keywords: z.array(z.string()).default([]),
  images: z
    .array(ProductImageSchema)
    .min(1, "At least one product image is required")
    .refine((imgs) => imgs.some((img) => img.is_primary), {
      message: "One image must be designated as the primary image",
    }),
  has_variants: z.boolean().default(true),
  stock_quantity: z.coerce.number().int().min(0, "Stock cannot be negative").default(0).optional().nullable(),
  specifications: z.array(SpecificationItemSchema).default([]),
  variants: z.array(ProductVariantFormSchema).default([]),
  size_chart_id: z.string().uuid().optional().nullable(),
  free_shipping_active: z.boolean().default(false),
  free_shipping_start: z.string().optional().nullable(),
  free_shipping_end: z.string().optional().nullable(),
  free_shipping_badge_text: z.string().trim().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.has_variants && data.variants.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["variants"],
      message: "At least one variant (size + color) is required when variants are enabled.",
    });
  }
});

export type AdminProductFormData = z.infer<typeof AdminProductFormSchema>;

/**
 * Single variant stock update input for Quick-Edit
 */
export interface VariantStockUpdate {
  variantId: string;
  stockQuantity: number;
}

export interface ProductStockQuickEditInput {
  productId: string;
  updates?: VariantStockUpdate[];
  stockQuantity?: number;
}

/**
 * CSV Import Row Schema
 */
export const CsvProductRowSchema = z.object({
  name: z.string().min(2, "Name required"),
  slug: z.string().min(2, "Slug required"),
  category_slug: z.string().min(1, "Category slug required"),
  base_price: z.coerce.number().positive("Base price must be positive"),
  compare_at_price: z.coerce.number().positive().optional().nullable(),
  fabric: z.string().optional().nullable(),
  care_instructions: z.string().optional().nullable(),
  size: z.string().min(1, "Variant size required"),
  color: z.string().min(1, "Variant color required"),
  sku: z.string().min(2, "Variant SKU required"),
  stock_quantity: z.coerce.number().int().min(0, "Stock cannot be negative"),
  is_active: z.coerce.boolean().default(true),
  is_featured: z.coerce.boolean().default(false),
});

export type CsvProductRow = z.infer<typeof CsvProductRowSchema>;
