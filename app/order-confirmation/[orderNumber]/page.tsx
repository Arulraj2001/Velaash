import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import {
  CheckCircle2,
  Package,
  Truck,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ShoppingBag,
  UserCheck,
  CreditCard,
  Banknote,
  HelpCircle,
} from "lucide-react";

import { getOrderByNumber } from "@/features/checkout/queries/get-order-by-number";

export const metadata: Metadata = {
  title: "Order Confirmed | Velaash",
  description: "Thank you for your order with Velaash.",
  robots: {
    index: false,
    follow: false,
  },
};

interface OrderConfirmationPageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ token?: string }>;
}

/**
 * FULL ORDER CONFIRMATION PAGE WITH PII ACCESS CONTROL & PRIVACY SHIELD
 * ---------------------------------------------------------------------
 * ACCESS CONTROL PHILOSOPHY:
 * 1. Immediate Checkout Visitors (First Visit):
 *    When a customer completes checkout or Razorpay payment, the server issues a short-lived
 *    tamper-proof session token via an HTTP-only cookie (`velaash_order_access_${orderNumber}`)
 *    and a URL query param fallback (`?token=...`). The customer sees FULL order details,
 *    including their complete delivery address and phone number.
 *
 * 2. Logged-in Order Owners:
 *    Authenticated Supabase users whose account matches the order always receive FULL ACCESS.
 *
 * 3. Later Direct / Unauthenticated Visits:
 *    If an unauthenticated visitor navigates directly to `/order-confirmation/[orderNumber]`
 *    without the session token (e.g. via browser history or guessable order URL), the server
 *    enforces MASKED ACCESS:
 *    - Street address is masked ("••••••••••••••••")
 *    - Phone number is masked ("•••••• 3210")
 *    - Email is masked ("a••••••@gmail.com")
 *    - Destination City, State, and Pincode remain visible so the customer knows where it is headed.
 *    - Order items, financial summary, and fulfillment status are visible without revealing PII.
 */
export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderConfirmationPageProps) {
  const { orderNumber } = await params;
  const { token } = await searchParams;

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(`velaash_order_access_${orderNumber}`)?.value;

  const order = await getOrderByNumber(orderNumber, {
    accessToken: token,
    cookieToken,
  });

  if (!order) {
    notFound();
  }

  // Format order date
  const orderDateFormatted = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Calculate estimated delivery window (5–7 business days from order placement)
  const estDeliveryMin = new Date(order.createdAt);
  estDeliveryMin.setDate(estDeliveryMin.getDate() + 5);
  const estDeliveryMax = new Date(order.createdAt);
  estDeliveryMax.setDate(estDeliveryMax.getDate() + 7);

  const deliveryWindowFormatted = `${estDeliveryMin.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })} – ${estDeliveryMax.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  const isPaid = order.paymentStatus === "paid";
  const isCod = order.paymentMethod === "cod";

  return (
    <main className="min-h-screen bg-brand-cream/30 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Top Header Card */}
        <div className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-10 shadow-sm text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="h-9 w-9 text-emerald-600 stroke-[1.75]" />
          </div>

          <span className="text-xs font-semibold uppercase tracking-widest text-brand-accent">
            Order Confirmed
          </span>

          <h1 className="font-heading text-2xl sm:text-4xl font-medium text-brand-dark mt-2 tracking-tight">
            Thank you for your order, {order.shippingAddress.fullName.split(" ")[0]}!
          </h1>

          <p className="mt-2 text-sm text-brand-dark/70 max-w-xl mx-auto leading-relaxed">
            Your order has been registered and is being prepared for dispatch. We will send tracking
            updates to{" "}
            <span className="font-medium text-brand-dark">{order.shippingAddress.email}</span>.
          </p>

          {/* Reference Box */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 rounded-xl bg-brand-cream/60 border border-brand-border/60 px-5 py-3 text-xs">
            <div>
              <span className="text-brand-dark/50 block text-[11px] uppercase tracking-wider">
                Order Reference
              </span>
              <span className="font-heading text-base font-bold text-brand-dark tracking-wider select-all">
                {order.orderNumber}
              </span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-brand-border" />
            <div>
              <span className="text-brand-dark/50 block text-[11px] uppercase tracking-wider">
                Order Date
              </span>
              <span className="font-medium text-brand-dark">{orderDateFormatted}</span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-brand-border" />
            <div>
              <span className="text-brand-dark/50 block text-[11px] uppercase tracking-wider">
                Payment Method
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-brand-dark">
                {isCod ? (
                  <>
                    <Banknote className="h-3.5 w-3.5 text-amber-600" />
                    Cash on Delivery
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                    Online (Razorpay)
                  </>
                )}
              </span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-brand-border" />
            <div>
              <span className="text-brand-dark/50 block text-[11px] uppercase tracking-wider">
                Payment Status
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  isPaid
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {isPaid ? "Paid" : "Payable on Delivery"}
              </span>
            </div>
          </div>

          {/* Guest Account Created Banner */}
          {order.accountCreatedFromGuest && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-left max-w-xl mx-auto flex items-start gap-3">
              <UserCheck className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950">
                <p className="font-semibold text-emerald-900">
                  Velaash Account Created Successfully
                </p>
                <p className="mt-1 text-emerald-800 leading-relaxed">
                  As requested during checkout, we have provisioned your customer account for{" "}
                  <strong>{order.shippingAddress.email}</strong>. Please check your inbox for an
                  invitation email with a link to set your password and access your order history
                  anytime.
                </p>
              </div>
            </div>
          )}

          {/* Privacy Notice Banner for Masked Visits */}
          {order.accessLevel === "MASKED" && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-left max-w-xl mx-auto flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950">
                <p className="font-semibold text-amber-900">
                  Privacy Shield Active (Masked Details)
                </p>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  For your security and privacy on direct unauthenticated visits, sensitive street
                  address and contact details are masked. If you are the owner of this order,
                  please log in to your account to view complete information.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Two-Column Details Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Progress Roadmap & Order Items */}
          <div className="lg:col-span-7 space-y-6">
            {/* What Happens Next Roadmap */}
            <div className="rounded-2xl border border-brand-border/80 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-dark flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-gold" />
                <span>What Happens Next?</span>
              </h2>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                {/* Step 1 */}
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-2 sm:justify-start justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                      ✓
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">Confirmed</span>
                  </div>
                  <p className="text-[11px] text-brand-dark/60 leading-tight">
                    Order registered in our system.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-2 sm:justify-start justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold/20 text-brand-dark text-xs font-bold border border-brand-gold/50">
                      2
                    </span>
                    <span className="text-xs font-semibold text-brand-dark">Quality Check</span>
                  </div>
                  <p className="text-[11px] text-brand-dark/60 leading-tight">
                    Your order is checked and prepared for dispatch.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-2 sm:justify-start justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-cream text-brand-dark/60 text-xs font-bold border border-brand-border">
                      3
                    </span>
                    <span className="text-xs font-semibold text-brand-dark/70">Dispatched</span>
                  </div>
                  <p className="text-[11px] text-brand-dark/60 leading-tight">
                    Handed to courier with tracking details.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 mb-2 sm:justify-start justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-cream text-brand-dark/60 text-xs font-bold border border-brand-border">
                      4
                    </span>
                    <span className="text-xs font-semibold text-brand-dark/70">Delivered</span>
                  </div>
                  <p className="text-[11px] text-brand-dark/60 leading-tight">
                    Safe delivery to your doorstep.
                  </p>
                </div>
              </div>
            </div>

            {/* Itemized Order List */}
            <div className="rounded-2xl border border-brand-border/80 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-dark flex items-center justify-between pb-4 border-b border-brand-border/60">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-brand-gold" />
                  <span>Items Ordered ({order.items.length})</span>
                </span>
                <span className="text-xs font-normal text-brand-dark/60 lowercase">
                  review your selections
                </span>
              </h2>


              <div className="divide-y divide-brand-border/60">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-4 flex items-center gap-4">
                    {/* Item Thumbnail / Placeholder */}
                    <div className="h-16 w-16 shrink-0 rounded-lg bg-brand-cream/60 border border-brand-border/60 flex items-center justify-center text-brand-dark/40 overflow-hidden">
                      <ShoppingBag className="h-6 w-6" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-brand-dark truncate">{item.title}</h3>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-brand-dark/60">
                        <span className="rounded bg-brand-cream/70 px-2 py-0.5 border border-brand-border/50">
                          Size: {item.size}
                        </span>
                        <span className="rounded bg-brand-cream/70 px-2 py-0.5 border border-brand-border/50">
                          Color: {item.color}
                        </span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <span className="text-sm font-semibold text-brand-dark">
                        ₹{item.subtotal.toLocaleString("en-IN")}
                      </span>
                      {item.quantity > 1 && (
                        <span className="block text-[11px] text-brand-dark/50">
                          ₹{item.unitPrice.toLocaleString("en-IN")} each
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Price Breakdown & Delivery Address */}
          <div className="lg:col-span-5 space-y-6">
            {/* Price Breakdown */}
            <div className="rounded-2xl border border-brand-border/80 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-dark mb-4">
                Payment Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-brand-dark/70">
                  <span>Bag Subtotal</span>
                  <span className="font-medium text-brand-dark">
                    ₹{order.subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                    <span className="font-medium">
                      -₹{order.discountAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-brand-dark/70">
                  <span>Shipping & Delivery</span>
                  <span className="font-medium text-brand-dark">
                    {order.shippingCharge === 0
                      ? "FREE"
                      : `₹${order.shippingCharge.toLocaleString("en-IN")}`}
                  </span>
                </div>

                {order.codHandlingFee && order.codHandlingFee > 0 ? (
                  <div className="flex justify-between text-brand-dark/70">
                    <span>COD Convenience Fee</span>
                    <span className="font-medium text-brand-dark">
                      ₹{order.codHandlingFee.toLocaleString("en-IN")}
                    </span>
                  </div>
                ) : null}

                <div className="pt-3 border-t border-brand-border/80 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-brand-dark">Total Paid / Payable</span>
                    <span className="block text-[11px] text-brand-dark/50 font-normal">
                      Includes all applicable GST taxes
                    </span>
                  </div>
                  <span className="font-heading text-xl font-bold text-brand-accent">
                    ₹{order.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Destination & Estimated Window */}
            <div className="rounded-2xl border border-brand-border/80 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-dark flex items-center gap-2">
                  <Truck className="h-4 w-4 text-brand-gold" />
                  <span>Delivery Destination</span>
                </h2>
                {order.accessLevel === "FULL" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Session
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    <ShieldAlert className="h-3 w-3" />
                    Masked (Direct Visit)
                  </span>
                )}
              </div>

              {/* Address content */}
              <div className="text-xs text-brand-dark/70 space-y-1 leading-relaxed">
                <p className="font-semibold text-brand-dark text-sm">
                  {order.shippingAddress.fullName}
                </p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                  <span className="font-medium text-brand-dark">
                    {order.shippingAddress.pincode}
                  </span>
                </p>
                <p className="pt-1 text-brand-dark/60">
                  Contact Phone:{" "}
                  <span className="font-medium text-brand-dark">
                    {order.shippingAddress.phone}
                  </span>
                </p>
              </div>

              {/* Delivery Window Highlight */}
              <div className="rounded-xl bg-brand-cream/60 border border-brand-border/60 p-3 flex items-center gap-3">
                <Clock className="h-5 w-5 text-brand-accent shrink-0" />
                <div>
                  <span className="text-[11px] text-brand-dark/60 block uppercase tracking-wider">
                    Estimated Delivery Window
                  </span>
                  <span className="text-xs font-semibold text-brand-dark">
                    {deliveryWindowFormatted} (5–7 Business Days)
                  </span>
                </div>
              </div>
            </div>

            {/* Assistance Card */}
            <div className="rounded-2xl border border-brand-border/60 bg-brand-cream/30 p-5 text-xs text-brand-dark/70 space-y-2">
              <h3 className="font-semibold text-brand-dark flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-brand-gold" />
                Need help with this order?
              </h3>
              <p>
                Contact our customer support team with your order reference{" "}
                <strong className="text-brand-dark">{order.orderNumber}</strong> at{" "}
                <a
                  href="mailto:support@velaash.com"
                  className="font-medium text-brand-accent underline underline-offset-2"
                >
                  support@velaash.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-none bg-brand-dark px-8 py-3 text-xs font-semibold uppercase tracking-wider text-brand-cream transition-all duration-300 hover:bg-brand-accent hover:shadow-md"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/account"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-none border border-brand-border/80 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-cream/50"
          >
            <ShoppingBag className="h-4 w-4 text-brand-dark/60" />
            <span>View My Account</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
