import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import { getCustomerOrders, OrderStatusBadge } from "@/features/orders";
import { Button } from "@/components/ui";
import { OrderStatusFilter } from "./components/order-status-filter";
import {
  Package,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Order History | Velaash",
  description: "Track and review all your handcrafted Indian wear orders with Velaash.",
  robots: {
    index: false,
    follow: false,
  },
};

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
  }>;
}

export default async function OrdersHistoryPage(props: OrdersPageProps) {
  const authData = await getCurrentUser();

  if (!authData || !authData.user) {
    redirect("/account/login?returnUrl=/account/orders");
  }

  const { user } = authData;
  const searchParams = await props.searchParams;

  const page = parseInt(searchParams.page || "1", 10) || 1;
  const statusFilter = searchParams.status || "all";

  const { orders, totalCount, totalPages, currentPage } = await getCustomerOrders(
    user.id,
    user.email,
    {
      page,
      limit: 8,
      status: statusFilter,
    }
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-brand-border/70 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-brand-dark tracking-tight">
            Order History
          </h1>
          <p className="text-xs text-brand-dark/60 mt-1">
            Review and track all your previous and active clothing orders.
          </p>
        </div>

        <OrderStatusFilter />
      </div>

      {/* Orders List Container */}
      <div className="rounded-2xl border border-brand-border/70 bg-white p-6 shadow-sm">
        {orders.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-light/30 text-brand-dark/50">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-lg font-medium text-brand-dark">
                {statusFilter === "all"
                  ? "No orders found"
                  : `No ${statusFilter} orders found`}
              </h3>
              <p className="text-xs text-brand-dark/60 max-w-sm mx-auto">
                {statusFilter === "all"
                  ? "You have not placed any orders yet. Begin exploring our curated handcrafted Indian wear edits."
                  : `There are currently no orders matching the '${statusFilter}' status filter.`}
              </p>
            </div>
            <Link href="/shop">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ShoppingBag className="h-4 w-4" />}
              >
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              const isCod = order.paymentMethod === "cod";

              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-brand-border/60 p-5 hover:border-brand-gold/60 transition-all bg-white hover:shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start gap-4">
                    <div className="relative h-18 w-18 shrink-0 rounded-xl overflow-hidden bg-brand-cream border border-brand-border/60">
                      {order.firstItemImage ? (
                        <Image
                          src={order.firstItemImage}
                          alt={order.firstItemTitle || "Order garment"}
                          fill
                          sizes="72px"
                          className="object-cover object-top"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-brand-dark/30">
                          <Package className="h-7 w-7" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-brand-dark">
                          #{order.orderNumber}
                        </span>
                        <OrderStatusBadge status={order.status} size="sm" />
                      </div>

                      <h4 className="text-xs font-medium text-brand-dark line-clamp-1">
                        {order.firstItemTitle || "Handcrafted Outfit"}
                        {order.itemCount > 1 && (
                          <span className="text-brand-dark/50 font-normal ml-1">
                            +{order.itemCount - 1} more
                          </span>
                        )}
                      </h4>

                      <div className="flex items-center gap-3 text-[11px] text-brand-dark/60 font-sans flex-wrap">
                        <span>Ordered on {formattedDate}</span>
                        <span>•</span>
                        <span>{order.itemCount} {order.itemCount === 1 ? "item" : "items"}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-medium">
                          {isCod ? (
                            <>
                              <Banknote className="h-3 w-3 text-brand-accent" /> Cash on Delivery
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-3 w-3 text-brand-accent" /> Online (Razorpay)
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Total & Action */}
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-brand-border/40">
                    <div className="md:text-right">
                      <p className="text-[11px] uppercase tracking-wider text-brand-dark/50 font-medium">
                        Total Amount
                      </p>
                      <p className="font-heading text-lg font-semibold text-brand-dark">
                        ₹{order.totalAmount.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <Link href={`/account/orders/${order.orderNumber}`}>
                      <Button variant="outline" size="sm" className="text-xs font-medium">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-brand-border/60 pt-5 mt-6 text-xs text-brand-dark/70">
            <span>
              Page <strong className="text-brand-dark">{currentPage}</strong> of{" "}
              <strong className="text-brand-dark">{totalPages}</strong> ({totalCount} total orders)
            </span>

            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={`/account/orders?page=${currentPage - 1}${
                    statusFilter !== "all" ? `&status=${statusFilter}` : ""
                  }`}
                >
                  <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}>
                    Previous
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}>
                  Previous
                </Button>
              )}

              {currentPage < totalPages ? (
                <Link
                  href={`/account/orders?page=${currentPage + 1}${
                    statusFilter !== "all" ? `&status=${statusFilter}` : ""
                  }`}
                >
                  <Button variant="outline" size="sm" rightIcon={<ChevronRight className="h-3.5 w-3.5" />}>
                    Next
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled rightIcon={<ChevronRight className="h-3.5 w-3.5" />}>
                  Next
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
