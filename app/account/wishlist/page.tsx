import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import { Button, Badge } from "@/components/ui";
import { Heart, ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "My Wishlist | Velaash",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WishlistPage() {
  const authData = await getCurrentUser();

  if (!authData || !authData.user) {
    redirect("/account/login?returnUrl=/account/wishlist");
  }

  return (
    <div className="rounded-2xl border border-brand-border/70 bg-white p-8 shadow-sm text-center space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <Heart className="h-7 w-7" />
      </div>

      <div className="space-y-1">
        <Badge variant="subtle" size="sm" className="mb-2">
          Phase 4B Upcoming
        </Badge>
        <h2 className="font-heading text-2xl font-semibold text-brand-dark">
          Your Curated Wishlist
        </h2>
        <p className="text-xs text-brand-dark/60 max-w-md mx-auto leading-relaxed">
          Save your favorite handcrafted kurtas, silk sarees, and contemporary ensembles to review anytime. This module is scheduled for Phase 4B.
        </p>
      </div>

      <div className="pt-2">
        <Link href="/shop">
          <Button variant="primary" size="sm" leftIcon={<ShoppingBag className="h-4 w-4" />}>
            Explore Catalog
          </Button>
        </Link>
      </div>
    </div>
  );
}
