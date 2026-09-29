import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import {
  getCustomerWishlist,
  WishlistView,
  WishlistSync,
} from "@/features/wishlist";

export const metadata: Metadata = {
  title: "My Wishlist | Velaash",
  description: "View and manage your curated collection of favorite Velaash styles.",
};

export default async function WishlistPage() {
  const authData = await getCurrentUser();

  if (!authData || !authData.user) {
    redirect("/account/login?returnUrl=/account/wishlist");
  }

  const wishlistData = await getCustomerWishlist(authData.user.id);

  return (
    <>
      <WishlistSync initialWishlistIds={wishlistData.wishlistProductIds} />
      <WishlistView initialProducts={wishlistData.products} />
    </>
  );
}
