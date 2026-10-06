import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import {
  getCustomerOrderDetail,
  OrderStatusBadge,
  OrderTimeline,
  CourierTrackingBanner,
  CancelOrderButton,
  CancellationRefundCard,
} from "@/features/orders";
import { Button, Badge } from "@/components/ui";
import { getSiteSettings, getStoreContact } from "@/features/settings";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Banknote,
  MessageCircle,
  Mail,
  Phone,
  Tag,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Order Details | Velaash",
  description: "View full details and live tracking for your Velaash apparel order.",
  robots: {
    index: false,
    follow: false,
  },
};

interface OrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function CustomerOrderDetailPage(props: OrderDetailPageProps) {
  const authData = await getCurrentUser();

  const { orderNumber } = await props.params;

  if (!authData || !authData.user) {
    redirect(`/account/login?returnUrl=/account/orders/${orderNumber}`);
  }

  const { user } = authData;

  // Retrieve order details with strict ownership verification
  // Returns null if not found OR if caller is not the owner (enforcing 404 without leakage)
  const order = await getCustomerOrderDetail(orderNumber, user.id, user.email);

  if (!order) {
    notFound();
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const { storeProfile } = await getSiteSettings();
  const { whatsappNumber } = getStoreContact(storeProfile);
  const contactEmail = storeProfile.email;
  const isCod = order.paymentMethod === "cod";
  const isPaid = order.paymentStatus === "paid";

  // Pre-filled WhatsApp message
  const whatsappMessage = encodeURIComponent(
    `Hi Velaash, I need assistance regarding my order #${order.orderNumber}.`
  );
  const whatsappDigits = whatsappNumber.replace(/\D/g, "");
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${whatsappMessage}`
    : "/contact";

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-brand-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all orders
        </Link>

        {order.canCancel && (
          <CancelOrderButton
            orderNumber={order.orderNumber}
            totalAmount={order.totalAmount}
            paymentMethod={order.paymentMethod}
            paymentStatus={order.paymentStatus}
          />
        )}
      </div>

      {/* Prominent Cancellation & Refund Card (if order is cancelled) */}
      {order.status === "cancelled" && (
        <CancellationRefundCard
          orderNumber={order.orderNumber}
          totalAmount={order.totalAmount}
          paymentMethod={order.paymentMethod}
          paymentStatus={order.paymentStatus}
          refundStatus={order.refundStatus}
          refundAmount={order.refundAmount}
          refundArn={order.refundArn}
          razorpayRefundId={order.razorpayRefundId}
          refundedAt={order.refundedAt}
          whatsappUrl={whatsappUrl}
        />
      )}

      {/* Main Order Header Card */}
      <div className="rounded-2xl border border-brand-border/70 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/60 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xl sm:text-2xl font-bold text-brand-dark">
                #{order.orderNumber}
              </span>
              <OrderStatusBadge status={order.status} size="md" />
            </div>
            <p className="text-xs text-brand-muted font-sans">
              Placed on {formattedDate}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-[11px] uppercase tracking-wider text-brand-muted font-medium">
              Order Total
            </p>
            <p className="font-heading text-2xl font-semibold text-brand-dark">
              ₹{order.totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted">
            Fulfillment Journey
          </h3>
          <OrderTimeline
            currentStatus={order.status}
            history={order.statusHistory}
            createdAt={order.createdAt}
            refundStatus={order.refundStatus}
            refundAmount={order.refundAmount}
            refundedAt={order.refundedAt}
            paymentMethod={order.paymentMethod}
            paymentStatus={order.paymentStatus}
          />
        </div>

        {/* Courier Tracking Details Banner */}
        {order.trackingNumber && (
          <CourierTrackingBanner
            courierName={order.courierName}
            trackingNumber={order.trackingNumber}
            isShiprocketManaged={!!order.shiprocketOrderId}
          />
        )}
      </div>

      {/* Two Column Layout: Items (Left) & Summary / Shipping (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-brand-border/70 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-brand-border/60 pb-4">
              <h3 className="font-heading text-lg font-semibold text-brand-dark">
                Items in Order ({order.items.length})
              </h3>
              <Badge variant="subtle" size="sm">
                Authentic Craftsmanship
              </Badge>
            </div>

            <div className="divide-y divide-brand-border/60">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-start gap-4"
                >
                  <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-brand-cream border border-brand-border/60">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover object-top"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-brand-subtle">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-xs font-semibold text-brand-dark leading-snug">
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-brand-muted">
                      <span>Size: <strong>{item.size}</strong></span>
                      <span>•</span>
                      <span>Color: <strong>{item.color}</strong></span>
                    </div>

                    {item.sku && (
                      <p className="text-[11px] font-mono text-brand-muted">
                        SKU: {item.sku}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-brand-muted">
                        Qty: <strong>{item.quantity}</strong> × ₹{item.unitPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-semibold text-brand-dark">
                        ₹{item.subtotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Need Help Card */}
          <div className="rounded-2xl border border-brand-border/70 bg-gradient-to-br from-brand-light/20 to-white p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light/50 text-brand-accent">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-heading text-base font-semibold text-brand-dark">
                  Need Help with this Order?
                </h4>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Have questions about size alteration, fabric care, or delivery timing? Our customer support team is directly reachable via WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  leftIcon={<MessageCircle className="h-4 w-4" />}
                >
                  Chat on WhatsApp
                </Button>
              </a>

              <a
                href={`mailto:${contactEmail}?subject=Inquiry%20regarding%20Order%20${order.orderNumber}`}
                className="flex-1"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  leftIcon={<Mail className="h-4 w-4" />}
                >
                  Email Support
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Address & Payment Summary */}
        <div className="space-y-6">
          {/* Shipping Address Card */}
          <div className="rounded-2xl border border-brand-border/70 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-brand-dark font-medium border-b border-brand-border/60 pb-3">
              <MapPin className="h-4 w-4 text-brand-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Delivery Destination
              </h3>
            </div>

            <div className="space-y-1 text-xs text-brand-muted font-sans leading-relaxed">
              <p className="font-semibold text-brand-dark text-sm">
                {order.shippingAddress.fullName}
              </p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p>{order.shippingAddress.addressLine2}</p>
              )}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} –{" "}
                <span className="font-mono font-medium">{order.shippingAddress.pincode}</span>
              </p>

              <div className="pt-2 border-t border-brand-border/40 mt-3 space-y-1 text-[11px] text-brand-muted">
                <p className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-brand-muted" />
                  <span>{order.shippingAddress.phone || "No phone provided"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-brand-muted" />
                  <span>{order.shippingAddress.email}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Payment & Price Summary Card */}
          <div className="rounded-2xl border border-brand-border/70 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
              <div className="flex items-center gap-2 text-brand-dark font-medium">
                {isCod ? (
                  <Banknote className="h-4 w-4 text-brand-accent" />
                ) : (
                  <CreditCard className="h-4 w-4 text-brand-accent" />
                )}
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Payment Summary
                </h3>
              </div>

              <span
                className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                  order.paymentStatus === "refunded" || order.refundStatus === "processed"
                    ? "bg-purple-50 text-purple-800 border-purple-200"
                    : order.refundStatus === "initiated"
                    ? "bg-brand-gold/20 text-brand-dark border-brand-gold/40"
                    : isPaid
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : order.paymentStatus === "failed"
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {order.paymentStatus === "refunded" || order.refundStatus === "processed"
                  ? "Refunded"
                  : order.refundStatus === "initiated"
                  ? "Refund Initiated"
                  : isPaid
                  ? "Paid"
                  : order.paymentStatus === "failed"
                  ? "Failed"
                  : "Pending"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-brand-muted">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Discount {order.couponCode ? `(${order.couponCode})` : ""}
                  </span>
                  <span>-₹{order.discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between text-brand-muted">
                <span>Standard Delivery</span>
                <span>
                  {order.shippingCharge === 0 ? (
                    <span className="text-emerald-700 font-medium">FREE</span>
                  ) : (
                    `₹${order.shippingCharge.toLocaleString("en-IN")}`
                  )}
                </span>
              </div>

              {order.codHandlingFee ? (
                <div className="flex justify-between text-brand-muted">
                  <span>COD Handling Fee</span>
                  <span>₹{order.codHandlingFee.toLocaleString("en-IN")}</span>
                </div>
              ) : null}

              <div className="border-t border-brand-border/60 pt-3 flex justify-between items-baseline font-bold text-brand-dark text-sm">
                <span>Total Paid / Due</span>
                <span className="font-heading text-lg font-semibold text-brand-dark">
                  ₹{order.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-brand-muted font-sans border-t border-brand-border/40">
              <p>
                Method:{" "}
                <strong className="text-brand-dark">
                  {isCod ? "Cash on Delivery (COD)" : "Online (Razorpay UPI/Cards/NetBanking)"}
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
