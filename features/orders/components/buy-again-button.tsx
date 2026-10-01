"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RotateCcw, Loader2, Check, AlertCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui";
import { useCartStore } from "@/features/cart/store/cart-store";
import { getBuyAgainItemsAction } from "../actions/buy-again-action";

interface BuyAgainButtonProps {
  orderId: string;
  orderNumber?: string;
  status: string;
  className?: string;
}

export function BuyAgainButton({
  orderId,
  orderNumber,
  status,
  className,
}: BuyAgainButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  // Per client guidelines, "Buy Again" is shown for delivered orders
  if (status !== "delivered") {
    return null;
  }

  const handleBuyAgain = async () => {
    try {
      setIsLoading(true);
      setFeedback(null);

      const res = await getBuyAgainItemsAction(orderId);

      if (!res.success) {
        setFeedback({
          type: "error",
          message: res.error || "Unable to reorder items at this time.",
        });
        return;
      }

      if (res.availableItems.length === 0) {
        setFeedback({
          type: "error",
          message: "Items from this order are currently out of stock or no longer available.",
        });
        return;
      }

      // Add each available item to the client Zustand cart
      const cartStore = useCartStore.getState();
      for (const payload of res.availableItems) {
        cartStore.addItem(payload.item, payload.quantity);
      }

      const orderRef = orderNumber || res.orderNumber ? ` #${orderNumber || res.orderNumber}` : "";

      if (res.unavailableItems.length > 0) {
        setFeedback({
          type: "warning",
          message: `Added ${res.availableItems.length} item(s) to bag. Some items from order${orderRef} are no longer available and were not added.`,
        });
      } else {
        setFeedback({
          type: "success",
          message: `Added ${res.availableItems.length} item(s) from order${orderRef} to your bag!`,
        });
      }
    } catch (err) {
      console.error("[BuyAgainButton] Error:", err);
      setFeedback({
        type: "error",
        message: "Failed to reorder items. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isLoading}
        onClick={handleBuyAgain}
        leftIcon={
          isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : feedback?.type === "success" ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )
        }
        className={className || "text-xs font-semibold"}
      >
        <span>{isLoading ? "Checking stock..." : "Buy Again"}</span>
      </Button>

      {feedback && (
        <div
          role="status"
          className={`flex items-center gap-1.5 text-[11px] font-sans text-right max-w-[260px] leading-tight animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "text-emerald-700"
              : feedback.type === "warning"
              ? "text-amber-700"
              : "text-rose-700"
          }`}
        >
          {feedback.type === "success" && <ShoppingBag className="h-3 w-3 shrink-0" />}
          {feedback.type === "warning" && <AlertCircle className="h-3 w-3 shrink-0" />}
          {feedback.type === "error" && <AlertCircle className="h-3 w-3 shrink-0" />}
          <span>{feedback.message}</span>
          {feedback.type !== "error" && (
            <Link href="/cart" className="underline font-semibold whitespace-nowrap ml-1">
              View Bag
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
