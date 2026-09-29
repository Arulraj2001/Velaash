"use client";

import { useEffect } from "react";
import { useWishlistStore } from "../store/wishlist-store";

interface WishlistSyncProps {
  initialWishlistIds?: string[];
}

/**
 * Headless client component that seeds the client-side wishlist store
 * with verified server-fetched product IDs.
 */
export function WishlistSync({ initialWishlistIds = [] }: WishlistSyncProps) {
  useEffect(() => {
    if (initialWishlistIds) {
      useWishlistStore.getState().setWishlistIds(initialWishlistIds);
    }
  }, [initialWishlistIds]);

  return null;
}
