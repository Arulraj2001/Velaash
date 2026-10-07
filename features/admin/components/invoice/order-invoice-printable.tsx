"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Printer, Download, CheckCircle2, ShieldCheck } from "lucide-react";
import type { AdminOrderDetail } from "@/features/admin/types/orders";
import { INVOICE_LOGO_BASE64 } from "@/features/admin/services/invoice-logo-data";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui";

export interface OrderInvoicePrintableProps {
  order: AdminOrderDetail;
  storeProfile?: {
    name?: string;
    legal_name?: string;
    email?: string;
    phone?: string;
  } | null;
  gstEnabled?: boolean;
  gstin?: string | null;
  autoPrint?: boolean;
}

/**
 * Converts a numerical INR amount into formal Indian English words.
 */
function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Rupees Only";
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }

  function convertThreeDigits(n: number): string {
    let str = "";
    if (Math.floor(n / 100) > 0) {
      str += ones[Math.floor(n / 100)] + " Hundred";
      if (n % 100) str += " and ";
    }
    str += convertTwoDigits(n % 100);
    return str.trim();
  }

  const intPart = Math.floor(num);
  const decimalPart = Math.round((num - intPart) * 100);

  let result = "";
  let remaining = intPart;

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  const hundred = remaining;

  if (crore > 0) result += convertThreeDigits(crore) + " Crore ";
  if (lakh > 0) result += convertThreeDigits(lakh) + " Lakh ";
  if (thousand > 0) result += convertThreeDigits(thousand) + " Thousand ";
  if (hundred > 0) result += convertThreeDigits(hundred) + " ";

  result = result.trim() + " Rupees";
  if (decimalPart > 0) {
    result += " and " + convertTwoDigits(decimalPart) + " Paise";
  }
  return result + " Only";
}

export function OrderInvoicePrintable({
  order,
  storeProfile,
  gstEnabled = false,
  gstin = null,
  autoPrint = false,
}: OrderInvoicePrintableProps) {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const brandDisplayName = storeProfile?.name || BRAND.name;
  const legalEntityName = storeProfile?.legal_name || BRAND.legalName;
  const supportEmail = storeProfile?.email || "care@velaash.in";
  const supportPhone = storeProfile?.phone || "+91 98765 43210";

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const destinationState = order.shippingAddress?.state || "Tamil Nadu";
  const amountInWords = numberToIndianWords(order.totalAmount);

  return (
    <div className="min-h-screen bg-slate-100/60 print:bg-white text-slate-900 font-sans selection:bg-amber-100">
      {/* Top Controls Bar (Hidden during printing) */}
      <div className="no-print sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-3.5 shadow-xs">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link
            href={`/admin/orders/${order.orderNumber}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Order #{order.orderNumber}
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[11px] text-slate-500">
              Tip: Select &quot;Save as PDF&quot; in the printer dialog to download.
            </span>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="h-4 w-4" />}
              className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
            >
              Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main Invoice Document Canvas */}
      <div className="mx-auto my-6 max-w-4xl p-4 sm:p-6 print:m-0 print:p-0 print:max-w-none">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm print:shadow-none print:border-none print:p-0 space-y-7">
          {/* 1. Header Row: Brand Identity & Compliance Type */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-b-2 border-slate-200 pb-6">
            {/* Brand Info */}
            <div className="flex items-start gap-4">
              <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-amber-200/80 bg-amber-50">
                <Image
                  src={INVOICE_LOGO_BASE64}
                  alt={brandDisplayName}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="space-y-0.5">
                <h1 className="font-heading text-xl font-bold tracking-wider text-amber-950 uppercase">
                  {brandDisplayName}
                </h1>
                <p className="text-xs font-medium text-amber-900/80">
                  Contemporary Everyday Luxury
                </p>
                <p className="text-[11px] text-slate-600">
                  M/S {legalEntityName}
                </p>
                <p className="text-[11px] text-slate-500">
                  Tamil Nadu, India • Ph: {supportPhone} • Email: {supportEmail}
                </p>
                <p className="text-[11px] font-mono font-medium text-amber-700">
                  www.velaash.in
                </p>
              </div>
            </div>

            {/* Document Classification */}
            <div className="sm:text-right space-y-1">
              <div className="inline-block rounded-lg bg-slate-900 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                {gstEnabled ? "TAX INVOICE" : "BILL OF SUPPLY"}
              </div>
              <p className="text-[11px] text-slate-500">
                {gstEnabled
                  ? "Original for Recipient"
                  : "Not Liable to Pay Tax under GST (Composition Scheme)"}
              </p>
              {gstEnabled && gstin && (
                <p className="text-xs font-mono font-bold text-slate-800">
                  GSTIN: {gstin}
                </p>
              )}
              <p className="text-xs text-slate-600 font-medium">
                Place of Supply: <strong>{destinationState}</strong>
              </p>
            </div>
          </div>

          {/* 2. Structured Metadata: Invoice Info & Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice & Order Particulars */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-2 text-xs">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">
                Invoice &amp; Order Particulars
              </h2>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Invoice No:</span>
                  <span className="font-mono font-bold text-slate-900">
                    INV-{order.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Invoice Date:</span>
                  <span className="text-slate-900 font-medium">{formattedDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Order Reference:</span>
                  <span className="font-mono font-bold text-slate-900">
                    #{order.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Payment Mode:</span>
                  <span className="text-slate-900 font-medium">
                    {order.paymentMethod === "cod"
                      ? "Cash on Delivery (COD)"
                      : "Online Prepaid (Razorpay)"}
                  </span>
                </div>
                {order.paymentStatus === "paid" && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Payment Status:</span>
                    <span className="text-emerald-700 font-bold">PAID</span>
                  </div>
                )}
                {order.trackingNumber && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">Courier Tracking:</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-800">
                      {order.courierName ? `${order.courierName}: ` : ""}
                      {order.trackingNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Billed To / Shipped To Address */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-2 text-xs">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1.5">
                Billed To &amp; Delivery Destination
              </h2>
              <div className="pt-1 space-y-1">
                <p className="font-bold text-slate-900 text-sm">
                  {order.shippingAddress.fullName}
                </p>
                <p className="text-slate-700">
                  {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2
                    ? `, ${order.shippingAddress.addressLine2}`
                    : ""}
                </p>
                <p className="text-slate-700">
                  {order.shippingAddress.city}, {order.shippingAddress.state} –{" "}
                  <span className="font-mono font-medium">{order.shippingAddress.pincode}</span>
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Phone: <strong className="text-slate-800">{order.shippingAddress.phone || "—"}</strong>{" "}
                  • Email: <strong className="text-slate-800">{order.shippingAddress.email || "—"}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* 3. Itemized Products Table */}
          <div className="space-y-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Particulars of Supply
            </h2>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
                    <th className="py-2.5 px-3 font-bold w-12 text-center">#</th>
                    <th className="py-2.5 px-3 font-bold">Item Description</th>
                    <th className="py-2.5 px-3 font-bold text-center">Size</th>
                    <th className="py-2.5 px-3 font-bold text-center">Color</th>
                    <th className="py-2.5 px-3 font-bold text-center">Qty</th>
                    <th className="py-2.5 px-3 font-bold text-right">Unit Price</th>
                    <th className="py-2.5 px-3 font-bold text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900">{item.productName}</p>
                        {item.sku && (
                          <p className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-700">
                        {item.size || "Standard"}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-700">
                        {item.color || "Default"}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        ₹{item.unitPrice.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{item.subtotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Financial Breakdown & Amount in Words */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
            {/* Amount in Words */}
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 space-y-1.5 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                Invoice Total in Words:
              </span>
              <p className="font-semibold text-slate-900 italic text-sm leading-snug">
                {amountInWords}
              </p>
              <div className="pt-2 text-[11px] text-slate-500 border-t border-amber-200/60 space-y-1">
                <p className="flex items-center gap-1.5 text-emerald-800 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Includes all standard taxes and courier delivery costs.
                </p>
              </div>
            </div>

            {/* Calculations Box */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-medium">
                  ₹{order.subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>
                    Discount {order.couponCode ? `(${order.couponCode})` : ""}:
                  </span>
                  <span className="font-mono">
                    -₹{order.discountAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Shipping &amp; Logistics:</span>
                <span className="font-mono">
                  {order.shippingCharge === 0 ? (
                    <span className="text-emerald-700 font-semibold">FREE</span>
                  ) : (
                    `₹${order.shippingCharge.toLocaleString("en-IN")}`
                  )}
                </span>
              </div>

              <div className="border-t-2 border-slate-300 pt-2 flex justify-between items-baseline font-bold text-slate-900 text-sm">
                <span>Total Payable:</span>
                <span className="font-heading text-lg font-bold text-slate-900">
                  ₹{order.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Terms & Signature Disclaimer Footer */}
          <div className="border-t border-slate-200 pt-6 space-y-3 text-xs text-slate-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                  Exchange &amp; Replacement Terms
                </h3>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                  <li>Doorstep replacement &amp; size exchanges available within 7 days of delivery.</li>
                  <li>Continuous, uncut unboxing video proof is mandatory for exchange validation.</li>
                  <li>Original brand tags and polybags must remain intact.</li>
                </ul>
              </div>

              <div className="sm:text-right flex flex-col justify-end">
                <p className="font-bold text-slate-800 text-xs uppercase">
                  For {brandDisplayName.toUpperCase()}
                </p>
                <p className="text-[11px] text-slate-500 pt-6 italic">
                  Computer-Generated Document • No Signature Required
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400">
              {brandDisplayName.toUpperCase()} • {supportEmail} • Care: {supportPhone} • All disputes subject to Chennai jurisdiction.
            </div>
          </div>
        </div>
      </div>

      {/* Print Style Injector */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
