"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Undo2, X, RefreshCw } from "lucide-react";
import { useCartStore } from "../store/cart-store";
import { CartEmptyState } from "./cart-empty-state";
import { CartItemRow } from "./cart-item-row";
import { CartOrderSummary } from "./cart-order-summary";
import { revalidateCartAction } from "../actions/revalidate-cart-action";
import { validateCouponAction } from "../actions/validate-coupon-action";
import type { ShippingPolicyData, CartItem } from "../types";

interface CartViewProps {
  shippingPolicy: ShippingPolicyData;
  returnWindowDays: number;
}

interface UndoState {
  item: CartItem;
  index: number;
  timerId: NodeJS.Timeout;
}

const emptySubscribe = () => () => {};

export function CartView({ shippingPolicy, returnWindowDays }: CartViewProps) {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [isValidating, setIsValidating] = useState(false);
  const [revalidationNotice, setRevalidationNotice] = useState<string | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);

  const items = useCartStore((state) => state.items);
  const appliedCoupon = useCartStore((state) => state.appliedCoupon);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const restoreItem = useCartStore((state) => state.restoreItem);
  const syncValidatedItems = useCartStore((state) => state.syncValidatedItems);
  const setAppliedCoupon = useCartStore((state) => state.setAppliedCoupon);
  const removeAppliedCoupon = useCartStore((state) => state.removeAppliedCoupon);

  // Revalidation run flag to avoid infinite loops
  const hasRevalidatedRef = useRef(false);

  // Re-validate stock, pricing, and applied coupons against database on page load
  useEffect(() => {
    if (!isHydrated || hasRevalidatedRef.current || items.length === 0) {
      return;
    }

    hasRevalidatedRef.current = true;

    async function runRevalidation() {
      setIsValidating(true);
      try {
        const payload = items.map((i) => ({
          id: i.id,
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price,
        }));

        const result = await revalidateCartAction({
          items: payload,
          appliedCouponCode: appliedCoupon?.code,
        });

        // Sync validated items into Zustand store
        syncValidatedItems(result.items);

        // Check if any items had stock adjustments or price updates
        const adjustedItems = result.items.filter((i) => i.quantityAdjusted || i.priceChanged);
        if (adjustedItems.length > 0) {
          setRevalidationNotice("Some item prices or quantities were adjusted based on live inventory.");
        }

        // Check coupon status
        if (appliedCoupon) {
          if (result.validatedCoupon) {
            setAppliedCoupon(result.validatedCoupon);
          } else if (result.couponError) {
            removeAppliedCoupon();
            setRevalidationNotice(
              `Coupon "${appliedCoupon.code}" was removed: ${result.couponError}`
            );
          }
        }
      } catch (err) {
        console.error("Cart revalidation failed:", err);
      } finally {
        setIsValidating(false);
      }
    }

    runRevalidation();
  }, [isHydrated, items, appliedCoupon, syncValidatedItems, setAppliedCoupon, removeAppliedCoupon]);

  // Clean up undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoState?.timerId) {
        clearTimeout(undoState.timerId);
      }
    };
  }, [undoState]);

  // Handle line item removal with Undo toast
  const handleRemoveItem = (id: string) => {
    const itemIndex = items.findIndex((i) => i.id === id);
    const itemToRemove = items[itemIndex];
    if (!itemToRemove) return;

    // Clear any previous undo timer
    if (undoState?.timerId) {
      clearTimeout(undoState.timerId);
    }

    removeItem(id);

    // Set 5-second undo toast
    const timerId = setTimeout(() => {
      setUndoState(null);
    }, 5000);

    setUndoState({
      item: itemToRemove,
      index: itemIndex,
      timerId,
    });
  };

  // Handle undo action
  const handleUndo = () => {
    if (!undoState) return;
    clearTimeout(undoState.timerId);
    restoreItem(undoState.item, undoState.index);
    setUndoState(null);
  };

  // Handle coupon application
  const handleApplyCoupon = async (code: string): Promise<{ success: boolean; error?: string }> => {
    // Calculate current valid subtotal
    const validSubtotal = items
      .filter((i) => i.isAvailable !== false)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    const res = await validateCouponAction(code, validSubtotal);
    if (res.success) {
      setAppliedCoupon({
        code: res.coupon.code,
        discountType: res.coupon.discountType,
        discountValue: res.coupon.discountValue,
        minOrderValue: res.coupon.minOrderValue,
        maxDiscountAmount: res.coupon.maxDiscountAmount,
        discountAmount: res.discountAmount,
      });
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Render placeholder while hydrating to prevent layout shifts
  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-8 w-48 bg-brand-cream/60 animate-pulse rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-32 bg-brand-cream/40 animate-pulse rounded-lg" />
            <div className="h-32 bg-brand-cream/40 animate-pulse rounded-lg" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-64 bg-brand-cream/40 animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // 1. Empty Cart State
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <CartEmptyState />

        {/* Undo Toast when all items were removed */}
        {undoState && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg bg-brand-dark px-4 py-3 text-xs text-brand-cream shadow-xl border border-brand-gold/30 animate-in fade-in slide-in-from-bottom-4"
          >
            <span>Removed &quot;{undoState.item.title}&quot;</span>
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1 font-semibold text-brand-gold hover:underline"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Undo
            </button>
            <button
              type="button"
              onClick={() => setUndoState(null)}
              className="text-brand-cream/60 hover:text-brand-cream ml-1"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  const hasUnavailableItems = items.some((i) => i.isAvailable === false);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b border-brand-border/60 pb-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-normal text-brand-dark tracking-tight">
            Shopping Bag
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-brand-muted">
            {totalItemCount} {totalItemCount === 1 ? "item" : "items"} currently in your bag
          </p>
        </div>

        {isValidating && (
          <div className="flex items-center gap-1.5 text-xs text-brand-muted">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Verifying stock &amp; pricing...</span>
          </div>
        )}
      </div>

      {/* Global Revalidation Notice */}
      {revalidationNotice && (
        <div className="mb-6 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-900 border border-amber-200">
          <span>{revalidationNotice}</span>
          <button
            type="button"
            onClick={() => setRevalidationNotice(null)}
            className="text-amber-700 hover:text-amber-900"
            aria-label="Dismiss notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* LEFT COLUMN: Cart Items List */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="divide-y divide-brand-border/40">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>

          {/* Continue Shopping Link */}
          <div className="mt-8 pt-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-dark hover:text-brand-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Order Summary */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28">
          <CartOrderSummary
            items={items}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={removeAppliedCoupon}
            shippingPolicy={shippingPolicy}
            returnWindowDays={returnWindowDays}
            hasUnavailableItems={hasUnavailableItems}
          />
        </div>
      </div>

      {/* Undo Toast */}
      {undoState && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg bg-brand-dark px-4 py-3 text-xs text-brand-cream shadow-xl border border-brand-gold/30 animate-in fade-in slide-in-from-bottom-4"
        >
          <span>Removed &quot;{undoState.item.title}&quot;</span>
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex items-center gap-1 font-semibold text-brand-gold hover:underline"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </button>
          <button
            type="button"
            onClick={() => setUndoState(null)}
            className="text-brand-cream/60 hover:text-brand-cream ml-1"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
