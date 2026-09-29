import { create } from "zustand";
import {
  toggleWishlistAction,
  removeFromWishlistAction,
} from "../actions/wishlist-actions";

export interface WishlistStoreState {
  wishlistIds: string[];
  isInitialized: boolean;
  setWishlistIds: (ids: string[]) => void;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (
    productId: string
  ) => Promise<{ success: boolean; isWishlisted: boolean; error?: string }>;
  removeFromWishlist: (productId: string) => Promise<{ success: boolean; error?: string }>;
  getCount: () => number;
}

export const useWishlistStore = create<WishlistStoreState>()((set, get) => ({
  wishlistIds: [],
  isInitialized: false,

  setWishlistIds: (ids: string[]) => {
    set({ wishlistIds: Array.from(new Set(ids)), isInitialized: true });
  },

  isWishlisted: (productId: string) => {
    return get().wishlistIds.includes(productId);
  },

  getCount: () => {
    return get().wishlistIds.length;
  },

  toggleWishlist: async (productId: string) => {
    const previousIds = get().wishlistIds;
    const isCurrentlyIn = previousIds.includes(productId);
    const nextIds = isCurrentlyIn
      ? previousIds.filter((id) => id !== productId)
      : [...previousIds, productId];

    // 1. Optimistic immediate state update (<1ms UI reaction)
    set({ wishlistIds: nextIds });

    try {
      // 2. Call server action
      const result = await toggleWishlistAction(productId);

      if (!result.success) {
        // 3. Rollback immediately if server action fails
        set({ wishlistIds: previousIds });
        return {
          success: false,
          isWishlisted: isCurrentlyIn,
          error: result.error || "Failed to update wishlist.",
        };
      }

      // Reconcile with verified server response
      const serverWishlisted = Boolean(result.isWishlisted);
      set((state) => ({
        wishlistIds: serverWishlisted
          ? Array.from(new Set([...state.wishlistIds, productId]))
          : state.wishlistIds.filter((id) => id !== productId),
      }));

      return {
        success: true,
        isWishlisted: serverWishlisted,
      };
    } catch {
      // Rollback on unhandled exception
      set({ wishlistIds: previousIds });
      return {
        success: false,
        isWishlisted: isCurrentlyIn,
        error: "Network error while updating wishlist.",
      };
    }
  },

  removeFromWishlist: async (productId: string) => {
    const previousIds = get().wishlistIds;
    set({ wishlistIds: previousIds.filter((id) => id !== productId) });

    try {
      const result = await removeFromWishlistAction(productId);
      if (!result.success) {
        set({ wishlistIds: previousIds });
        return {
          success: false,
          error: result.error || "Failed to remove item from wishlist.",
        };
      }
      return { success: true };
    } catch {
      set({ wishlistIds: previousIds });
      return {
        success: false,
        error: "Network error while removing from wishlist.",
      };
    }
  },
}));
