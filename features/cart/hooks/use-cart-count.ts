"use client";

import { useSyncExternalStore } from "react";
import { useCartStore } from "../store/cart-store";

const emptySubscribe = () => () => {};

/**
 * Hydration-safe hook to retrieve total items in cart using React useSyncExternalStore
 */
export function useCartCount(): { count: number; isHydrated: boolean } {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const items = useCartStore((state) => state.items);
  const count = isHydrated ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  return { count, isHydrated };
}
