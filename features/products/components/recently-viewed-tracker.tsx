"use client";

import { useEffect } from "react";
import type { ProductDetailItem } from "../types";
import { useRecentlyViewed } from "../hooks/use-recently-viewed";

interface RecentlyViewedTrackerProps {
  product: ProductDetailItem;
}

/**
 * Invisible client-side component that records the active product into localStorage.
 */
export function RecentlyViewedTracker({ product }: RecentlyViewedTrackerProps) {
  const { recordProduct } = useRecentlyViewed();

  useEffect(() => {
    if (product && product.id) {
      recordProduct(product);
    }
  }, [product, recordProduct]);

  return null;
}
