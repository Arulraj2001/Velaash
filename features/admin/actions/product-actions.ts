"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/queries/get-admin-user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AdminProductFormSchema,
  type AdminProductFormData,
  type ProductStockQuickEditInput,
  type CsvProductRow,
} from "../types/products";
import {
  deleteProductImagesFromStorage,
  ensureProductImagesBucket,
} from "../utils/storage";

/**
 * Creates a new product with variants and images.
 * Permission: manage_products (Owner only).
 */
export async function createProductAction(data: AdminProductFormData) {
  await requireAdmin("manage_products");

  const validation = AdminProductFormSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Validation failed.",
    };
  }

  const valid = validation.data;
  const adminClient = createAdminClient();
  await ensureProductImagesBucket();

  // Check slug uniqueness
  const { data: existingSlug } = await adminClient
    .from("products")
    .select("id")
    .eq("slug", valid.slug)
    .maybeSingle();

  const finalSlug = existingSlug
    ? `${valid.slug}-${Date.now().toString(36)}`
    : valid.slug;

  const totalStock = valid.variants.reduce(
    (sum, v) => sum + Number(v.stock_quantity || 0),
    0
  );
  const stockStatus = totalStock > 0 ? "in_stock" : "out_of_stock";

  // 1. Insert product
  const { data: newProduct, error: productErr } = await adminClient
    .from("products")
    .insert({
      name: valid.name,
      slug: finalSlug,
      description: valid.description || null,
      category_id: valid.category_id,
      base_price: valid.base_price,
      compare_at_price: valid.compare_at_price || null,
      fabric: valid.fabric || null,
      care_instructions: valid.care_instructions || null,
      is_active: valid.is_active,
      is_featured: valid.is_featured,
      stock_status: stockStatus,
      seo_title: valid.seo_title || null,
      seo_description: valid.seo_description || null,
      seo_keywords: valid.seo_keywords || [],
    })
    .select("id, slug")
    .single();

  if (productErr || !newProduct) {
    console.error("Failed to create product:", productErr);
    return { success: false, error: productErr?.message || "Failed to create product." };
  }

  // 2. Insert variants
  const variantsToInsert = valid.variants.map((v) => ({
    product_id: newProduct.id,
    size: v.size,
    color: v.color,
    color_hex: v.color_hex || null,
    sku: v.sku,
    stock_quantity: v.stock_quantity,
    price_override: v.price_override || null,
    is_active: v.is_active,
  }));

  const { error: variantErr } = await adminClient
    .from("product_variants")
    .insert(variantsToInsert);

  if (variantErr) {
    console.error("Failed to insert variants:", variantErr);
    // Cleanup product on critical variant insertion failure
    await adminClient.from("products").delete().eq("id", newProduct.id);
    return { success: false, error: "Failed to create product variants." };
  }

  // 3. Insert images
  const imagesToInsert = valid.images.map((img, idx) => ({
    product_id: newProduct.id,
    image_url: img.image_url,
    alt_text: img.alt_text,
    is_primary: Boolean(img.is_primary),
    display_order: img.display_order ?? idx,
  }));

  const { error: imageErr } = await adminClient
    .from("product_images")
    .insert(imagesToInsert);

  if (imageErr) {
    console.error("Failed to insert images:", imageErr);
  }

  revalidatePath("/admin/products");
  revalidatePath(`/products/${newProduct.slug}`);
  revalidatePath("/");

  return {
    success: true,
    productId: newProduct.id,
    slug: newProduct.slug,
    message: "Product created successfully.",
  };
}

/**
 * Updates an existing product, its variants, and images.
 * Cleans up orphaned images from Supabase Storage.
 * Permission: manage_products (Owner only).
 */
export async function updateProductAction(
  productId: string,
  data: AdminProductFormData,
  deletedImageUrls: string[] = []
) {
  await requireAdmin("manage_products");

  const validation = AdminProductFormSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || "Validation failed.",
    };
  }

  const valid = validation.data;
  const adminClient = createAdminClient();

  const totalStock = valid.variants.reduce(
    (sum, v) => sum + Number(v.stock_quantity || 0),
    0
  );
  const stockStatus = totalStock > 0 ? "in_stock" : "out_of_stock";

  // 1. Update product base record
  const { error: updateErr } = await adminClient
    .from("products")
    .update({
      name: valid.name,
      slug: valid.slug,
      description: valid.description || null,
      category_id: valid.category_id,
      base_price: valid.base_price,
      compare_at_price: valid.compare_at_price || null,
      fabric: valid.fabric || null,
      care_instructions: valid.care_instructions || null,
      is_active: valid.is_active,
      is_featured: valid.is_featured,
      stock_status: stockStatus,
      seo_title: valid.seo_title || null,
      seo_description: valid.seo_description || null,
      seo_keywords: valid.seo_keywords || [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (updateErr) {
    console.error("Failed to update product:", updateErr);
    return { success: false, error: updateErr.message || "Failed to update product." };
  }

  // 2. Synchronize variants
  // Get current variant IDs in DB
  const { data: currentVariants } = await adminClient
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  const currentVariantIds = new Set((currentVariants ?? []).map((v) => v.id));
  const incomingVariantIds = new Set(
    valid.variants.map((v) => v.id).filter(Boolean) as string[]
  );

  // Delete removed variants that aren't referenced in order_items
  const toDeleteVariantIds = Array.from(currentVariantIds).filter(
    (id) => !incomingVariantIds.has(id)
  );

  if (toDeleteVariantIds.length > 0) {
    // Check if any to-be-deleted variant has order items
    const { data: orderedVariants } = await adminClient
      .from("order_items")
      .select("variant_id")
      .in("variant_id", toDeleteVariantIds);

    const orderedVariantIds = new Set((orderedVariants ?? []).map((o) => o.variant_id));

    const safeToDelete = toDeleteVariantIds.filter((id) => !orderedVariantIds.has(id));
    const onlyDeactivate = toDeleteVariantIds.filter((id) => orderedVariantIds.has(id));

    if (safeToDelete.length > 0) {
      await adminClient.from("product_variants").delete().in("id", safeToDelete);
    }
    if (onlyDeactivate.length > 0) {
      await adminClient
        .from("product_variants")
        .update({ is_active: false })
        .in("id", onlyDeactivate);
    }
  }

  // Upsert variants
  for (const v of valid.variants) {
    if (v.id && currentVariantIds.has(v.id)) {
      await adminClient
        .from("product_variants")
        .update({
          size: v.size,
          color: v.color,
          color_hex: v.color_hex || null,
          sku: v.sku,
          stock_quantity: v.stock_quantity,
          price_override: v.price_override || null,
          is_active: v.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", v.id);
    } else {
      await adminClient.from("product_variants").insert({
        product_id: productId,
        size: v.size,
        color: v.color,
        color_hex: v.color_hex || null,
        sku: v.sku,
        stock_quantity: v.stock_quantity,
        price_override: v.price_override || null,
        is_active: v.is_active,
      });
    }
  }

  // 3. Synchronize images
  // Replace images for this product cleanly
  await adminClient.from("product_images").delete().eq("product_id", productId);

  const imagesToInsert = valid.images.map((img, idx) => ({
    product_id: productId,
    image_url: img.image_url,
    alt_text: img.alt_text,
    is_primary: Boolean(img.is_primary),
    display_order: img.display_order ?? idx,
  }));

  await adminClient.from("product_images").insert(imagesToInsert);

  // 4. Delete orphaned image files from Supabase Storage
  if (deletedImageUrls && deletedImageUrls.length > 0) {
    await deleteProductImagesFromStorage(deletedImageUrls);
  }

  revalidatePath("/admin/products");
  revalidatePath(`/products/${valid.slug}`);
  revalidatePath("/");

  return {
    success: true,
    productId,
    slug: valid.slug,
    message: "Product updated successfully.",
  };
}

/**
 * Duplicates an existing product with its variants and images.
 * Permission: manage_products (Owner only).
 */
export async function duplicateProductAction(productId: string) {
  await requireAdmin("manage_products");

  const adminClient = createAdminClient();

  const { data: original, error: origErr } = await adminClient
    .from("products")
    .select(`
      *,
      product_variants (*),
      product_images (*)
    `)
    .eq("id", productId)
    .single();

  if (origErr || !original) {
    return { success: false, error: "Original product not found for duplication." };
  }

  const timestamp = Date.now().toString(36).slice(-4);
  const newName = `${original.name} (Copy)`;
  const newSlug = `${original.slug}-copy-${timestamp}`;

  // Insert duplicated product as draft
  const { data: copyProduct, error: copyErr } = await adminClient
    .from("products")
    .insert({
      name: newName,
      slug: newSlug,
      description: original.description,
      category_id: original.category_id,
      base_price: original.base_price,
      compare_at_price: original.compare_at_price,
      fabric: original.fabric,
      care_instructions: original.care_instructions,
      is_active: false, // Save as draft
      is_featured: false,
      stock_status: original.stock_status,
      seo_title: original.seo_title,
      seo_description: original.seo_description,
      seo_keywords: original.seo_keywords,
    })
    .select("id, slug")
    .single();

  if (copyErr || !copyProduct) {
    return { success: false, error: copyErr?.message || "Failed to create product copy." };
  }

  // Duplicate variants with new SKUs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalVariants = (original.product_variants ?? []) as any[];
  if (originalVariants.length > 0) {
    const copyVariants = originalVariants.map((v) => ({
      product_id: copyProduct.id,
      size: v.size,
      color: v.color,
      color_hex: v.color_hex,
      sku: `${v.sku}-COPY-${timestamp}`.slice(0, 50),
      stock_quantity: v.stock_quantity,
      price_override: v.price_override,
      is_active: v.is_active,
    }));
    await adminClient.from("product_variants").insert(copyVariants);
  }

  // Duplicate images
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalImages = (original.product_images ?? []) as any[];
  if (originalImages.length > 0) {
    const copyImages = originalImages.map((img) => ({
      product_id: copyProduct.id,
      image_url: img.image_url,
      alt_text: img.alt_text,
      is_primary: img.is_primary,
      display_order: img.display_order,
    }));
    await adminClient.from("product_images").insert(copyImages);
  }

  revalidatePath("/admin/products");
  return {
    success: true,
    productId: copyProduct.id,
    slug: copyProduct.slug,
    message: `Product duplicated as draft: "${newName}"`,
  };
}

/**
 * Toggles product active/inactive state.
 * Permission: manage_products (Owner only).
 */
export async function toggleProductStatusAction(productId: string, isActive: boolean) {
  await requireAdmin("manage_products");

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("products")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/products");
  return {
    success: true,
    message: `Product ${isActive ? "activated" : "deactivated"} successfully.`,
  };
}

/**
 * Deletes a product or deactivates it if referenced in existing customer orders.
 * Cleans up orphaned images from storage upon hard delete.
 * Permission: delete_products (Owner only).
 */
export async function deleteProductAction(productId: string) {
  await requireAdmin("delete_products");

  const adminClient = createAdminClient();

  // 1. Check if referenced in order_items
  const { count: orderCount, error: countErr } = await adminClient
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (countErr) {
    return { success: false, error: "Failed to verify order history." };
  }

  if (orderCount && orderCount > 0) {
    // Cannot hard delete: deactivate instead to protect historical order data
    await adminClient
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", productId);

    revalidatePath("/admin/products");
    return {
      success: true,
      deactivated: true,
      message: `Product is referenced in ${orderCount} existing customer order(s). It has been deactivated instead of deleted to protect financial order records.`,
    };
  }

  // 2. Not referenced in any orders: proceed with hard delete
  // Fetch images to delete from Supabase storage
  const { data: images } = await adminClient
    .from("product_images")
    .select("image_url")
    .eq("product_id", productId);

  const imageUrls = (images ?? []).map((img) => img.image_url);

  // Delete DB child records first
  await adminClient.from("product_images").delete().eq("product_id", productId);
  await adminClient.from("product_variants").delete().eq("product_id", productId);
  await adminClient.from("products").delete().eq("id", productId);

  // Clean up storage images
  if (imageUrls.length > 0) {
    await deleteProductImagesFromStorage(imageUrls);
  }

  revalidatePath("/admin/products");
  return {
    success: true,
    deactivated: false,
    message: "Product and associated assets permanently deleted.",
  };
}

/**
 * Quick-Edit Stock: Updates stock quantities across variants.
 * Permission: update_stock (Both Staff and Owner CAN call this).
 */
export async function updateProductStockAction(input: ProductStockQuickEditInput) {
  await requireAdmin("update_stock");

  if (!input.productId || !input.updates || input.updates.length === 0) {
    return { success: false, error: "Invalid stock update parameters." };
  }

  const adminClient = createAdminClient();

  // Update each variant stock count
  for (const item of input.updates) {
    if (item.stockQuantity < 0) {
      return { success: false, error: "Stock quantity cannot be negative." };
    }

    const { error: variantErr } = await adminClient
      .from("product_variants")
      .update({
        stock_quantity: Math.floor(item.stockQuantity),
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.variantId)
      .eq("product_id", input.productId);

    if (variantErr) {
      console.error("Variant stock update failed:", variantErr);
      return { success: false, error: "Database error updating variant stock." };
    }
  }

  // Re-derive overall stock status on the product
  const { data: allVariants } = await adminClient
    .from("product_variants")
    .select("stock_quantity")
    .eq("product_id", input.productId)
    .eq("is_active", true);

  const totalStock = (allVariants ?? []).reduce(
    (sum, v) => sum + Number(v.stock_quantity || 0),
    0
  );
  const stockStatus = totalStock > 0 ? "in_stock" : "out_of_stock";

  await adminClient
    .from("products")
    .update({
      stock_status: stockStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.productId);

  revalidatePath("/admin/products");
  revalidatePath("/");

  return {
    success: true,
    totalStock,
    message: `Stock quantities successfully updated (Total: ${totalStock} units).`,
  };
}

/**
 * Bulk actions across multiple selected products.
 * Permission: manage_products / delete_products (Owner only).
 */
export async function bulkProductsAction(params: {
  action: "activate" | "deactivate" | "delete";
  productIds: string[];
}) {
  if (params.action === "delete") {
    await requireAdmin("delete_products");
  } else {
    await requireAdmin("manage_products");
  }

  if (!params.productIds || params.productIds.length === 0) {
    return { success: false, error: "No products selected." };
  }

  const adminClient = createAdminClient();

  if (params.action === "activate") {
    await adminClient
      .from("products")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .in("id", params.productIds);

    revalidatePath("/admin/products");
    return {
      success: true,
      message: `Activated ${params.productIds.length} product(s).`,
    };
  }

  if (params.action === "deactivate") {
    await adminClient
      .from("products")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in("id", params.productIds);

    revalidatePath("/admin/products");
    return {
      success: true,
      message: `Deactivated ${params.productIds.length} product(s).`,
    };
  }

  if (params.action === "delete") {
    let deletedCount = 0;
    let deactivatedCount = 0;

    for (const pid of params.productIds) {
      const res = await deleteProductAction(pid);
      if (res.success) {
        if (res.deactivated) {
          deactivatedCount++;
        } else {
          deletedCount++;
        }
      }
    }

    revalidatePath("/admin/products");
    const summary = [
      deletedCount > 0 ? `${deletedCount} permanently deleted` : "",
      deactivatedCount > 0 ? `${deactivatedCount} deactivated (referenced in orders)` : "",
    ]
      .filter(Boolean)
      .join(", ");

    return {
      success: true,
      message: `Bulk delete completed: ${summary || "No changes made"}.`,
    };
  }

  return { success: false, error: "Invalid bulk action." };
}

/**
 * Bulk CSV Import for products.
 * Validates rows, reports errors, and inserts valid products + variants.
 * Permission: manage_products (Owner only).
 */
export async function importProductsCsvAction(rows: CsvProductRow[]) {
  await requireAdmin("manage_products");

  if (!rows || rows.length === 0) {
    return { success: false, error: "No data rows provided for import." };
  }

  const adminClient = createAdminClient();

  // Load all categories for slug lookup
  const { data: categories } = await adminClient
    .from("categories")
    .select("id, slug");

  const categoryMap = new Map<string, string>();
  for (const c of categories ?? []) {
    categoryMap.set(c.slug.toLowerCase(), c.id);
  }

  let importedCount = 0;

  for (const row of rows) {
    const categoryId = categoryMap.get(row.category_slug.toLowerCase());
    if (!categoryId) {
      continue;
    }

    // Check if product already exists by slug
    let productId: string;
    const { data: existingProd } = await adminClient
      .from("products")
      .select("id")
      .eq("slug", row.slug)
      .maybeSingle();

    if (existingProd) {
      productId = existingProd.id;
    } else {
      const { data: newProd, error: prodErr } = await adminClient
        .from("products")
        .insert({
          name: row.name,
          slug: row.slug,
          category_id: categoryId,
          base_price: row.base_price,
          compare_at_price: row.compare_at_price || null,
          fabric: row.fabric || null,
          care_instructions: row.care_instructions || null,
          is_active: row.is_active,
          is_featured: row.is_featured,
          stock_status: row.stock_quantity > 0 ? "in_stock" : "out_of_stock",
        })
        .select("id")
        .single();

      if (prodErr || !newProd) {
        continue;
      }
      productId = newProd.id;
    }

    // Check if variant SKU already exists
    const { data: existingVariant } = await adminClient
      .from("product_variants")
      .select("id")
      .eq("sku", row.sku)
      .maybeSingle();

    if (existingVariant) {
      // Update stock
      await adminClient
        .from("product_variants")
        .update({
          stock_quantity: row.stock_quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingVariant.id);
    } else {
      // Insert new variant
      await adminClient.from("product_variants").insert({
        product_id: productId,
        size: row.size,
        color: row.color,
        sku: row.sku,
        stock_quantity: row.stock_quantity,
        is_active: true,
      });
    }

    importedCount++;
  }

  revalidatePath("/admin/products");
  return {
    success: true,
    importedCount,
    message: `Successfully processed ${importedCount} items from CSV.`,
  };
}
