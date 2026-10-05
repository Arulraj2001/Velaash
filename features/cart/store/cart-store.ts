import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, AppliedCoupon } from "../types";

export interface AddItemInput {
  productId: string;
  variantId?: string | null;
  title: string;
  slug: string;
  size?: string | null;
  color?: string | null;
  colorHex?: string | null;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  maxStock?: number;
  freeShippingActive?: boolean;
  freeShippingStart?: string | null;
  freeShippingEnd?: string | null;
  freeShippingBadgeText?: string | null;
}

export interface SyncItemUpdate {
  id: string;
  currentPrice: number;
  priceChanged: boolean;
  availableStock: number;
  isAvailable: boolean;
  adjustedQuantity: number;
  message?: string;
}

interface CartStoreState {
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  lastAddedItem: CartItem | null;
  lastAddedTimestamp: number | null;
  isToastVisible: boolean;
  addItem: (item: AddItemInput, quantity?: number) => { success: boolean; addedItem: CartItem };
  removeItem: (id: string) => CartItem | null;
  restoreItem: (item: CartItem, index?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemDetails: (id: string, updates: Partial<CartItem>) => void;
  syncValidatedItems: (validatedItems: SyncItemUpdate[]) => void;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  removeAppliedCoupon: () => void;
  clearCart: () => void;
  dismissToast: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      lastAddedItem: null,
      lastAddedTimestamp: null,
      isToastVisible: false,

      addItem: (itemInput, quantity = 1) => {
        const variantKey = itemInput.variantId || "simple";
        const id = `${itemInput.productId}-${variantKey}`;
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((i) => i.id === id);
        const maxStock = itemInput.maxStock ?? 10;
        let finalItem: CartItem;

        if (existingIndex > -1) {
          const existing = currentItems[existingIndex];
          const newQuantity = Math.min(existing.quantity + quantity, maxStock);
          const updatedItems = [...currentItems];
          finalItem = {
            ...existing,
            quantity: newQuantity,
            price: itemInput.price, // ensure latest price
            maxStock,
            isAvailable: true,
            freeShippingActive: itemInput.freeShippingActive ?? existing.freeShippingActive,
            freeShippingStart: itemInput.freeShippingStart ?? existing.freeShippingStart,
            freeShippingEnd: itemInput.freeShippingEnd ?? existing.freeShippingEnd,
            freeShippingBadgeText: itemInput.freeShippingBadgeText ?? existing.freeShippingBadgeText,
          };
          updatedItems[existingIndex] = finalItem;

          set({
            items: updatedItems,
            lastAddedItem: finalItem,
            lastAddedTimestamp: Date.now(),
            isToastVisible: true,
          });
        } else {
          finalItem = {
            id,
            productId: itemInput.productId,
            variantId: itemInput.variantId || "",
            title: itemInput.title,
            slug: itemInput.slug,
            size: itemInput.size || "",
            color: itemInput.color || "",
            colorHex: itemInput.colorHex || undefined,
            price: itemInput.price,
            compareAtPrice: itemInput.compareAtPrice,
            image: itemInput.image,
            quantity: Math.min(quantity, maxStock),
            maxStock,
            isAvailable: true,
            freeShippingActive: itemInput.freeShippingActive,
            freeShippingStart: itemInput.freeShippingStart,
            freeShippingEnd: itemInput.freeShippingEnd,
            freeShippingBadgeText: itemInput.freeShippingBadgeText,
          };

          set({
            items: [...currentItems, finalItem],
            lastAddedItem: finalItem,
            lastAddedTimestamp: Date.now(),
            isToastVisible: true,
          });
        }

        return { success: true, addedItem: finalItem };
      },

      removeItem: (id) => {
        const currentItems = get().items;
        const removedItem = currentItems.find((item) => item.id === id) || null;
        set({
          items: currentItems.filter((item) => item.id !== id),
        });
        return removedItem;
      },

      restoreItem: (item, index) => {
        set((state) => {
          if (state.items.some((i) => i.id === item.id)) {
            return state;
          }
          const newItems = [...state.items];
          if (typeof index === "number" && index >= 0 && index <= newItems.length) {
            newItems.splice(index, 0, item);
          } else {
            newItems.push(item);
          }
          return { items: newItems };
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === id) {
              const safeQty = Math.min(quantity, item.maxStock || 10);
              return { ...item, quantity: safeQty };
            }
            return item;
          }),
        }));
      },

      updateItemDetails: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        }));
      },

      syncValidatedItems: (validatedItems) => {
        set((state) => {
          const updated = state.items.map((item) => {
            const match = validatedItems.find((v) => v.id === item.id);
            if (!match) return item;
            return {
              ...item,
              price: match.currentPrice,
              priceUpdated: match.priceChanged,
              maxStock: match.availableStock,
              isAvailable: match.isAvailable,
              quantity: match.isAvailable
                ? Math.max(1, Math.min(item.quantity, match.adjustedQuantity))
                : item.quantity,
              availabilityWarning: match.message,
            };
          });
          return { items: updated };
        });
      },

      setAppliedCoupon: (coupon) => {
        set({ appliedCoupon: coupon });
      },

      removeAppliedCoupon: () => {
        set({ appliedCoupon: null });
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null, lastAddedItem: null, isToastVisible: false });
      },

      dismissToast: () => {
        set({ isToastVisible: false });
      },

      getTotalItems: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },
    }),
    {
      name: "velaash_guest_cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);
