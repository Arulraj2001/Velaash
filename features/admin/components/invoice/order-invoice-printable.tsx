"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";
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
      }, 350);
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
    <div className="min-h-screen bg-slate-100/60 print:bg-white text-slate-900 font-sans selection:bg-amber-100 print:min-h-0">
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
              Select &quot;Save as PDF&quot; in printer destination to download.
            </span>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="h-4 w-4" />}
              className="text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
            >
              Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main Invoice Document Canvas */}
      <div className="mx-auto my-6 max-w-4xl p-4 sm:p-6 print:m-0 print:p-0 print:max-w-none print:w-full">
        <div className="invoice-sheet rounded-xl border border-slate-200 bg-white p-7 sm:p-9 shadow-xs print:shadow-none print:border-none print:p-0 space-y-5">
          {/* 1. Header: Brand Info & Document Classification */}
          <div className="avoid-break flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            {/* Brand Logo & Details */}
            <div className="flex items-start gap-3.5">
              <div className="relative h-13 w-13 shrink-0 rounded-lg overflow-hidden border border-amber-200/80 bg-amber-50">
                <Image
                  src={INVOICE_LOGO_BASE64}
                  alt={brandDisplayName}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="space-y-0.5">
                <h1 className="font-heading text-lg font-bold tracking-wider text-amber-950 uppercase leading-none">
                  {brandDisplayName}
                </h1>
                <p className="text-[10.5px] font-semibold text-amber-900/80 tracking-wide">
                  Contemporary Everyday Luxury
                </p>
                <p className="text-[10.5px] text-slate-600">
                  M/S {legalEntityName}
                </p>
                <p className="text-[10px] text-slate-500">
                  Tamil Nadu, India • Ph: {supportPhone} • Email: {supportEmail}
                </p>
                <p className="text-[10px] font-mono font-medium text-amber-700">
                  www.velaash.in
                </p>
              </div>
            </div>

            {/* Classification & GST Details */}
            <div className="text-right space-y-1">
              <span className="inline-block rounded-md bg-slate-900 px-3 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white">
                {gstEnabled ? "TAX INVOICE" : "BILL OF SUPPLY"}
              </span>
              <p className="text-[10px] text-slate-500">
                {gstEnabled
                  ? "Original for Recipient"
                  : "Not Liable to Pay Tax under GST (Composition Scheme)"}
              </p>
              {gstEnabled && gstin && (
                <p className="text-[11px] font-mono font-bold text-slate-800">
                  GSTIN: {gstin}
                </p>
              )}
              <p className="text-[10.5px] text-slate-600">
                Place of Supply: <strong className="text-slate-800">{destinationState}</strong>
              </p>
            </div>
          </div>

          {/* 2. Side-by-Side: Particulars & Billed Address */}
          <div className="avoid-break grid grid-cols-2 gap-4">
            {/* Invoice & Order Particulars */}
            <div className="rounded-lg border border-slate-200/90 bg-slate-50/50 p-3.5 space-y-1.5 text-[11px]">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 pb-1">
                Invoice &amp; Order Particulars
              </h2>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5 text-[11px]">
                <div>
                  <span className="text-slate-500 text-[10px] block">Invoice No:</span>
                  <span className="font-mono font-bold text-slate-900">
                    INV-{order.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Invoice Date:</span>
                  <span className="text-slate-900 font-medium">{formattedDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Order Ref:</span>
                  <span className="font-mono font-bold text-slate-900">
                    #{order.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Payment Mode:</span>
                  <span className="text-slate-900 font-medium">
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Prepaid"}
                  </span>
                </div>
                {order.paymentStatus === "paid" && (
                  <div>
                    <span className="text-slate-500 text-[10px] block">Payment Status:</span>
                    <span className="text-emerald-700 font-bold">PAID</span>
                  </div>
                )}
                {order.trackingNumber && (
                  <div>
                    <span className="text-slate-500 text-[10px] block">Tracking No:</span>
                    <span className="font-mono font-semibold text-slate-800 text-[10.5px]">
                      {order.courierName ? `${order.courierName}: ` : ""}
                      {order.trackingNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Billed To / Shipped To Address */}
            <div className="rounded-lg border border-slate-200/90 bg-slate-50/50 p-3.5 space-y-1.5 text-[11px]">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 pb-1">
                Billed To &amp; Delivery Destination
              </h2>
              <div className="pt-0.5 space-y-1 text-[11px]">
                <p className="font-bold text-slate-900 text-xs">
                  {order.shippingAddress.fullName}
                </p>
                <p className="text-slate-700 leading-snug">
                  {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2
                    ? `, ${order.shippingAddress.addressLine2}`
                    : ""}
                </p>
                <p className="text-slate-700 leading-snug">
                  {order.shippingAddress.city}, {order.shippingAddress.state} –{" "}
                  <span className="font-mono font-medium">{order.shippingAddress.pincode}</span>
                </p>
                <p className="text-[10.5px] text-slate-500 pt-0.5">
                  Ph: <strong className="text-slate-800">{order.shippingAddress.phone || "—"}</strong>
                  {order.shippingAddress.email && (
                    <> • Email: <strong className="text-slate-800">{order.shippingAddress.email}</strong></>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Itemized Products Table */}
          <div className="space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Particulars of Supply
            </h2>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700">
                    <th className="py-2 px-3 font-bold w-10 text-center">#</th>
                    <th className="py-2 px-3 font-bold">Item Description</th>
                    <th className="py-2 px-3 font-bold text-center w-20">Size</th>
                    <th className="py-2 px-3 font-bold text-center w-20">Color</th>
                    <th className="py-2 px-3 font-bold text-center w-14">Qty</th>
                    <th className="py-2 px-3 font-bold text-right w-28">Unit Price</th>
                    <th className="py-2 px-3 font-bold text-right w-28">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[10.5px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-900 leading-snug">{item.productName}</p>
                        {item.sku && (
                          <p className="text-[9.5px] font-mono text-slate-400">SKU: {item.sku}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700 text-[10.5px]">
                        {item.size || "Standard"}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700 text-[10.5px]">
                        {item.color || "Default"}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        ₹{item.unitPrice.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{item.subtotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Side-by-Side: Amount in Words & Financial Breakdown */}
          <div className="avoid-break grid grid-cols-12 gap-4 items-stretch">
            {/* Amount in Words (Left) */}
            <div className="col-span-7 rounded-lg border border-amber-200/80 bg-amber-50/30 p-3.5 flex flex-col justify-between text-[11px]">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                  Invoice Total in Words:
                </span>
                <p className="font-semibold text-slate-900 italic text-xs leading-relaxed">
                  {amountInWords}
                </p>
              </div>
              <div className="pt-2 border-t border-amber-200/60 flex items-center gap-1.5 text-emerald-800 text-[10.5px] font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Includes all standard applicable taxes and delivery charges.</span>
              </div>
            </div>

            {/* Calculations Box (Right) */}
            <div className="col-span-5 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-1.5 text-[11px]">
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
                <span>Shipping &amp; Delivery:</span>
                <span className="font-mono">
                  {order.shippingCharge === 0 ? (
                    <span className="text-emerald-700 font-semibold">FREE</span>
                  ) : (
                    `₹${order.shippingCharge.toLocaleString("en-IN")}`
                  )}
                </span>
              </div>

              <div className="border-t border-slate-300 pt-2 flex justify-between items-baseline font-bold text-slate-900">
                <span className="text-xs font-bold uppercase tracking-wide">Total Payable:</span>
                <span className="font-heading text-base font-bold text-slate-900">
                  ₹{order.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Compact Terms & Disclaimer Footer */}
          <div className="avoid-break border-t border-slate-200 pt-3.5 space-y-2 text-[10.5px] text-slate-500">
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <h3 className="font-bold uppercase tracking-wider text-[9.5px] text-slate-700 mb-1">
                  Exchange &amp; Replacement Policy
                </h3>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-600 leading-snug">
                  <li>Doorstep replacement &amp; size exchanges valid within 7 days of delivery.</li>
                  <li>Continuous, uncut unboxing video proof is mandatory for exchange.</li>
                  <li>Original brand tags and garment conditions must remain intact.</li>
                </ul>
              </div>

              <div className="text-right space-y-1">
                <p className="font-bold text-slate-800 text-[11px] uppercase">
                  For {brandDisplayName.toUpperCase()}
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  Computer-Generated Document • No Signature Required
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2 text-center text-[9.5px] text-slate-400">
              {brandDisplayName.toUpperCase()} • Care: {supportPhone} • {supportEmail} • All disputes subject to Chennai jurisdiction.
            </div>
          </div>
        </div>
      </div>

      {/* Global Print Isolation & Balanced Page Margins */}
      <style jsx global>{`
        @media print {
          /* Strict Isolation: hide all headers, footers, topbars, sidebars, buttons */
          header,
          nav,
          aside,
          .no-print {
            display: none !important;
          }

          /* Balanced A4 portrait margins: 12mm top/bottom, 16mm left/right for comfortable breathing room */
          @page {
            size: A4 portrait;
            margin: 12mm 16mm;
          }

          html,
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 11px !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Remove card shadows and ensure sheet fits gracefully within page margins */
          .invoice-sheet {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Avoid breaking inside cohesive modules */
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
