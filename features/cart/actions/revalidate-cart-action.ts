"use server";

import { createClient } from "@/lib/supabase/server";
import type { RevalidateCartResponse, RevalidatedCartItem } from "../types";
import { validateCouponAction } from "./validate-coupon-action";

interface InputCartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number;
}

export async function revalidateCartAction({
  items,
  appliedCouponCode,
}: {
  items: InputCartItem[];
  appliedCouponCode?: string | null;
}): Promise<RevalidateCartResponse> {
  if (!items || items.length === 0) {
    return { items: [], validatedCoupon: null, couponError: null };
  }

  const revalidatedItems: RevalidatedCartItem[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let variantsData: any[] | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let productsData: any[] | null = null;
    try {
      const supabase = await createClient();
      const variantIds = items
        .map((i) => i.variantId)
        .filter((id): id is string => Boolean(id && id !== "simple" && id !== "undefined"));
      const productIds = Array.from(new Set(items.map((i) => i.productId)));

      if (variantIds.length > 0) {
        const { data, error } = await supabase
          .from("product_variants")
          .select(`
            id,
            product_id,
            stock_quantity,
            price_override,
            is_active,
            products (
              id,
              base_price,
              is_active
            )
          `)
          .in("id", variantIds);

        if (!error && data) {
          variantsData = data;
        }
      }

      if (productIds.length > 0) {
        const { data: pData } = await supabase
          .from("products")
          .select(`id, base_price, is_active, stock_status`)
          .in("id", productIds);

        if (pData) {
          productsData = pData;
        }
      }
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        (err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
      ) {
        throw err;
      }
    }

    // Process each cart item
    for (const item of items) {
      // Find matching live variant
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const liveVariant: any = variantsData
        ? variantsData.find((v) => v.id === item.variantId)
        : null;

      if (liveVariant) {
        const product = liveVariant.products;
        const isProductActive = Boolean(product?.is_active);
        const isVariantActive = Boolean(liveVariant.is_active);
        const isAvailable = isProductActive && isVariantActive && liveVariant.stock_quantity > 0;

        const currentPrice =
          liveVariant.price_override !== null && liveVariant.price_override !== undefined
            ? Number(liveVariant.price_override)
            : Number(product?.base_price ?? item.price);

        const priceChanged = Math.abs(currentPrice - item.price) > 0.01;
        const availableStock = Number(liveVariant.stock_quantity ?? 0);
        const quantityExceeds = item.quantity > availableStock;
        const adjustedQuantity = isAvailable ? Math.max(1, Math.min(item.quantity, availableStock)) : 0;

        let message: string | undefined;
        if (!isAvailable) {
          message = "This item is currently out of stock or no longer available.";
        } else if (quantityExceeds) {
          message = `Quantity was adjusted to match available inventory (${availableStock} remaining).`;
        } else if (priceChanged) {
          message = "Price updated to current catalog price.";
        }

        revalidatedItems.push({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId || null,
          currentPrice,
          priceChanged,
          availableStock,
          isAvailable,
          quantityAdjusted: quantityExceeds,
          adjustedQuantity,
          message,
        });
      } else {
        // Simple product or variant not found: check productsData directly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const liveProduct: any = productsData
          ? productsData.find((p) => p.id === item.productId)
          : null;

        if (liveProduct && (!item.variantId || item.variantId === "simple" || item.variantId === item.productId)) {
          const isAvailable = Boolean(liveProduct.is_active) && liveProduct.stock_status !== "out_of_stock";
          const currentPrice = Number(liveProduct.base_price ?? item.price);
          const priceChanged = Math.abs(currentPrice - item.price) > 0.01;
          const availableStock = 10;
          const quantityExceeds = item.quantity > availableStock;
          const adjustedQuantity = isAvailable ? Math.max(1, Math.min(item.quantity, availableStock)) : 0;

          let message: string | undefined;
          if (!isAvailable) {
            message = "This item is currently out of stock or no longer available.";
          } else if (priceChanged) {
            message = "Price updated to current catalog price.";
          }

          revalidatedItems.push({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId || null,
            currentPrice,
            priceChanged,
            availableStock,
            isAvailable,
            quantityAdjusted: quantityExceeds,
            adjustedQuantity,
            message,
          });
        } else {
          // Product variant was not found in the live database catalog
          revalidatedItems.push({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId || null,
            currentPrice: item.price,
            priceChanged: false,
            availableStock: 0,
            isAvailable: false,
            quantityAdjusted: true,
            adjustedQuantity: 0,
            message: "This product is no longer available in the store catalog.",
          });
        }
      }
    }

    // Re-calculate fresh subtotal of valid items to validate any applied coupon
    const validSubtotal = revalidatedItems
      .filter((i) => i.isAvailable)
      .reduce((sum, item) => sum + item.currentPrice * item.adjustedQuantity, 0);

    let validatedCoupon = null;
    let couponError = null;

    if (appliedCouponCode) {
      const couponRes = await validateCouponAction(appliedCouponCode, validSubtotal);
      if (couponRes.success) {
        validatedCoupon = {
          code: couponRes.coupon.code,
          discountType: couponRes.coupon.discountType,
          discountValue: couponRes.coupon.discountValue,
          minOrderValue: couponRes.coupon.minOrderValue,
          maxDiscountAmount: couponRes.coupon.maxDiscountAmount,
          discountAmount: couponRes.discountAmount,
        };
      } else {
        couponError = couponRes.error;
      }
    }

    return {
      items: revalidatedItems,
      validatedCoupon,
      couponError,
    };
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      (err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }
    // Return safe graceful degradation
    return {
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        variantId: i.variantId || null,
        currentPrice: i.price,
        priceChanged: false,
        availableStock: 10,
        isAvailable: true,
        quantityAdjusted: false,
        adjustedQuantity: i.quantity,
      })),
      validatedCoupon: null,
      couponError: null,
    };
  }
}
