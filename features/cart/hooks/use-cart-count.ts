"use client";

import * as React from "react";
import { useCartStore } from "../store/cart-store";

/**
 * Hydration-safe hook to retrieve total items in cart.
 * Guarantees that the initial client render matches the SSR render (0),
 * and updates to the actual localStorage cart count immediately after hydration.
 */
export function useCartCount(): { count: number; isHydrated: boolean } {
  const [isHydrated, setIsHydrated] = React.useState(false);
  const items = useCartStore((state) => state.items);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  const count = isHydrated ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  return { count, isHydrated };
}
