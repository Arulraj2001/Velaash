"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProductListItem, ProductDetailItem } from "../types";

const STORAGE_KEY = "velaash_recently_viewed_v1";
const MAX_RECENT_ITEMS = 10;
const EVENT_NAME = "velaash:recently-viewed";

/**
 * Extracts essential card properties to keep localStorage lightweight.
 */
function sanitizeProduct(product: ProductListItem | ProductDetailItem): ProductListItem {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || null,
    category_id: product.category_id || null,
    category_name: product.category_name || null,
    category_slug: product.category_slug || null,
    parent_category_slug: product.parent_category_slug || null,
    base_price: Number(product.base_price) || 0,
    compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
    created_at: product.created_at || new Date().toISOString(),
    is_active: product.is_active !== false,
    is_featured: Boolean(product.is_featured),
    is_new: Boolean(product.is_new),
    stock_status: product.stock_status || "in_stock",
    images: Array.isArray(product.images) ? product.images.slice(0, 2) : [],
    variants: Array.isArray(product.variants) ? product.variants.slice(0, 5) : [],
    colors: Array.isArray(product.colors) ? product.colors : [],
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    total_stock: typeof product.total_stock === "number" ? product.total_stock : 10,
    rating: product.rating || null,
    has_variants: product.has_variants ?? (Array.isArray(product.variants) && product.variants.length > 1),
  };
}

function getStoredItems(): ProductListItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const syncItems = useCallback(() => {
    setItems(getStoredItems());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    syncItems();

    const handleCustomEvent = () => syncItems();
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) syncItems();
    };

    window.addEventListener(EVENT_NAME, handleCustomEvent);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener(EVENT_NAME, handleCustomEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [syncItems]);

  const recordProduct = useCallback((product: ProductListItem | ProductDetailItem) => {
    if (typeof window === "undefined" || !product?.id) return;
    try {
      const sanitized = sanitizeProduct(product);
      const current = getStoredItems().filter((item) => item.id !== sanitized.id);
      const next = [sanitized, ...current].slice(0, MAX_RECENT_ITEMS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setItems(next);
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch {
      // Storage quota or private browsing safeguard
    }
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      setItems([]);
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch {
      // Ignore
    }
  }, []);

  return {
    items,
    isLoaded,
    recordProduct,
    clearRecentlyViewed,
  };
}
