import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import { getCustomerOrders, OrderStatusBadge } from "@/features/orders";
import { Card, Button, Badge } from "@/components/ui";
import {
  Package,
  ArrowRight,
  AlertCircle,
  ShoppingBag,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Account Overview | Velaash",
  description: "Overview of your Velaash orders and account status.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountPage() {
  const authData = await getCurrentUser();

  if (!authData || !authData.user) {
    redirect("/account/login?returnUrl=/account");
  }

  const { user, customer } = authData;

  // Check if profile is missing full name or phone number
  const isProfileIncomplete = !customer?.full_name || !customer?.phone;

  // Fetch recent orders (last 3)
  const { orders, totalCount } = await getCustomerOrders(user.id, user.email, {
    limit: 3,
  });

  const activeOrdersCount = orders.filter((o) =>
    ["pending", "confirmed", "packed", "shipped", "out_for_delivery"].includes(o.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* Profile Incomplete Banner */}
      {isProfileIncomplete && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-heading text-sm font-semibold text-amber-950">
                  Complete your profile
                </h4>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  Add your contact phone number and full name to enable seamless doorstep deliveries and SMS dispatch updates.
                </p>
              </div>
            </div>

            <Link href="/account/settings">
              <Button variant="secondary" size="sm" className="whitespace-nowrap">
                Complete Profile
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Orders */}
        <Card className="p-5 bg-white border border-brand-border/70 hover:border-brand-gold/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Total Orders
            </span>
            <div className="p-2 rounded-lg bg-brand-light/30 text-brand-dark">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-heading text-3xl font-semibold text-brand-dark">
              {totalCount}
            </span>
            <Link
              href="/account/orders"
              className="text-xs text-brand-accent hover:underline inline-flex items-center gap-1 font-medium"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* Card 2: Active Orders */}
        <Card className="p-5 bg-white border border-brand-border/70 hover:border-brand-gold/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Active Orders
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-heading text-3xl font-semibold text-brand-dark">
              {activeOrdersCount}
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              In Transit / Prep
            </span>
          </div>
        </Card>

        {/* Card 3: Membership Status */}
        <Card className="p-5 bg-white border border-brand-border/70 hover:border-brand-gold/60 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Membership
            </span>
            <div className="p-2 rounded-lg bg-brand-gold/20 text-brand-dark">
              <Sparkles className="h-4 w-4 text-brand-accent" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-heading text-2xl font-semibold text-brand-dark">
              Member
            </span>
            <Badge variant="subtle" size="sm">
              Verified
            </Badge>
          </div>
        </Card>
      </div>

      {/* Recent Orders Preview */}
      <div className="rounded-2xl border border-brand-border/70 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-4">
          <div>
            <h2 className="font-heading text-xl font-semibold text-brand-dark">
              Recent Orders
            </h2>
            <p className="text-xs text-brand-muted">
              Preview of your most recent apparel purchases and delivery states.
            </p>
          </div>

          {totalCount > 0 && (
            <Link
              href="/account/orders"
              className="text-xs font-medium text-brand-accent hover:text-brand-dark hover:underline flex items-center gap-1"
            >
              View All Orders ({totalCount}) <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-light/30 text-brand-muted">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-medium text-brand-dark">
                No orders yet
              </h3>
              <p className="text-xs text-brand-muted max-w-sm mx-auto">
                Explore our handcrafted Indian ethnic wear, festive ensembles, and breezy everyday luxury.
              </p>
            </div>
            <Link href="/shop">
              <Button variant="primary" size="sm" leftIcon={<ShoppingBag className="h-4 w-4" />}>
                Explore Collection
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-brand-border/60">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={order.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    {/* Item Thumbnail */}
                    <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-brand-cream border border-brand-border/60">
                      {order.firstItemImage ? (
                        <Image
                          src={order.firstItemImage}
                          alt={order.firstItemTitle || "Order item"}
                          fill
                          sizes="64px"
                          className="object-cover object-top"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-brand-subtle">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Order Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-brand-dark">
                          #{order.orderNumber}
                        </span>
                        <OrderStatusBadge status={order.status} size="sm" />
                      </div>

                      <p className="text-xs text-brand-muted line-clamp-1">
                        {order.firstItemTitle || "Ethnic apparel ensemble"}
                        {order.itemCount > 1 && (
                          <span className="text-brand-muted ml-1">
                            +{order.itemCount - 1} more item{order.itemCount > 2 ? "s" : ""}
                          </span>
                        )}
                      </p>

                      <p className="text-[11px] text-brand-muted">
                        Placed on {formattedDate}
                      </p>
                    </div>
                  </div>

                  {/* Price & Link */}
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-brand-border/40">
                    <span className="font-heading text-base font-semibold text-brand-dark">
                      ₹{order.totalAmount.toLocaleString("en-IN")}
                    </span>

                    <Link href={`/account/orders/${order.orderNumber}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
