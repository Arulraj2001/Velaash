"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "../types";

export interface AddItemInput {
  productId: string;
  variantId: string;
  title: string;
  slug: string;
  size: string;
  color: string;
  colorHex?: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  maxStock?: number;
}

interface CartStoreState {
  items: CartItem[];
  lastAddedItem: CartItem | null;
  lastAddedTimestamp: number | null;
  isToastVisible: boolean;
  addItem: (item: AddItemInput, quantity?: number) => { success: boolean; addedItem: CartItem };
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  dismissToast: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      lastAddedItem: null,
      lastAddedTimestamp: null,
      isToastVisible: false,

      addItem: (itemInput, quantity = 1) => {
        const id = `${itemInput.productId}-${itemInput.variantId}`;
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
            variantId: itemInput.variantId,
            title: itemInput.title,
            slug: itemInput.slug,
            size: itemInput.size,
            color: itemInput.color,
            colorHex: itemInput.colorHex,
            price: itemInput.price,
            compareAtPrice: itemInput.compareAtPrice,
            image: itemInput.image,
            quantity: Math.min(quantity, maxStock),
            maxStock,
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
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
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

      clearCart: () => {
        set({ items: [], lastAddedItem: null, isToastVisible: false });
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
      partialize: (state) => ({ items: state.items }),
    }
  )
);
