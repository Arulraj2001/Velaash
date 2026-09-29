"use client";

/**
 * ============================================================================
 * VELAASH CHECKOUT VIEW
 * ============================================================================
 * LAYOUT DECISION RATIONALE:
 * We implemented a Single-Page Progressive Checkout layout featuring dedicated,
 * sequential sections (Contact Info -> Shipping Address -> Delivery Method ->
 * Payment Method) paired with a persistent, sticky Order Review sidebar.
 *
 * Why this layout is optimal:
 * 1. Reliability & State Preservation: Unlike multi-route wizard flows, a
 *    single-page layout eliminates state synchronization loss across page transitions
 *    and prevents navigation-state bugs.
 * 2. Reduced Abandonment: Customers can see their order breakdown, shipping threshold,
 *    and final total continuously without hidden surprises.
 * 3. Atomic Validation: React Hook Form can validate all fields atomically before
 *    submission, ensuring invalid Indian PIN codes or mobile numbers are flagged
 *    immediately inline.
 * ============================================================================
 */

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ShoppingBag, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/features/cart/store/cart-store";
import { calculateCartTotals } from "@/features/cart/utils/pricing";
import { ContactInfoStep } from "./contact-info-step";
import { ShippingAddressStep } from "./shipping-address-step";
import { ShippingMethodStep } from "./shipping-method-step";
import { PaymentMethodStep } from "./payment-method-step";
import { OrderReviewSidebar } from "./order-review-sidebar";
import { createOrderAction } from "../actions/create-order-action";
import { verifyRazorpayPaymentAction } from "../actions/verify-razorpay-payment-action";
import {
  CheckoutFormSchema,
  type CheckoutFormData,
  type SavedCustomerAddress,
} from "../types";
import type { SiteSettingsData } from "@/features/settings/types";
import type { Tables } from "@/types/database.types";

interface CheckoutViewProps {
  siteSettings: SiteSettingsData;
  currentUser: {
    id: string;
    email?: string;
  } | null;
  customerProfile: Tables<"customers"> | null;
  savedAddresses: SavedCustomerAddress[];
}

const emptySubscribe = () => () => {};

export function CheckoutView({
  siteSettings,
  currentUser,
  customerProfile,
  savedAddresses,
}: CheckoutViewProps) {
  const router = useRouter();

  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const items = useCartStore((state) => state.items);
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const clearCart = useCartStore((state) => state.clearCart);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Pending online payment state for retries without duplicate order creation
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<{
    orderNumber: string;
    razorpayOrderId: string;
    razorpayKeyId: string;
    amountPaise: number;
  } | null>(null);

  // Initialize idempotency key once per checkout session
  const [idempotencyKey] = useState(() => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  });

  const defaultSavedAddress = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(CheckoutFormSchema),
    defaultValues: {
      contact: {
        email: currentUser?.email || "",
        phone: customerProfile?.phone || "",
        createAccount: false,
      },
      shippingAddress: {
        fullName: defaultSavedAddress?.fullName || customerProfile?.full_name || "",
        phone: defaultSavedAddress?.phone || customerProfile?.phone || "",
        addressLine1: defaultSavedAddress?.addressLine1 || "",
        addressLine2: defaultSavedAddress?.addressLine2 || "",
        city: defaultSavedAddress?.city || "",
        state: defaultSavedAddress?.state || "",
        pincode: defaultSavedAddress?.pincode || "",
        addressType: defaultSavedAddress?.addressType || "home",
        saveAddress: false,
      },
      shippingMethod: "standard",
      paymentMethod: "razorpay",
      appliedCouponCode: appliedCoupon?.code || null,
      idempotencyKey,
    },
  });

  const selectedPaymentMethod = useWatch({ control, name: "paymentMethod" }) || "razorpay";

  // Calculate live preview totals
  const pricingCalculation = calculateCartTotals({
    items,
    appliedCoupon,
    shippingPolicy: siteSettings.shippingPolicy,
  });

  const { subtotal, discount, shippingFee, isFreeShipping } = pricingCalculation;
  const codFee =
    selectedPaymentMethod === "cod" ? siteSettings.paymentSettings.cod_handling_fee : 0;
  const totalAmount = Math.max(0, subtotal - discount) + shippingFee + codFee;

  // 1. Access Rule: Redirect to /cart if empty or has unavailable items
  useEffect(() => {
    if (!isHydrated) return;

    if (items.length === 0) {
      router.replace("/cart");
      return;
    }

    const hasUnavailable = items.some((i) => i.isAvailable === false);
    if (hasUnavailable) {
      router.replace("/cart");
    }
  }, [isHydrated, items, router]);

  /**
   * Opens the Razorpay Checkout modal with pre-configured parameters.
   * Handles modal dismissal and cryptographic payment verification gracefully.
   */
  const openRazorpayCheckout = (
    orderInfo: {
      orderNumber: string;
      razorpayOrderId: string;
      razorpayKeyId: string;
      amountPaise: number;
    },
    contactData: { email: string; phone: string; fullName: string }
  ) => {
    if (typeof window === "undefined") return;

    const launchWidget = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const RazorpayConstructor = (window as any).Razorpay;
      if (!RazorpayConstructor) {
        setSubmissionError(
          "Payment gateway widget could not be loaded. Please check your internet connection or choose Cash on Delivery."
        );
        setIsSubmitting(false);
        return;
      }

      const options = {
        key: orderInfo.razorpayKeyId,
        amount: orderInfo.amountPaise,
        currency: "INR",
        name: "Velaash",
        description: `Order #${orderInfo.orderNumber}`,
        order_id: orderInfo.razorpayOrderId,
        prefill: {
          name: contactData.fullName,
          email: contactData.email,
          contact: contactData.phone,
        },
        theme: {
          color: "#8E3A59", // Velaash primary maroon
        },
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          setIsSubmitting(true);
          setSubmissionError(null);
          try {
            const verification = await verifyRazorpayPaymentAction({
              orderNumber: orderInfo.orderNumber,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verification.success) {
              clearCart();
              const redirectUrl = `/order-confirmation/${orderInfo.orderNumber}${
                verification.accessToken ? `?token=${verification.accessToken}` : ""
              }`;
              router.push(redirectUrl);
            } else {

              setSubmissionError(
                verification.error ||
                  `Payment verification failed. If your account was debited, please contact support with reference "${orderInfo.orderNumber}".`
              );
              setIsSubmitting(false);
            }
          } catch (err) {
            console.error("Payment verification client error:", err);
            setSubmissionError(
              `Payment verification timed out. If your account was debited, please contact support@velaash.com with order reference "${orderInfo.orderNumber}".`
            );
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            // Customer closed the popup without paying — do not break state or create duplicate orders
            setIsSubmitting(false);
            setPendingPaymentOrder(orderInfo);
          },
        },
      };

      const rzpInstance = new RazorpayConstructor(options);
      rzpInstance.open();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Razorpay) {
      launchWidget();
    } else {
      // Dynamic fallback script loader
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = launchWidget;
      script.onerror = () => {
        setSubmissionError(
          "Failed to load payment gateway script. Please check your internet connection or choose Cash on Delivery."
        );
        setIsSubmitting(false);
      };
      document.body.appendChild(script);
    }
  };

  // Form submission handler
  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // If customer is retrying payment on an existing pending online order without modification
      if (
        data.paymentMethod === "razorpay" &&
        pendingPaymentOrder &&
        !submissionError
      ) {
        openRazorpayCheckout(
          pendingPaymentOrder,
          {
            email: data.contact.email,
            phone: data.contact.phone,
            fullName: data.shippingAddress.fullName,
          }
        );
        return;
      }

      const orderPayload = {
        contact: data.contact,
        shippingAddress: data.shippingAddress,
        paymentMethod: data.paymentMethod,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        couponCode: appliedCoupon?.code || null,
        idempotencyKey,
      };

      const result = await createOrderAction(orderPayload);

      if (!result.success) {
        setSubmissionError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Online Payment Flow (Razorpay)
      if (data.paymentMethod === "razorpay") {
        if (!result.razorpayOrderId || !result.razorpayKeyId || !result.amountPaise) {
          setSubmissionError("Payment gateway configuration missing. Please choose Cash on Delivery.");
          setIsSubmitting(false);
          return;
        }

        const onlineOrderInfo = {
          orderNumber: result.orderNumber,
          razorpayOrderId: result.razorpayOrderId,
          razorpayKeyId: result.razorpayKeyId,
          amountPaise: result.amountPaise,
        };

        setPendingPaymentOrder(onlineOrderInfo);

        openRazorpayCheckout(
          onlineOrderInfo,
          {
            email: data.contact.email,
            phone: data.contact.phone,
            fullName: data.shippingAddress.fullName,
          }
        );
        return;
      }

      // Cash on Delivery Flow: Clear cart & navigate to confirmation
      clearCart();
      const redirectUrl = `/order-confirmation/${result.orderNumber}${
        result.accessToken ? `?token=${result.accessToken}` : ""
      }`;
      router.push(redirectUrl);

    } catch (err) {
      console.error("Order submission client error:", err);
      setSubmissionError("An unexpected error occurred while placing your order. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Hydration skeleton
  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-8 w-48 bg-brand-cream/60 animate-pulse rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <div className="h-40 bg-brand-cream/40 animate-pulse rounded-lg" />
            <div className="h-64 bg-brand-cream/40 animate-pulse rounded-lg" />
          </div>
          <div className="lg:col-span-5">
            <div className="h-80 bg-brand-cream/40 animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty during render
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-cream">
          <ShoppingBag className="h-8 w-8 text-brand-dark/50" />
        </div>
        <h1 className="font-heading text-xl font-medium text-brand-dark">Your bag is empty</h1>
        <p className="mt-2 text-xs text-brand-dark/60">Redirecting to cart...</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-dark underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Checkout Page Header */}
      <div className="mb-6 sm:mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-brand-border/60 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-normal text-brand-dark tracking-tight">
            Checkout
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-brand-dark/60">
            Complete your order with secure shipping and payment
          </p>
        </div>

        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-dark hover:text-brand-accent transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Cart</span>
        </Link>
      </div>

      {/* Global Submission Error Alert */}
      {submissionError && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg bg-red-50 p-4 text-xs text-red-900 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to place order</p>
            <p className="mt-0.5">{submissionError}</p>
          </div>
        </div>
      )}

      {/* Incomplete Online Payment Retry Notice */}
      {pendingPaymentOrder && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <div>
            <p className="font-semibold text-amber-900">
              Payment was not completed for Order #{pendingPaymentOrder.orderNumber}
            </p>
            <p className="mt-0.5 text-amber-800">
              You can retry payment on this order now, or update your checkout details below.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              openRazorpayCheckout(
                pendingPaymentOrder,
                {
                  email: getValues("contact.email"),
                  phone: getValues("contact.phone"),
                  fullName: getValues("shippingAddress.fullName"),
                }
              )
            }
            className="inline-flex items-center gap-1.5 rounded bg-amber-900 px-3 py-1.5 font-medium text-white hover:bg-amber-950 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Payment</span>
          </button>
        </div>
      )}

      {/* Main Checkout Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: Progressive Checkout Steps */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Step 1: Contact Information */}
            <ContactInfoStep
              register={register}
              errors={errors}
              isLoggedIn={Boolean(currentUser)}
              customerName={customerProfile?.full_name}
            />

            {/* Step 2: Shipping Address */}
            <ShippingAddressStep
              register={register}
              errors={errors}
              setValue={setValue}
              savedAddresses={savedAddresses}
              isLoggedIn={Boolean(currentUser)}
            />

            {/* Step 3: Delivery Method */}
            <ShippingMethodStep
              isFreeShipping={isFreeShipping}
              shippingFee={shippingFee}
            />

            {/* Step 4: Payment Method */}
            <PaymentMethodStep
              selectedPaymentMethod={selectedPaymentMethod}
              onChangePaymentMethod={(method) => setValue("paymentMethod", method, { shouldValidate: true })}
              subtotal={subtotal}
              codEnabled={siteSettings.paymentSettings.cod_enabled}
              codMaxOrderValue={siteSettings.paymentSettings.cod_max_order_value}
              codHandlingFee={siteSettings.paymentSettings.cod_handling_fee}
            />
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
            <OrderReviewSidebar
              items={items}
              appliedCoupon={appliedCoupon}
              subtotal={subtotal}
              discount={discount}
              shippingFee={shippingFee}
              isFreeShipping={isFreeShipping}
              codFee={codFee}
              paymentMethod={selectedPaymentMethod}
              totalAmount={totalAmount}
              isSubmitting={isSubmitting}
              returnWindowDays={siteSettings.returnsPolicy.return_window_days}
            />
          </div>
        </div>
      </form>

      {/* Load Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </div>
  );
}
