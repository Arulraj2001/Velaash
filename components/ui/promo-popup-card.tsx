"use client";

import React from "react";
import Link from "next/link";
import { X, Copy, Check, Sparkles, ArrowRight, Tag, Ticket } from "lucide-react";

export interface PromoPopupCardProps {
  title: string;
  description: string;
  coupon: {
    code: string;
    discountType: "percentage" | "flat";
    discountValue: number;
    minOrderValue: number;
    maxDiscountAmount: number | null;
  } | null;
  productThumbnail?: {
    imageUrl: string;
    name?: string;
  } | null;
  onCopy?: () => void;
  copied?: boolean;
  onClose?: () => void;
  onShopClick?: () => void;
  isPreview?: boolean;
  containerRef?: React.Ref<HTMLDivElement>;
  closeButtonRef?: React.Ref<HTMLButtonElement>;
}

/**
 * Shared presentation component for both the customer-facing popup
 * and the admin live settings preview. Guarantees 100% styling parity.
 */
export function PromoPopupCard({
  title,
  description,
  coupon,
  productThumbnail,
  onCopy,
  copied = false,
  onClose,
  onShopClick,
  isPreview = false,
  containerRef,
  closeButtonRef,
}: PromoPopupCardProps) {
  const discountText = coupon
    ? coupon.discountType === "percentage"
      ? `${coupon.discountValue}% OFF`
      : `₹${coupon.discountValue.toLocaleString("en-IN")} OFF`
    : "EXCLUSIVE DISCOUNT";

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-md overflow-hidden rounded-3xl border border-[#f2a900]/30 p-6 sm:p-8 text-center shadow-[0_20px_60px_rgba(77,42,0,0.22)] ${
        isPreview
          ? ""
          : "transition-all duration-300 ease-out animate-in fade-in zoom-in-95"
      }`}
      style={{
        background:
          "radial-gradient(135% 100% at 50% 0%, #F9E6A8 0%, #FFFDF7 55%, #FFFBF0 100%)",
      }}
    >
      {/* 5. Polish Close (X) button with circular light-gold hover background */}
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close promotional offer modal"
        className="absolute top-4 right-4 p-2 text-[#7a5233] hover:text-[#4d2a00] hover:bg-[#f9e6a8]/60 active:bg-[#f9e6a8]/80 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2a900]"
      >
        <X className="w-5 h-5" />
      </button>

      {/* 2. Real Product Thumbnail queried from DB */}
      {productThumbnail?.imageUrl && (
        <div className="relative mx-auto mb-3.5 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden ring-2 ring-[#f2a900]/50 shadow-md bg-[#FFFBF0]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={productThumbnail.imageUrl}
            alt={productThumbnail.name || "Featured Velaash product"}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
      )}

      {/* Header Tag / Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f9e6a8]/70 border border-[#f2a900]/40 text-[#9e4700] text-xs font-semibold tracking-wide uppercase mb-3 shadow-2xs">
        <Sparkles className="w-3.5 h-3.5 text-[#cc6f00]" />
        <span>Limited Time Offer</span>
      </div>

      {/* Title */}
      <h2
        id="promo-popup-title"
        className="font-serif text-2xl sm:text-3xl font-bold text-[#4d2a00] tracking-tight"
      >
        {title || "Special Offer"}
      </h2>

      {/* Description */}
      <p
        id="promo-popup-description"
        className="text-xs sm:text-sm text-[#7a5233] mt-2 leading-relaxed max-w-sm mx-auto font-normal"
      >
        {description ||
          "Use this code at checkout to enjoy an exclusive discount on your order."}
      </p>

      {/* 3. Coupon Code Box with brand-accent (#CC6F00) dashed border & Ticket notch */}
      <div className="my-5 pt-4 pb-4 px-4 rounded-2xl border-2 border-dashed border-[#cc6f00] bg-[#fffbf0]/80 shadow-inner relative overflow-visible">
        {/* Ticket Notch Icon at Top Edge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#cc6f00] text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
          <Ticket className="w-3 h-3 text-[#f9e6a8]" />
          <span>Promo Code</span>
        </div>

        {/* Live Discount text */}
        <div className="text-sm font-bold uppercase tracking-wider text-[#cc6f00] mt-0.5">
          {discountText}
        </div>

        {/* Live Coupon Code Pill */}
        <div className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-white border border-[#cc6f00]/30 shadow-xs">
          <Tag className="w-4 h-4 text-[#cc6f00]" />
          <span className="font-mono text-lg sm:text-xl font-extrabold tracking-widest text-[#4d2a00] selection:bg-[#f2a900]">
            {coupon ? coupon.code : "SELECT A COUPON"}
          </span>
        </div>

        {/* Dynamic min order & max discount details from coupon row */}
        {coupon && coupon.minOrderValue > 0 && (
          <div className="text-[11px] text-[#9c826b] mt-2 font-medium">
            Valid on orders above ₹{coupon.minOrderValue.toLocaleString("en-IN")}
          </div>
        )}
        {coupon && coupon.maxDiscountAmount && coupon.discountType === "percentage" && (
          <div className="text-[10px] text-[#9c826b] mt-0.5">
            Maximum discount up to ₹{coupon.maxDiscountAmount.toLocaleString("en-IN")}
          </div>
        )}
      </div>

      {/* 4. Button Hierarchy: "Copy Code" is Primary (Solid Gold), "Shop Now" is Secondary (Outline) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onCopy}
          className={`inline-flex items-center justify-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2a900] ${
            copied
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20"
              : "bg-[#f2a900] hover:bg-[#d99600] text-[#4d2a00] border border-[#d99600]/40 shadow-[#f2a900]/25"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-[#4d2a00]" />
              <span>Copy Code</span>
            </>
          )}
        </button>

        {/* Secondary Action Button */}
        {isPreview ? (
          <div
            onClick={onShopClick}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl border-2 border-[#cc6f00] text-[#cc6f00] hover:bg-[#cc6f00]/5 bg-transparent transition-colors cursor-pointer active:scale-[0.98]"
          >
            <span>Shop Now</span>
            <ArrowRight className="w-4 h-4 text-[#cc6f00]" />
          </div>
        ) : (
          <Link
            href="/shop"
            onClick={onShopClick}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl border-2 border-[#cc6f00] text-[#cc6f00] hover:bg-[#cc6f00]/5 bg-transparent transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#cc6f00]"
          >
            <span>Shop Now</span>
            <ArrowRight className="w-4 h-4 text-[#cc6f00]" />
          </Link>
        )}
      </div>
    </div>
  );
}
