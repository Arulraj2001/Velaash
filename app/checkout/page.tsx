import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Secure Checkout | Velaash",
  description: "Complete your luxury boutique order with Velaash.",
};

export default function CheckoutPage() {
  return (
    <div className="bg-brand-cream/40 min-h-[calc(100vh-250px)] py-12 font-sans sm:py-16">
      <Container size="md">
        <div className="border-brand-border/80 shadow-luxury space-y-6 rounded-2xl border bg-white p-8 text-center sm:p-12">
          <div className="bg-brand-light/60 text-brand-gold border-brand-gold/30 mx-auto flex h-16 w-16 items-center justify-center rounded-full border">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="text-brand-accent text-[11px] font-semibold tracking-widest uppercase">
              Secure Patron Checkout
            </span>
            <h1 className="font-heading text-brand-dark text-2xl font-semibold sm:text-3xl">
              Order Checkout Gateway
            </h1>
            <p className="text-brand-dark/70 mx-auto max-w-md text-xs leading-relaxed sm:text-sm">
              You are on the secure checkout step. Integrated Razorpay & UPI payment processing,
              address selection, and automated order placement will arrive in Phase 2C.
            </p>
          </div>

          <div className="border-brand-border/60 bg-brand-light/20 text-brand-dark/80 mx-auto max-w-sm space-y-2 rounded-xl border p-4 text-xs">
            <div className="flex items-center justify-center gap-2 font-semibold text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              <span>256-bit SSL Encrypted Transaction</span>
            </div>
            <p className="text-brand-dark/60 text-[11px]">
              Your cart items and size selections are preserved in your active guest session.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <Link href="/shop" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Continue Shopping
              </Button>
            </Link>
            <Link href="/cart" className="w-full sm:w-auto">
              <Button variant="primary" size="sm" leftIcon={<Sparkles className="h-4 w-4" />}>
                View Shopping Bag
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
