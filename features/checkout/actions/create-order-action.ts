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


/**
 * In-memory idempotency cache to protect against rapid duplicate submissions
 * across both offline and online environments.
 */
const IDEMPOTENCY_STORE = new Map<
  string,
  {
    orderNumber: string;
    orderId: string;
    totalAmount: number;
    paymentMethod: "razorpay" | "cod";
    timestamp: number;
    razorpayOrderId?: string;
    razorpayKeyId?: string;
    amountPaise?: number;
    currency?: string;
  }
>();


export async function createOrderAction(
  rawInput: CreateOrderInput,
  options?: { authenticatedCustomerId?: string }
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

  // 3. Idempotency Check: Prevent duplicate order creation & double stock deduction
  if (input.idempotencyKey) {
    const cachedOrder = IDEMPOTENCY_STORE.get(input.idempotencyKey);
    if (cachedOrder) {
      return {
        success: true,
        orderNumber: cachedOrder.orderNumber,
        orderId: cachedOrder.orderId,
        totalAmount: cachedOrder.totalAmount,
        paymentMethod: cachedOrder.paymentMethod,
        razorpayOrderId: cachedOrder.razorpayOrderId,
        razorpayKeyId: cachedOrder.razorpayKeyId,
        amountPaise: cachedOrder.amountPaise,
        currency: cachedOrder.currency,
        isDuplicate: true,
      };
    }
  }

  try {
    // 3. Fetch current user session (optional - supports guest checkout)
    // Note: customerId is NEVER trusted from client input; extracted strictly from verified cookie session
    let customerId: string | null = options?.authenticatedCustomerId ?? null;
    let guestAccountCreated = false;
    if (!customerId) {
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
    }

    // 4. Fetch live site settings for shipping & COD rules
    const siteSettings = await getSiteSettings();

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
            const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            await sendTransactionalEmail({
              to: input.contact.email,
              subject: "Welcome to Velaash — Your Account is Ready",
              react: React.createElement(AccountWelcomeEmail, {
                customerName: input.shippingAddress.fullName,
                email: input.contact.email,
                loginUrl: `${appUrl}/account/login`,
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


    const variantIds = input.items.map((i) => i.variantId);

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
    }> | null = null;

    if (adminSupabase) {
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
              base_price,
              is_active
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

    interface VerifiedLineItem {
      productId: string;
      variantId: string;
      title: string;
      size: string;
      color: string;
      unitPrice: number;
      quantity: number;
      lineSubtotal: number;
      availableStock: number;
    }

    const verifiedItems: VerifiedLineItem[] = [];

    for (const requestedItem of input.items) {
      if (liveVariants) {
        const liveMatch = liveVariants.find((v) => v.id === requestedItem.variantId);
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
          variantId: liveMatch.id,
          title: liveMatch.products.name,
          size: liveMatch.size,
          color: liveMatch.color,
          unitPrice,
          quantity: requestedItem.quantity,
          lineSubtotal: unitPrice * requestedItem.quantity,
          availableStock: liveMatch.stock_quantity,
        });
      } else {
        return {
          success: false,
          error: "An item in your cart is no longer available in the store catalog.",
          code: "OUT_OF_STOCK",
        };
      }
    }

    // 6. Authoritative Subtotal Calculation
    const subtotal = verifiedItems.reduce((acc, item) => acc + item.lineSubtotal, 0);

    // 7. Authoritative Coupon Revalidation
    let discountAmount = 0;
    let validatedCouponCode: string | null = null;

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
    }

    // 8. Authoritative Shipping Fee Calculation
    const freeShippingThreshold = siteSettings.shippingPolicy.free_shipping_threshold;
    const isFreeShipping = subtotal >= freeShippingThreshold;
    const shippingCharge = isFreeShipping ? 0 : siteSettings.shippingPolicy.standard_shipping_fee;

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
    const totalAmount = Math.max(0, subtotal - discountAmount) + shippingCharge + codHandlingFee;

    // 11. Generate Order Number & Record Order
    let orderNumber: string;
    let orderId: string;

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

    // Attempt Supabase database write
    let dbWriteSuccess = false;

    if (liveVariants && adminSupabase) {
      try {
        let insertAttempts = 0;
        let orderData: { id: string; order_number: string } | null = null;

        while (insertAttempts < 5 && !dbWriteSuccess) {
          insertAttempts++;
          const { data, error: orderError } = await adminSupabase
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
              notes: `[idempotency_key: ${input.idempotencyKey}]${codHandlingFee > 0 ? ` [COD handling fee: ₹${codHandlingFee}]` : ""}${guestAccountCreated ? " [guest_account_created: true]" : ""}`,
            })
            .select("id, order_number")
            .single();

          if (orderError) {
            console.warn(
              `[OrderInsert:Attempt ${insertAttempts}] Insert failed: ${orderError.message} (code: ${orderError.code})`
            );
            if (orderError.code === "23505" && orderError.message?.includes("orders_order_number_key")) {
              // Sequence was behind seed data, retry with next generated order number
              continue;
            }
            break;
          } else if (data) {
            orderData = data;
            orderId = orderData.id;
            orderNumber = orderData.order_number;
            dbWriteSuccess = true;
          }
        }

        if (dbWriteSuccess && orderData) {

          // Insert order items
          const orderItemsRows = verifiedItems.map((item) => ({
            order_id: orderId,
            product_id: item.productId,
            variant_id: item.variantId,
            product_name_snapshot: item.title,
            variant_details_snapshot: {
              size: item.size,
              color: item.color,
            },
            unit_price: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.lineSubtotal,
          }));

          await adminSupabase.from("order_items").insert(orderItemsRows);

          // Deduct stock for each variant in database
          for (const item of verifiedItems) {
            const newStock = Math.max(0, item.availableStock - item.quantity);

            await adminSupabase
              .from("product_variants")
              .update({
                stock_quantity: newStock,
              })
              .eq("id", item.variantId);
          }

          // Increment coupon usage_count if a valid coupon was applied
          if (validatedCouponCode) {
            const { data: cRow } = await adminSupabase
              .from("coupons")
              .select("id, usage_count")
              .eq("code", validatedCouponCode)
              .maybeSingle();

            if (cRow) {
              await adminSupabase
                .from("coupons")
                .update({
                  usage_count: (cRow.usage_count || 0) + 1,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", cRow.id);
            }
          }

          // If customer asked to save address and is an existing customer (skip if newly created guest account to prevent duplicate address insertion)
          if (customerId && !guestAccountCreated && input.shippingAddress.saveAddress) {
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
        }
      } catch (dbErr) {
        console.error("Database order insertion error:", dbErr);
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
      try {
        const rzpOrder = await createRazorpayOrder({
          amountPaise,
          receipt: orderNumber!,
          notes: {
            order_number: orderNumber!,
            email: input.contact.email,
          },
        });
        razorpayOrderId = rzpOrder.id;

        // If database write succeeded, record razorpay_order_id on orders row
        if (dbWriteSuccess && adminSupabase) {
          await adminSupabase
            .from("orders")
            .update({ razorpay_order_id: razorpayOrderId })
            .eq("id", orderId!);
        }
      } catch (rzpErr) {
        console.error("Razorpay order creation error:", rzpErr);
        return {
          success: false,
          error: "Unable to initialize payment gateway. Please try again or choose Cash on Delivery.",
          code: "GATEWAY_ERROR",
        };
      }

      // Record in mock pending online orders store for automated cleanup testing
      if (!dbWriteSuccess) {
        for (const item of verifiedItems) {
          MOCK_ONLINE_PENDING_ORDERS.push({
            orderNumber: orderNumber!,
            variantId: item.variantId,
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
    MOCK_ORDERS_STORE.set(orderNumber!, {
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
        id: `item-${item.variantId}`,
        productId: item.productId,
        variantId: item.variantId,
        title: item.title,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.lineSubtotal,
      })),
      accountCreatedFromGuest: guestAccountCreated,
      accessLevel: "FULL",
    });

    // 12c. Transactional Email Dispatch for COD Orders
    if (input.paymentMethod === "cod") {
      try {
        const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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
              size: it.size,
              color: it.color,
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

    // 13. Save in idempotency store to prevent duplicate orders
    IDEMPOTENCY_STORE.set(input.idempotencyKey, {
      orderNumber: orderNumber!,
      orderId: orderId!,
      totalAmount,
      paymentMethod: input.paymentMethod,
      razorpayOrderId,
      razorpayKeyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder_key_id",
      amountPaise,
      currency: "INR",
      timestamp: Date.now(),
    });

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
