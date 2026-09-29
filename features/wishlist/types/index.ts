import type { ProductListItem } from "@/features/products/types";

export interface WishlistItem {
  id: string;
  customerId: string;
  productId: string;
  createdAt: string;
  product?: ProductListItem | null;
}

export interface WishlistActionResult {
  success: boolean;
  error?: string;
  isWishlisted?: boolean;
  productId?: string;
}

export interface CustomerWishlistResponse {
  products: ProductListItem[];
  wishlistProductIds: string[];
  totalCount: number;
}
