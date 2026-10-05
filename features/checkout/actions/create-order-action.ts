"use server";

import React from "react";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import { validateCouponAction } from "@/features/cart/actions/validate-coupon-action";
import { createRazorpayOrder } from "@/lib/razorpay";
import { env } from "@/lib/env";
import { checkCodRateLimit } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { OrderConfirmationEmail } from "../emails/order-confirmation-email";
import { AccountWelcomeEmail } from "../emails/account-welcome-email";
import { generateOrderAccessToken } from "../utils/order-access-token";
import { MOCK_ORDERS_STORE } from "../queries/get-order-by-number";
import { MOCK_ONLINE_PENDING_ORDERS } from "../services/order-cleanup";
import {
  CreateOrderInputSchema,
  type CreateOrderInput,
  type CreateOrderResponse,
} from "../types";


export async function createOrderAction(
  rawInput: CreateOrderInput
): Promise<CreateOrderResponse> {
  // 1. Check for empty cart
  if (!rawInput.items || rawInput.items.length === 0) {
    return {
      success: false,
      error: "Your shopping bag is empty. Please add items before checking out.",
      code: "EMPTY_CART",
    };
  }

  // 2. Strict Runtime Schema Validation (Defense-in-depth against crafted HTTP requests)
  const validationResult = CreateOrderInputSchema.safeParse(rawInput);
  if (!validationResult.success) {
    const firstIssue = validationResult.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message || "Invalid checkout payload provided.",
      code: "INVALID_INPUT",
    };
  }

  const input = validationResult.data;

  // 2b. Cash on Delivery (COD) Abuse Protection & Rate Limiting
  // Runs strictly before any DB queries, pricing computations, or inventory locks
  if (input.paymentMethod === "cod") {
    let clientIp = "127.0.0.1";
    try {
      const headersList = await headers();
      clientIp =
        headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip") ||
        "127.0.0.1";
    } catch {
      // Outside request context (e.g. CLI tests)
    }

    const rateLimitResult = await checkCodRateLimit({
      phone: input.contact.phone,
      ip: clientIp,
    });

    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error:
          rateLimitResult.errorMessage ||
          "Too many Cash on Delivery orders from this number recently — please try online payment or contact us on WhatsApp",
        code: "COD_RATE_LIMIT_EXCEEDED",
      };
    }
  }

  try {
    // 3. Fetch current user session (optional - supports guest checkout)
    // Note: customerId is NEVER trusted from client input; extracted strictly from verified cookie session
    let customerId: string | null = null;
    let guestAccountCreated = false;
    try {
      const userSupabase = await createClient();
      const {
        data: { user },
      } = await userSupabase.auth.getUser();
      if (user) {
        customerId = user.id;
      }
    } catch {
      // Guest user or outside request context
    }

    // 4. Fetch live site settings for shipping & COD rules
    const siteSettings = await getSiteSettings();

    // 4b. Enforce customer sign-in requirement policy if toggled on in Admin Settings
    if (siteSettings.checkoutPolicy?.require_sign_in_to_order && !customerId) {
      return {
        success: false,
        error: "Please sign in to your Velaash account to place an order.",
        code: "AUTH_REQUIRED",
      };
    }

    // 5. Server-Side Stock Verification & Pricing Snapshot
    // CRITICAL: We NEVER trust prices or stock counts passed from the client!
    //
    // CALL-SITE JUSTIFICATION FOR ELEVATED SERVICE ROLE (Bypassing RLS):
    // 1. Order Insertion: Guest users (auth.uid() IS NULL) and authenticated customers
    //    have NO direct INSERT policy on 'orders' or 'order_items' (per 20260929000007_orders_and_order_items.sql).
    //    Client-side insertion is blocked by design to prevent manipulation of prices, totals, or statuses.
    // 2. Inventory Deduction: Only admins/service-role possess UPDATE permissions on
    //    'product_variants.stock_quantity' (per 20260929000005_products_and_variants.sql).
    // 3. Security Boundary: The service-role client is used strictly within this Server Action
    //    after authoritative re-calculation of pricing, coupon revalidation, and inventory cap verification.
    let adminSupabase: ReturnType<typeof createAdminClient> | null = null;
    try {
      adminSupabase = createAdminClient();
    } catch {
      // Fallback to mock catalog if database is not reachable
    }

    if (adminSupabase) {
      const { data: existingOrder, error: idempotencyLookupError } = await adminSupabase
        .from("orders")
        .select("id, order_number, status, payment_method, payment_status, total_amount, razorpay_order_id")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();

      if (idempotencyLookupError) {
        return {
          success: false,
          error: "Could not verify whether this checkout was already submitted. Please retry.",
          code: "VALIDATION_FAILED",
        };
      }

      if (existingOrder) {
        if (existingOrder.status === "cancelled" && existingOrder.payment_status === "paid") {
          return {
            success: false,
            error: "Payment was received after this order was cancelled. Please contact support for a refund update.",
            code: "VALIDATION_FAILED",
          };
        }

        if (existingOrder.payment_method !== input.paymentMethod) {
          return {
            success: false,
            error: "This checkout request was already used with a different payment method. Please refresh checkout.",
            code: "VALIDATION_FAILED",
          };
        }

        if (["cancelled", "payment_failed", "refunded"].includes(existingOrder.status)) {
          return {
            success: false,
            error: "This order is no longer active. Refresh checkout to place a new order.",
            code: "VALIDATION_FAILED",
          };
        }

        const alreadyCompleted = existingOrder.payment_status === "paid";
        if (
          !alreadyCompleted &&
          (existingOrder.status !== "pending" || existingOrder.payment_status !== "pending")
        ) {
          return {
            success: false,
            error: "This order is no longer awaiting payment. Refresh checkout to place a new order.",
            code: "VALIDATION_FAILED",
          };
        }

        if (
          input.paymentMethod === "razorpay" &&
          !alreadyCompleted &&
          !existingOrder.razorpay_order_id
        ) {
          return {
            success: false,
            error: "Payment setup for this order is incomplete. Refresh checkout to try again.",
            code: "GATEWAY_ERROR",
          };
        }

        const accessToken = generateOrderAccessToken(existingOrder.order_number);
        try {
          const cookieStore = await cookies();
          cookieStore.set(`velaash_order_access_${existingOrder.order_number}`, accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1800,
            sameSite: "lax",
            path: "/",
          });
        } catch {
          // Outside request context
        }

        return {
          success: true,
          orderNumber: existingOrder.order_number,
          orderId: existingOrder.id,
          totalAmount: Number(existingOrder.total_amount),
          paymentMethod: existingOrder.payment_method,
          isDuplicate: true,
          alreadyCompleted,
          razorpayOrderId: existingOrder.razorpay_order_id || undefined,
          razorpayKeyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key_id",
          amountPaise: Math.round(Number(existingOrder.total_amount) * 100),
          currency: "INR",
          accessToken,
        };
      }
    }

    // Guest Account Creation: If guest checked "Create an account?" during checkout,
    // provision user via Supabase auth admin without a password (email confirmed, OTP-ready),
    // auto-populating public.customers via database trigger and dispatching an account welcome email.
    if (!customerId && input.contact.createAccount && adminSupabase) {
      try {
        const { data: createdUser, error: createErr } =
          await adminSupabase.auth.admin.createUser({
            email: input.contact.email,
            email_confirm: true,
            user_metadata: {
              full_name: input.shippingAddress.fullName,
              phone: input.contact.phone,
            },
          });

        if (!createErr && createdUser?.user) {
          customerId = createdUser.user.id;
          guestAccountCreated = true;
          console.info(
            `[GuestAccount] Successfully provisioned passwordless Supabase account for ${input.contact.email} (UID: ${customerId})`
          );
        } else if (createErr) {
          // If the user already exists in auth.users, associate the order with their existing customer account
          const { data: listData } = await adminSupabase.auth.admin.listUsers();
          const existingUser = listData?.users?.find(
            (u) => u.email?.toLowerCase() === input.contact.email.toLowerCase()
          );
          if (existingUser) {
            customerId = existingUser.id;
            console.info(
              `[GuestAccount] Associated with existing customer account for ${input.contact.email} (UID: ${customerId})`
            );
          } else {
            console.warn("[GuestAccount] Supabase createUser error:", createErr.message);
          }
        }

        // If a new customer account was created, ensure customer profile is up-to-date,
        // auto-save the shipping address as their default address, and dispatch welcome email
        if (guestAccountCreated && customerId) {
          await adminSupabase.from("customers").upsert({
            id: customerId,
            full_name: input.shippingAddress.fullName,
            phone: input.contact.phone,
          });

          // Auto-save entered shipping address as default address for the newly created customer account
          const { error: addressErr } = await adminSupabase.from("addresses").insert({
            customer_id: customerId,
            full_name: input.shippingAddress.fullName,
            phone: input.shippingAddress.phone,
            address_line1: input.shippingAddress.addressLine1,
            address_line2: input.shippingAddress.addressLine2 || null,
            city: input.shippingAddress.city,
            state: input.shippingAddress.state,
            pincode: input.shippingAddress.pincode,
            address_type: input.shippingAddress.addressType || "home",
            is_default: true,
          });
          if (addressErr) {
            console.warn("[GuestAccount] Failed to auto-save default shipping address:", addressErr.message);
          } else {
            console.info(`[GuestAccount] Auto-saved default shipping address for customer UID: ${customerId}`);
          }

          // Send account confirmation email explaining the OTP login flow (no password link)
          try {
            const appUrl = (env.NEXT_PUBLIC_APP_URL || "https://velaash.in").replace(/\/$/, "");
            await sendTransactionalEmail({
              to: input.contact.email,
              subject: "Welcome to Velaash — Your Account is Ready",
              react: React.createElement(AccountWelcomeEmail, {
                customerName: input.shippingAddress.fullName,
                email: input.contact.email,
                loginUrl: `${appUrl}/account/login`,
                supportEmail: siteSettings.storeProfile.email,
              }),
              text: `Welcome to Velaash, ${input.shippingAddress.fullName}! Your customer account has been created for ${input.contact.email} and your delivery address has been saved to your account. You can log in anytime at ${appUrl}/account/login using your email — we'll send you a fast 6-digit access code, no password needed.`,
            });
          } catch (welcomeErr) {
            console.warn("[GuestAccount] Failed to dispatch account welcome email:", welcomeErr);
          }
        }
      } catch (authErr) {
        console.warn("[GuestAccount] Supabase account creation caught exception:", authErr);
      }
    }


    const variantIds = input.items
      .map((i) => i.variantId)
      .filter((id): id is string => Boolean(id && id !== "simple" && id !== "null"));

    const simpleProductIds = input.items
      .filter((i) => !i.variantId || i.variantId === "simple" || i.variantId === "null")
      .map((i) => i.productId);

    // Attempt to query live inventory from Postgres
    let liveVariants: Array<{
      id: string;
      product_id: string;
      stock_quantity: number;
      price_override: number | null;
      is_active: boolean;
      size: string;
      color: string;
      products: {
        id: string;
        name: string;
        base_price: number;
        is_active: boolean;
      } | null;
    }> = [];

    let liveProducts: Array<{
      id: string;
      name: string;
      base_price: number;
      stock_quantity?: number;
      is_active: boolean;
    }> = [];

    if (adminSupabase) {
      if (variantIds.length > 0) {
        try {
          const { data, error } = await adminSupabase
            .from("product_variants")
            .select(`
              id,
              product_id,
              stock_quantity,
              price_override,
              is_active,
              size,
              color,
              products (
                id,
                name,
                slug,
                base_price,
                is_active,
                free_shipping_active,
                free_shipping_start,
                free_shipping_end
              )
            `)
            .in("id", variantIds);

          if (error) {
            console.error("Live variants query PostgREST error:", error);
          } else if (data && data.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            liveVariants = data as any;
          }
        } catch (err) {
          console.error("Live variants query exception:", err);
        }
      }

      if (simpleProductIds.length > 0) {
        try {
          const res = await adminSupabase
            .from("products")
            .select("id, name, slug, base_price, is_active, stock_quantity, free_shipping_active, free_shipping_start, free_shipping_end")
            .in("id", simpleProductIds);

          if (!res.error && res.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            liveProducts = res.data as any;
          } else {
            // Fallback without stock_quantity column if column migration pending
            const fallbackRes = await adminSupabase
              .from("products")
              .select("id, name, slug, base_price, is_active, free_shipping_active, free_shipping_start, free_shipping_end")
              .in("id", simpleProductIds);
            if (fallbackRes.data) {
              liveProducts = (fallbackRes.data as any[]).map((p: any) => ({
                ...p,
                stock_quantity: 999,
              }));
            }
          }
        } catch (err) {
          console.error("Live simple products query exception:", err);
        }
      }
    }

    interface VerifiedLineItem {
      productId: string;
      slug?: string;
      variantId: string | null;
      title: string;
      size: string | null;
      color: string | null;
      unitPrice: number;
      quantity: number;
      lineSubtotal: number;
      availableStock: number;
      freeShippingActive?: boolean;
      freeShippingStart?: string | null;
      freeShippingEnd?: string | null;
    }

    const verifiedItems: VerifiedLineItem[] = [];

    for (const requestedItem of input.items) {
      const isSimple = !requestedItem.variantId || requestedItem.variantId === "simple" || requestedItem.variantId === "null";

      if (isSimple) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prodMatch = liveProducts.find((p) => p.id === requestedItem.productId) as any;
        if (!prodMatch || !prodMatch.is_active) {
          return {
            success: false,
            error: "An item in your cart is no longer available in the store catalog.",
            code: "OUT_OF_STOCK",
          };
        }

        const availableStock = prodMatch.stock_quantity ?? 999;
        if (availableStock < requestedItem.quantity) {
          return {
            success: false,
            error: `"${prodMatch.name}" has only ${availableStock} available in stock (you requested ${requestedItem.quantity}).`,
            code: "OUT_OF_STOCK",
          };
        }

        const unitPrice = Number(prodMatch.base_price);
        verifiedItems.push({
          productId: prodMatch.id,
          slug: prodMatch.slug,
          variantId: null,
          title: prodMatch.name,
          size: null,
          color: null,
          unitPrice,
          quantity: requestedItem.quantity,
          lineSubtotal: unitPrice * requestedItem.quantity,
          availableStock,
          freeShippingActive: prodMatch.free_shipping_active,
          freeShippingStart: prodMatch.free_shipping_start,
          freeShippingEnd: prodMatch.free_shipping_end,
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const liveMatch = liveVariants.find((v) => v.id === requestedItem.variantId) as any;
        if (!liveMatch || !liveMatch.is_active || !liveMatch.products?.is_active) {
          return {
            success: false,
            error: "An item in your cart is no longer available in the store catalog.",
            code: "OUT_OF_STOCK",
          };
        }

        if (liveMatch.stock_quantity < requestedItem.quantity) {
          return {
            success: false,
            error: `"${liveMatch.products.name}" has only ${liveMatch.stock_quantity} available in stock (you requested ${requestedItem.quantity}).`,
            code: "OUT_OF_STOCK",
          };
        }

        const unitPrice =
          liveMatch.price_override !== null && liveMatch.price_override !== undefined
            ? Number(liveMatch.price_override)
            : Number(liveMatch.products.base_price);

        verifiedItems.push({
          productId: liveMatch.product_id,
          slug: liveMatch.products.slug,
          variantId: liveMatch.id,
          title: liveMatch.products.name,
          size: liveMatch.size,
          color: liveMatch.color,
          unitPrice,
          quantity: requestedItem.quantity,
          lineSubtotal: unitPrice * requestedItem.quantity,
          availableStock: liveMatch.stock_quantity,
          freeShippingActive: liveMatch.products.free_shipping_active,
          freeShippingStart: liveMatch.products.free_shipping_start,
          freeShippingEnd: liveMatch.products.free_shipping_end,
        });
      }
    }

    // 6. Authoritative Subtotal Calculation
    const subtotal = verifiedItems.reduce((acc, item) => acc + item.lineSubtotal, 0);

    // 7. Authoritative Coupon Revalidation
    let discountAmount = 0;
    let validatedCouponCode: string | null = null;
    let validatedCoupon: {
      code: string;
      discountType: "percentage" | "flat" | "free_shipping";
    } | null = null;

    if (input.couponCode) {
      const couponRes = await validateCouponAction(input.couponCode, subtotal);
      if (!couponRes.success) {
        return {
          success: false,
          error: `Coupon error: ${couponRes.error}`,
          code: "COUPON_INVALID",
        };
      }
      discountAmount = couponRes.discountAmount;
      validatedCouponCode = couponRes.coupon.code;
      validatedCoupon = {
        code: couponRes.coupon.code,
        discountType: couponRes.coupon.discountType,
      };
    }

    // 8. Authoritative Shipping Fee Calculation (Conflict-Free Precedence)
    const now = new Date();
    const freeShippingThreshold = siteSettings.shippingPolicy.free_shipping_threshold;
    const isThresholdFree = subtotal >= freeShippingThreshold;

    let isFestiveActive = false;
    if (siteSettings.shippingPolicy.festive_shipping_enabled) {
      const validFrom = siteSettings.shippingPolicy.festive_valid_from
        ? new Date(siteSettings.shippingPolicy.festive_valid_from)
        : null;
      const validUntil = siteSettings.shippingPolicy.festive_valid_until
        ? new Date(siteSettings.shippingPolicy.festive_valid_until)
        : null;
      if (validUntil && validUntil.getHours() === 0 && validUntil.getMinutes() === 0) {
        validUntil.setHours(23, 59, 59, 999);
      }
      const isAfterStart = !validFrom || now >= validFrom;
      const isBeforeEnd = !validUntil || now <= validUntil;
      isFestiveActive = isAfterStart && isBeforeEnd;
    }

    const hasFestiveProduct =
      isFestiveActive &&
      (siteSettings.shippingPolicy.festive_apply_to_all ||
        verifiedItems.some((item) => {
          if (siteSettings.shippingPolicy.festive_product_ids?.includes(item.productId)) return true;
          if (item.slug && siteSettings.shippingPolicy.festive_product_ids?.includes(item.slug)) return true;
          return false;
        }));

    // Direct product-level free shipping (supports multiple simultaneous product offers)
    const hasProductDirectFreeShipping = verifiedItems.some((item) => {
      if (!item.freeShippingActive) return false;
      const start = item.freeShippingStart ? new Date(item.freeShippingStart) : null;
      const end = item.freeShippingEnd ? new Date(item.freeShippingEnd) : null;
      if (end && end.getHours() === 0 && end.getMinutes() === 0) {
        end.setHours(23, 59, 59, 999);
      }
      const isAfterStart = !start || now >= start;
      const isBeforeEnd = !end || now <= end;
      return isAfterStart && isBeforeEnd;
    });

    const isCouponFree = Boolean(
      validatedCoupon &&
        (validatedCoupon.discountType === "free_shipping" ||
          (siteSettings.shippingPolicy.festive_coupon_code &&
            validatedCoupon.code.toUpperCase() ===
              siteSettings.shippingPolicy.festive_coupon_code.toUpperCase()))
    );

    const isFreeShipping = isThresholdFree || hasFestiveProduct || hasProductDirectFreeShipping || isCouponFree;
    const shippingCharge = isFreeShipping
      ? 0
      : siteSettings.shippingPolicy.standard_shipping_fee;
    const shippingSource = isThresholdFree
      ? "free_threshold"
      : hasFestiveProduct
      ? "festive_campaign_offer"
      : hasProductDirectFreeShipping
      ? "product_direct_offer"
      : isCouponFree
      ? "free_shipping_coupon"
      : "standard_delivery";

    console.info(
      `[Checkout] Shipping charge ₹${shippingCharge} (source: ${shippingSource}, pincode: ${input.shippingAddress.pincode})`
    );

    // 9. Payment Method Validation & COD Fee Calculation
    let codHandlingFee = 0;
    if (input.paymentMethod === "cod") {
      const { cod_enabled, cod_max_order_value, cod_handling_fee } = siteSettings.paymentSettings;
      if (!cod_enabled) {
        return {
          success: false,
          error: "Cash on Delivery is currently unavailable. Please choose online payment.",
          code: "COD_UNAVAILABLE",
        };
      }
      if (subtotal > cod_max_order_value) {
        return {
          success: false,
          error: `Cash on Delivery is not available for orders above ₹${cod_max_order_value.toLocaleString("en-IN")}.`,
          code: "COD_UNAVAILABLE",
        };
      }
      codHandlingFee = cod_handling_fee;
    } else if (input.paymentMethod === "razorpay") {
      const { razorpay_enabled } = siteSettings.paymentSettings;
      if (!razorpay_enabled) {
        return {
          success: false,
          error: "Online payments via Razorpay are temporarily paused. Please choose Cash on Delivery or contact support.",
          code: "GATEWAY_ERROR",
        };
      }
    }

    // 10. Authoritative Total Amount
    let totalAmount = Math.max(0, subtotal - discountAmount) + shippingCharge + codHandlingFee;

    // 11. Generate Order Number & Record Order
    let orderNumber: string;
    let orderId: string;
    let isDuplicateOrder = false;
    let existingRazorpayOrderId: string | undefined;

    const shippingAddressSnapshot = {
      fullName: input.shippingAddress.fullName,
      phone: input.shippingAddress.phone,
      addressLine1: input.shippingAddress.addressLine1,
      addressLine2: input.shippingAddress.addressLine2 || null,
      city: input.shippingAddress.city,
      state: input.shippingAddress.state,
      pincode: input.shippingAddress.pincode,
      addressType: input.shippingAddress.addressType || "home",
      email: input.contact.email,
    };

    // The RPC commits the order, order items, coupon usage, and stock reservation atomically.
    let dbWriteSuccess = false;

    const hasSimpleItems = verifiedItems.some((i) => !i.variantId);

    if (adminSupabase && verifiedItems.length > 0) {
      try {
        if (!hasSimpleItems) {
          // Standard pure variant clothing checkout using atomic RPC
          const { data, error } = await adminSupabase.rpc("create_checkout_order_atomic", {
            p_idempotency_key: input.idempotencyKey,
            p_customer_id: customerId,
            p_payment_method: input.paymentMethod,
            p_subtotal: subtotal,
            p_shipping_charge: shippingCharge,
            p_discount_amount: discountAmount,
            p_total_amount: totalAmount,
            p_shipping_address: shippingAddressSnapshot,
            p_coupon_code: validatedCouponCode,
            p_notes: `${codHandlingFee > 0 ? `[COD handling fee: ₹${codHandlingFee}]` : ""}${guestAccountCreated ? " [guest_account_created: true]" : ""}`.trim(),
            p_items: verifiedItems.map((item) => ({
              product_id: item.productId,
              variant_id: item.variantId,
              title: item.title,
              size: item.size || "",
              color: item.color || "",
              unit_price: item.unitPrice,
              quantity: item.quantity,
              line_subtotal: item.lineSubtotal,
            })),
          });

          if (error) {
            const isOutOfStock = error.message.includes("OUT_OF_STOCK");
            const isCouponInvalid = error.message.includes("COUPON_INVALID");
            return {
              success: false,
              error: isOutOfStock
                ? "An item in your cart is no longer available in the requested quantity. Please update your cart."
                : isCouponInvalid
                  ? "Your coupon is no longer valid. Please review the discount and try again."
                  : "Failed to safely reserve your items. Please try again.",
              code: isOutOfStock ? "OUT_OF_STOCK" : isCouponInvalid ? "COUPON_INVALID" : "VALIDATION_FAILED",
            };
          }

          const persistedOrder = data?.[0];
          if (!persistedOrder) {
            return {
              success: false,
              error: "Order could not be persisted. Please try again.",
              code: "VALIDATION_FAILED",
            };
          }

          orderId = persistedOrder.order_id;
          orderNumber = persistedOrder.order_number;
          isDuplicateOrder = persistedOrder.is_duplicate;
          dbWriteSuccess = true;
        } else {
          // Checkout with simple products (no-variant) or mixed items:
          // Check idempotency first
          const { data: existingIdemp } = await adminSupabase
            .from("orders")
            .select("id, order_number, status, payment_method, payment_status, total_amount, razorpay_order_id")
            .eq("idempotency_key", input.idempotencyKey)
            .maybeSingle();

          if (existingIdemp) {
            orderId = existingIdemp.id;
            orderNumber = existingIdemp.order_number;
            isDuplicateOrder = true;
            dbWriteSuccess = true;
          } else {
            // Direct insertion of order
            const { data: insertedOrder, error: orderInsertErr } = await adminSupabase
              .from("orders")
              .insert({
                customer_id: customerId,
                status: "pending",
                payment_method: input.paymentMethod,
                payment_status: "pending",
                subtotal,
                shipping_charge: shippingCharge,
                discount_amount: discountAmount,
                total_amount: totalAmount,
                shipping_address: shippingAddressSnapshot,
                billing_address: shippingAddressSnapshot,
                coupon_code: validatedCouponCode,
                idempotency_key: input.idempotencyKey,
                notes: `${codHandlingFee > 0 ? `[COD handling fee: ₹${codHandlingFee}]` : ""}${guestAccountCreated ? " [guest_account_created: true]" : ""}`.trim() || null,
              })
              .select("id, order_number")
              .single();

            if (orderInsertErr || !insertedOrder) {
              console.error("Direct order insertion error:", orderInsertErr);
              return {
                success: false,
                error: "Failed to safely record your order. Please try again.",
                code: "VALIDATION_FAILED",
              };
            }

            orderId = insertedOrder.id;
            orderNumber = insertedOrder.order_number;
            dbWriteSuccess = true;

            // Insert line items
            const orderItemsPayload = verifiedItems.map((item) => ({
              order_id: orderId!,
              product_id: item.productId,
              variant_id: item.variantId || null,
              product_name_snapshot: item.title,
              variant_details_snapshot: [item.size, item.color].filter(Boolean).join(" / ") || "Standard",
              unit_price: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.lineSubtotal,
            }));

            const { error: itemsInsertErr } = await adminSupabase
              .from("order_items")
              .insert(orderItemsPayload);

            if (itemsInsertErr) {
              console.error("Direct order_items insertion error:", itemsInsertErr);
            }

            // Decrement variant and product stocks
            for (const item of verifiedItems) {
              if (item.variantId) {
                const { data: curVar } = await adminSupabase
                  .from("product_variants")
                  .select("stock_quantity")
                  .eq("id", item.variantId)
                  .single();
                if (curVar) {
                  await adminSupabase
                    .from("product_variants")
                    .update({ stock_quantity: Math.max(0, curVar.stock_quantity - item.quantity) })
                    .eq("id", item.variantId);
                }
              } else {
                try {
                  const { data: curProd } = await adminSupabase
                    .from("products")
                    .select("stock_quantity")
                    .eq("id", item.productId)
                    .maybeSingle();
                  if (curProd && curProd.stock_quantity !== undefined) {
                    await adminSupabase
                      .from("products")
                      .update({ stock_quantity: Math.max(0, (curProd.stock_quantity || 0) - item.quantity) })
                      .eq("id", item.productId);
                  }
                } catch {
                  // stock_quantity column might be pending on remote DB
                }
              }
            }
          }
        }

        if (isDuplicateOrder) {
          const { data: existingOrder, error: existingOrderError } = await adminSupabase
            .from("orders")
            .select("status, payment_method, payment_status, total_amount, razorpay_order_id")
            .eq("id", orderId)
            .maybeSingle();

          if (existingOrderError || !existingOrder) {
            return {
              success: false,
              error: "The previous checkout could not be retrieved. Please contact support.",
              code: "VALIDATION_FAILED",
            };
          }

          if (existingOrder.payment_method !== input.paymentMethod) {
            return {
              success: false,
              error: "This checkout request was already used with a different payment method. Please refresh checkout.",
              code: "VALIDATION_FAILED",
            };
          }

          if (existingOrder.status !== "pending" || existingOrder.payment_status !== "pending") {
            return {
              success: false,
              error: "This order is no longer awaiting payment. Please check your order history.",
              code: "VALIDATION_FAILED",
            };
          }

          totalAmount = Number(existingOrder.total_amount);
          existingRazorpayOrderId = existingOrder.razorpay_order_id || undefined;
        } else if (
          customerId &&
          !guestAccountCreated &&
          input.shippingAddress.saveAddress
        ) {
          await adminSupabase.from("addresses").insert({
            customer_id: customerId,
            full_name: input.shippingAddress.fullName,
            phone: input.shippingAddress.phone,
            address_line1: input.shippingAddress.addressLine1,
            address_line2: input.shippingAddress.addressLine2 || null,
            city: input.shippingAddress.city,
            state: input.shippingAddress.state,
            pincode: input.shippingAddress.pincode,
            address_type: input.shippingAddress.addressType || "home",
            is_default: false,
          });
        }
      } catch (dbErr) {
        console.error("Atomic database order creation error:", dbErr);
        return {
          success: false,
          error: "Failed to safely reserve your items. Please try again.",
          code: "VALIDATION_FAILED",
        };
      }
    }

    if (!dbWriteSuccess) {
      return {
        success: false,
        error: "Failed to persist order in the database. Please try again.",
        code: "VALIDATION_FAILED",
      };
    }

    // 12. Online Payment Gateway Integration (Razorpay Orders API)
    let razorpayOrderId: string | undefined;
    const amountPaise = Math.round(totalAmount * 100);

    if (input.paymentMethod === "razorpay") {
      razorpayOrderId = existingRazorpayOrderId;
      if (!razorpayOrderId) {
        try {
          const rzpOrder = await createRazorpayOrder({
            amountPaise,
            receipt: orderNumber!,
            notes: {
              order_number: orderNumber!,
              email: input.contact.email,
            },
          });

          if (!adminSupabase) {
            throw new Error("Database unavailable while saving Razorpay order ID");
          }

          const { data: savedOrder, error: saveError } = await adminSupabase
            .from("orders")
            .update({ razorpay_order_id: rzpOrder.id })
            .eq("id", orderId!)
            .is("razorpay_order_id", null)
            .select("razorpay_order_id")
            .maybeSingle();

          if (saveError) {
            throw saveError;
          }

          if (savedOrder?.razorpay_order_id) {
            razorpayOrderId = savedOrder.razorpay_order_id;
          } else {
            const { data: racedOrder, error: racedOrderError } = await adminSupabase
              .from("orders")
              .select("razorpay_order_id")
              .eq("id", orderId!)
              .maybeSingle();

            if (racedOrderError || !racedOrder?.razorpay_order_id) {
              throw new Error("Razorpay order ID could not be persisted");
            }
            razorpayOrderId = racedOrder.razorpay_order_id;
          }
        } catch (rzpErr) {
          console.error("Razorpay order creation error:", rzpErr);
          return {
            success: false,
            error: "Unable to initialize payment gateway. Please retry checkout; your reservation will expire automatically.",
            code: "GATEWAY_ERROR",
          };
        }
      }

      // Record in mock pending online orders store for automated cleanup testing
      if (!dbWriteSuccess) {
        for (const item of verifiedItems) {
          MOCK_ONLINE_PENDING_ORDERS.push({
            orderNumber: orderNumber!,
            variantId: item.variantId || null,
            productId: item.productId,
            quantity: item.quantity,
            createdAt: Date.now(),
            paymentMethod: "razorpay",
            status: "pending",
          });
        }
      }
    }

    // 12b. Cryptographic Access Token for Order Confirmation Access Control
    const accessToken = generateOrderAccessToken(orderNumber!);
    try {
      const cookieStore = await cookies();
      cookieStore.set(`velaash_order_access_${orderNumber!}`, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1800, // 30 minutes
        sameSite: "lax",
        path: "/",
      });
    } catch {
      // Outside request context (e.g. test environment)
    }

    // Save in shared MOCK_ORDERS_STORE for immediate retrieval across DB & offline modes
    if (!isDuplicateOrder) MOCK_ORDERS_STORE.set(orderNumber!, {
      id: orderId!,
      orderNumber: orderNumber!,
      status: "pending",
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      subtotal,
      shippingCharge,
      discountAmount,
      codHandlingFee,
      totalAmount,
      couponCode: validatedCouponCode,
      createdAt: new Date().toISOString(),
      shippingAddress: shippingAddressSnapshot,
      items: verifiedItems.map((item) => ({
        id: `item-${item.variantId || item.productId}`,
        productId: item.productId,
        variantId: item.variantId || "",
        title: item.title,
        size: item.size || "",
        color: item.color || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.lineSubtotal,
      })),
      razorpayOrderId,
      accountCreatedFromGuest: guestAccountCreated,
      accessLevel: "FULL",
    });

    // 12c. Transactional Email Dispatch for COD Orders
    if (input.paymentMethod === "cod" && !isDuplicateOrder) {
      try {
        const appUrl = (env.NEXT_PUBLIC_APP_URL || "https://velaash.in").replace(/\/$/, "");
        const orderViewUrl = `${appUrl}/order-confirmation/${orderNumber!}?token=${accessToken}`;
        await sendTransactionalEmail({
          to: input.contact.email,
          subject: `Order Confirmed: ${orderNumber!} - Velaash`,
          orderNumber: orderNumber!,
          react: React.createElement(OrderConfirmationEmail, {
            orderNumber: orderNumber!,
            customerName: input.shippingAddress.fullName,
            orderDate: new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            paymentMethod: "cod",
            paymentStatus: "pending",
            items: verifiedItems.map((it) => ({
              title: it.title,
              size: it.size || "",
              color: it.color || "",
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              lineSubtotal: it.lineSubtotal,
            })),
            subtotal,
            discountAmount,
            couponCode: validatedCouponCode,
            shippingCharge,
            codHandlingFee,
            totalAmount,
            shippingAddress: shippingAddressSnapshot,
            orderViewUrl,
            accountCreatedFromGuest: guestAccountCreated,
            supportEmail: siteSettings.storeProfile.email,
          }),

        });
      } catch (emailErr) {
        console.error(
          `[Email:Error] Failed to send order confirmation email for ${orderNumber!}:`,
          emailErr
        );
        // Non-blocking: Order creation must not fail if email fails
      }
    }

    return {
      success: true,
      orderNumber: orderNumber!,
      orderId: orderId!,
      totalAmount,
      paymentMethod: input.paymentMethod,
      razorpayOrderId,
      razorpayKeyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key_id",
      amountPaise,
      currency: "INR",
      accessToken,
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
    console.error("Order creation fatal error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while placing your order. Please try again.",
    };
  }
}
