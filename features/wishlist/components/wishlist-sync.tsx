"use client";

import { useEffect } from "react";
import { useWishlistStore } from "../store/wishlist-store";
import { useAuth } from "@/features/auth/components/auth-provider";
import { createClient } from "@/lib/supabase/client";

interface WishlistSyncProps {
  initialWishlistIds?: string[];
}

/**
 * Hydrates wishlist state after client authentication resolves.
 */
export function WishlistSync({ initialWishlistIds }: WishlistSyncProps) {
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    if (initialWishlistIds) {
      useWishlistStore.getState().setWishlistIds(initialWishlistIds);
      return () => {
        isMounted = false;
      };
    }

    if (!user) {
      useWishlistStore.getState().setWishlistIds([]);
      return () => {
        isMounted = false;
      };
    }

    createClient()
      .from("wishlists")
      .select("product_id")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error("Error fetching wishlist product IDs:", error);
          useWishlistStore.getState().setWishlistIds([]);
          return;
        }
        useWishlistStore
          .getState()
          .setWishlistIds((data || []).map((row) => row.product_id));
      });

    return () => {
      isMounted = false;
    };
  }, [initialWishlistIds, user]);

  return null;
}
