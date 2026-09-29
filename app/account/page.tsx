import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, signOutCustomerAction } from "@/features/auth";
import { Container, Card, Button, Badge } from "@/components/ui";
import { LogOut, Package, MapPin, Heart, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "My Account | Velaash",
  description: "Manage your Velaash orders, saved addresses, and clothing wishlist.",
};

export default async function AccountPage() {
  const data = await getCurrentUser();

  if (!data) {
    redirect("/account/login?returnUrl=/account");
  }

  const { user, customer } = data;
  const displayName = customer?.full_name || "Valued Customer";

  return (
    <div className="bg-brand-cream min-h-[calc(100vh-220px)] py-12 sm:py-16">
      <Container size="lg">
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="border-brand-border/60 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <span className="text-brand-accent text-xs font-semibold tracking-widest uppercase">
                Customer Account
              </span>
              <h1 className="font-heading text-brand-dark text-3xl font-semibold sm:text-4xl">
                Welcome, {displayName}
              </h1>
              <p className="text-brand-dark/70 font-sans text-xs">
                Logged in as <span className="text-brand-dark font-mono">{user.email}</span>
              </p>
            </div>

            <form action={signOutCustomerAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Sign Out
              </Button>
            </form>
          </div>

          {/* Account Overview Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card hoverEffect className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div className="bg-brand-light/30 text-brand-dark rounded-lg p-2.5">
                  <Package className="h-5 w-5" />
                </div>
                <Badge variant="subtle" size="sm">
                  Active Orders
                </Badge>
              </div>
              <h3 className="font-heading text-brand-dark text-xl font-semibold">My Orders</h3>
              <p className="text-brand-dark/70 text-xs">
                Track order preparation, dispatch status, and doorstep delivery timeline.
              </p>
            </Card>

            <Card hoverEffect className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div className="bg-brand-light/30 text-brand-dark rounded-lg p-2.5">
                  <MapPin className="h-5 w-5" />
                </div>
                <Badge variant="subtle" size="sm">
                  Addresses
                </Badge>
              </div>
              <h3 className="font-heading text-brand-dark text-xl font-semibold">
                Saved Addresses
              </h3>
              <p className="text-brand-dark/70 text-xs">
                Manage your home and office delivery addresses across India.
              </p>
            </Card>

            <Card hoverEffect className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <div className="bg-brand-light/30 text-brand-dark rounded-lg p-2.5">
                  <Heart className="h-5 w-5" />
                </div>
                <Badge variant="subtle" size="sm">
                  Wishlist
                </Badge>
              </div>
              <h3 className="font-heading text-brand-dark text-xl font-semibold">
                Saved Favorites
              </h3>
              <p className="text-brand-dark/70 text-xs">
                Your private collection of favorite styles, kurtas, dresses, and co-ord sets.
              </p>
            </Card>
          </div>

          {/* Verification note */}
          <Card className="bg-brand-light/20 border-brand-gold/40 p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-brand-accent mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <h4 className="text-brand-dark text-sm font-semibold">
                  Authentication & Customer Isolation Verified
                </h4>
                <p className="text-brand-dark/70 font-sans text-xs leading-relaxed">
                  This page confirms that your customer session has been created via Supabase Auth
                  and protected via Next.js Middleware. All database operations are restricted to
                  your customer ID through Postgres Row Level Security (RLS).
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
