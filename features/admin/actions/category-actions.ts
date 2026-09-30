"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/queries/get-admin-user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AdminCategoryFormSchema,
  type AdminCategoryFormData,
} from "../types/categories";
import {
  PRODUCT_IMAGES_BUCKET,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
  ensureProductImagesBucket,
} from "../utils/storage";

/**
 * Revalidates public store navigation and admin category paths.
 */
function revalidateCategoryPaths(slug?: string) {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/shop");
  if (slug) {
    revalidatePath(`/category/${slug}`);
  }
}

/**
 * Helper to validate parent-child relationship constraints:
 * - A category cannot be its own parent.
 * - Max 2 levels of nesting (parent category must be top-level: parent.parent_id === null).
 * - A category with existing sub-categories cannot become a sub-category.
 */
async function validateParentHierarchy(
  adminClient: ReturnType<typeof createAdminClient>,
  categoryId: string | null,
  parentId: string | null | undefined
): Promise<{ valid: boolean; error?: string }> {
  if (!parentId) {
    return { valid: true };
  }

  // 1. Cannot be its own parent
  if (categoryId && parentId === categoryId) {
    return { valid: false, error: "A category cannot be set as its own parent." };
  }

  // 2. Fetch the proposed parent category
  const { data: parentCat, error: parentErr } = await adminClient
    .from("categories")
    .select("id, name, parent_id")
    .eq("id", parentId)
    .single();

  if (parentErr || !parentCat) {
    return { valid: false, error: "Selected parent category does not exist." };
  }

  // 3. Parent must be top-level (cannot nest under a sub-category, max 2 levels)
  if (parentCat.parent_id !== null) {
    return {
      valid: false,
      error: "Categories cannot exceed 2 levels of hierarchy. Sub-categories cannot have children.",
    };
  }

  // 4. If updating an existing category, verify it does not already have subcategories
  if (categoryId) {
    const { count: childCount } = await adminClient
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", categoryId);

    if (childCount && childCount > 0) {
      return {
        valid: false,
        error: `Cannot assign a parent to "${categoryId}" because it already contains ${childCount} sub-category(ies). Categories cannot exceed 2 levels.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Creates a new category (top-level or sub-category).
 * Permission: manage_categories (Owner only).
 */
export async function createCategoryAction(input: AdminCategoryFormData) {
  await requireAdmin("manage_categories");

  const validation = AdminCategoryFormSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid category data.",
    };
  }

  const valid = validation.data;
  const adminClient = createAdminClient();

  // Check slug uniqueness
  const { data: existingSlug } = await adminClient
    .from("categories")
    .select("id")
    .eq("slug", valid.slug)
    .maybeSingle();

  if (existingSlug) {
    return {
      success: false,
      error: `A category with slug "${valid.slug}" already exists. Please choose a different slug.`,
    };
  }

  // Check parent hierarchy constraints
  const hierarchyCheck = await validateParentHierarchy(
    adminClient,
    null,
    valid.parent_id
  );
  if (!hierarchyCheck.valid) {
    return { success: false, error: hierarchyCheck.error };
  }

  // Calculate default display order if not provided
  let displayOrder = valid.display_order;
  if (displayOrder === 0) {
    let orderQuery = adminClient
      .from("categories")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    if (valid.parent_id) {
      orderQuery = orderQuery.eq("parent_id", valid.parent_id);
    } else {
      orderQuery = orderQuery.is("parent_id", null);
    }

    const { data: maxOrderData } = await orderQuery.maybeSingle();
    displayOrder = (maxOrderData?.display_order ?? 0) + 1;
  }

  // 1. Insert Category
  const { data: newCat, error: insertErr } = await adminClient
    .from("categories")
    .insert({
      name: valid.name,
      slug: valid.slug,
      description: valid.description || null,
      image_url: valid.image_url || null,
      display_order: displayOrder,
      is_active: valid.is_active,
      parent_id: valid.parent_id || null,
      seo_title: valid.seo_title || null,
      seo_description: valid.seo_description || null,
    })
    .select("id, slug, name")
    .single();

  if (insertErr || !newCat) {
    console.error("Failed to create category:", insertErr);
    return { success: false, error: insertErr?.message || "Failed to create category." };
  }

  // 2. Handle Size Chart if provided
  if (valid.size_chart) {
    const { error: chartErr } = await adminClient.from("size_charts").insert({
      name: valid.size_chart.name,
      category_id: newCat.id,
      measurement_unit: valid.size_chart.measurement_unit,
      chart_data: {
        headers: valid.size_chart.headers,
        rows: valid.size_chart.rows,
        tips: valid.size_chart.tips || [],
      },
    });

    if (chartErr) {
      console.warn("Category created but failed to save size chart:", chartErr);
    }
  }

  revalidateCategoryPaths(newCat.slug);

  return {
    success: true,
    categoryId: newCat.id,
    slug: newCat.slug,
    message: `Category "${newCat.name}" created successfully.`,
  };
}

/**
 * Updates an existing category and optional category-level default size chart.
 * Permission: manage_categories (Owner only).
 */
export async function updateCategoryAction(
  categoryId: string,
  input: AdminCategoryFormData
) {
  await requireAdmin("manage_categories");

  if (!categoryId) {
    return { success: false, error: "Category ID is required for update." };
  }

  const validation = AdminCategoryFormSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Invalid category data.",
    };
  }

  const valid = validation.data;
  const adminClient = createAdminClient();

  // Check slug uniqueness excluding self
  const { data: existingSlug } = await adminClient
    .from("categories")
    .select("id")
    .eq("slug", valid.slug)
    .neq("id", categoryId)
    .maybeSingle();

  if (existingSlug) {
    return {
      success: false,
      error: `A category with slug "${valid.slug}" already exists. Please choose a different slug.`,
    };
  }

  // Validate hierarchy constraints
  const hierarchyCheck = await validateParentHierarchy(
    adminClient,
    categoryId,
    valid.parent_id
  );
  if (!hierarchyCheck.valid) {
    return { success: false, error: hierarchyCheck.error };
  }

  // 1. Update Category
  const { error: updateErr } = await adminClient
    .from("categories")
    .update({
      name: valid.name,
      slug: valid.slug,
      description: valid.description || null,
      image_url: valid.image_url || null,
      display_order: valid.display_order,
      is_active: valid.is_active,
      parent_id: valid.parent_id || null,
      seo_title: valid.seo_title || null,
      seo_description: valid.seo_description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (updateErr) {
    console.error("Failed to update category:", updateErr);
    return { success: false, error: updateErr.message || "Failed to update category." };
  }

  // 2. Handle Size Chart
  if (valid.size_chart) {
    // Check if category already has a size chart
    const { data: existingChart } = await adminClient
      .from("size_charts")
      .select("id")
      .eq("category_id", categoryId)
      .maybeSingle();

    if (existingChart) {
      await adminClient
        .from("size_charts")
        .update({
          name: valid.size_chart.name,
          measurement_unit: valid.size_chart.measurement_unit,
          chart_data: {
            headers: valid.size_chart.headers,
            rows: valid.size_chart.rows,
            tips: valid.size_chart.tips || [],
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingChart.id);
    } else {
      await adminClient.from("size_charts").insert({
        name: valid.size_chart.name,
        category_id: categoryId,
        measurement_unit: valid.size_chart.measurement_unit,
        chart_data: {
          headers: valid.size_chart.headers,
          rows: valid.size_chart.rows,
          tips: valid.size_chart.tips || [],
        },
      });
    }
  } else {
    // If size_chart is omitted/cleared, delete existing category size chart
    await adminClient
      .from("size_charts")
      .delete()
      .eq("category_id", categoryId);
  }

  revalidateCategoryPaths(valid.slug);

  return {
    success: true,
    categoryId,
    slug: valid.slug,
    message: `Category "${valid.name}" updated successfully.`,
  };
}

/**
 * Safeguarded deletion of a category.
 * - Blocks deletion if active products are assigned (reports exact count).
 * - Blocks deletion if sub-categories exist (reports exact count).
 * Permission: manage_categories (Owner only).
 */
export async function deleteCategoryAction(categoryId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  activeProductCount?: number;
  subCategoryCount?: number;
}> {
  await requireAdmin("manage_categories");

  if (!categoryId) {
    return { success: false, error: "Category ID is required." };
  }

  const adminClient = createAdminClient();

  // 1. Safeguard: Check active products in this category
  const { count: productCount, error: prodCountErr } = await adminClient
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("is_active", true);

  if (prodCountErr) {
    return { success: false, error: "Failed to verify category product dependencies." };
  }

  if (productCount && productCount > 0) {
    return {
      success: false,
      activeProductCount: productCount,
      error: `This category has ${productCount} active products. Reassign or deactivate them first.`,
    };
  }

  // 2. Safeguard: Check sub-categories assigned to this parent
  const { count: subCount, error: subCountErr } = await adminClient
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", categoryId);

  if (subCountErr) {
    return { success: false, error: "Failed to verify sub-category dependencies." };
  }

  if (subCount && subCount > 0) {
    return {
      success: false,
      subCategoryCount: subCount,
      error: `This category has ${subCount} sub-categories. Delete or reassign all sub-categories first.`,
    };
  }

  // 3. Delete size chart and category
  await adminClient.from("size_charts").delete().eq("category_id", categoryId);

  const { error: delErr } = await adminClient
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (delErr) {
    console.error("Failed to delete category:", delErr);
    return { success: false, error: delErr.message || "Failed to delete category." };
  }

  revalidateCategoryPaths();

  return {
    success: true,
    message: "Category successfully deleted.",
  };
}

/**
 * Quick toggle of active/inactive status on a category.
 * Permission: manage_categories (Owner only).
 */
export async function toggleCategoryActiveAction(
  categoryId: string,
  isActive: boolean
) {
  await requireAdmin("manage_categories");

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("categories")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateCategoryPaths();
  return {
    success: true,
    message: `Category ${isActive ? "activated" : "deactivated"} successfully.`,
  };
}

/**
 * Batch update category display orders (supports drag-and-drop reordering).
 * Permission: manage_categories (Owner only).
 */
export async function reorderCategoriesAction(
  updates: { id: string; display_order: number }[]
) {
  await requireAdmin("manage_categories");

  if (!updates || updates.length === 0) {
    return { success: false, error: "No order updates provided." };
  }

  const adminClient = createAdminClient();

  for (const item of updates) {
    const { error } = await adminClient
      .from("categories")
      .update({
        display_order: item.display_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      console.error(`Failed to update display order for category ${item.id}:`, error);
      return { success: false, error: `Failed to update display order: ${error.message}` };
    }
  }

  revalidateCategoryPaths();

  return {
    success: true,
    message: "Category display order successfully updated.",
  };
}

/**
 * Upload category banner or thumbnail image to Supabase Storage.
 * Permission: manage_categories (Owner only).
 */
export async function uploadCategoryImageAction(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    await requireAdmin("manage_categories");

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No image file provided." };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Please upload a JPG, PNG, or WebP image.",
      };
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        success: false,
        error: "File size exceeds the 5MB maximum limit.",
      };
    }

    await ensureProductImagesBucket();
    const adminClient = createAdminClient();

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const storagePath = `categories/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await adminClient.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      console.error("Category image upload failed:", uploadErr);
      return { success: false, error: "Failed to upload image to storage." };
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Upload authorization failed.";
    return { success: false, error: msg };
  }
}
