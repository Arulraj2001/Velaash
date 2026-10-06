"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, AlertCircle, Info } from "lucide-react";
import type { CartItem } from "../types";

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const isAvailable = item.isAvailable !== false;
  const maxStock = item.maxStock ?? 10;
  const isMaxReached = item.quantity >= maxStock;
  const lineSubtotal = item.price * item.quantity;

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (item.quantity < maxStock && isAvailable) {
      onUpdateQuantity(item.id, item.quantity + 1);
    }
  };

  return (
    <div
      className={`relative flex flex-col sm:flex-row gap-4 py-5 border-b border-brand-border/60 transition-colors ${
        !isAvailable ? "bg-red-50/40 rounded-lg p-3 sm:p-4 my-2 border-red-200" : ""
      }`}
    >
      {/* 1. Thumbnail Image */}
      <div className="relative h-28 w-24 sm:h-32 sm:w-28 shrink-0 overflow-hidden rounded-md bg-brand-light border border-brand-border/60">
        <Link href={`/products/${item.slug}`} className="block h-full w-full">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className={`object-cover object-top transition-transform duration-300 hover:scale-105 ${
              !isAvailable ? "grayscale opacity-70" : ""
            }`}
            sizes="(max-width: 640px) 96px, 112px"
          />
        </Link>
      </div>

      {/* 2. Product Details & Stepper */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                href={`/products/${item.slug}`}
                className="font-heading text-base sm:text-lg font-medium text-brand-dark hover:text-brand-accent transition-colors line-clamp-1"
              >
                {item.title}
              </Link>

              {/* Variant Specs */}
              {(item.color || item.size) && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-brand-muted">
                  {item.color && (
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium text-brand-muted">Color:</span> {item.color}
                      {item.colorHex && (
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: item.colorHex }}
                          title={item.color}
                        />
                      )}
                    </span>
                  )}
                  {item.color && item.size && <span className="text-brand-border">&bull;</span>}
                  {item.size && (
                    <span>
                      <span className="font-medium text-brand-muted">Size:</span> {item.size}
                    </span>
                  )}
                </div>
              )}

              {item.isReturnable === false && (
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                    Final Sale (Non-Returnable)
                  </span>
                </div>
              )}
            </div>

            {/* Remove Button (Desktop & Mobile) */}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-brand-muted hover:text-red-600 transition-colors p-1 -mt-1 -mr-1"
              aria-label={`Remove ${item.title} from cart`}
              title="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Unit Price */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-brand-dark">
              ₹{item.price.toLocaleString("en-IN")}
            </span>
            {item.compareAtPrice && item.compareAtPrice > item.price && (
              <span className="text-xs text-brand-subtle line-through">
                ₹{item.compareAtPrice.toLocaleString("en-IN")}
              </span>
            )}
            {item.priceUpdated && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-900 border border-amber-200">
                <Info className="h-3 w-3" />
                Price updated
              </span>
            )}
          </div>

          {/* Warnings & Availability Messages */}
          {!isAvailable && (
            <div className="mt-2.5 flex items-start gap-2 rounded-md bg-red-100/70 p-2 text-xs text-red-800 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">
                  {item.availabilityWarning || "This item is currently out of stock or unavailable."}
                </p>
                <p className="mt-0.5 text-[11px] text-red-700">
                  Please remove this item to proceed to checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="shrink-0 text-xs font-semibold underline text-red-800 hover:text-red-950"
              >
                Remove
              </button>
            </div>
          )}

          {isAvailable && item.availabilityWarning && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>{item.availabilityWarning}</span>
            </div>
          )}
        </div>

        {/* 3. Bottom Row: Stepper & Subtotal */}
        <div className="mt-4 flex items-center justify-between">
          {/* Quantity Stepper */}
          {isAvailable ? (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded border border-brand-border/80 bg-white">
                <button
                  type="button"
                  onClick={handleDecrease}
                  disabled={item.quantity <= 1}
                  className="flex h-8 w-8 items-center justify-center text-brand-dark transition-colors hover:bg-brand-cream/60 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-9 text-center text-xs font-semibold text-brand-dark tabular-nums">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={isMaxReached}
                  className="flex h-8 w-8 items-center justify-center text-brand-dark transition-colors hover:bg-brand-cream/60 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {isMaxReached && (
                <span className="text-[11px] text-brand-muted hidden sm:inline">
                  Max stock reached ({maxStock})
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs font-medium text-red-700">Unavailable</span>
          )}

          {/* Line Subtotal */}
          <div className="text-right">
            <span className="text-xs text-brand-muted mr-1.5 sm:hidden">Total:</span>
            <span
              className={`text-sm sm:text-base font-semibold ${
                !isAvailable ? "text-brand-subtle line-through" : "text-brand-dark"
              }`}
            >
              ₹{lineSubtotal.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
