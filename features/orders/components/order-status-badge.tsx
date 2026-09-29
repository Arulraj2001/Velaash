import React from "react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "../types";
import { Clock, CheckCircle2, Package, Truck, XCircle, AlertCircle } from "lucide-react";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
  size?: "sm" | "md";
}

export function OrderStatusBadge({
  status,
  className,
  size = "md",
}: OrderStatusBadgeProps) {
  let label = "Processing";
  let colorClasses = "bg-brand-cream/80 text-brand-dark border-brand-border";
  let icon = <Clock className="h-3.5 w-3.5" />;

  switch (status) {
    case "pending":
      label = "Payment Pending";
      colorClasses = "bg-sky-50 text-sky-800 border-sky-200";
      icon = <Clock className="h-3.5 w-3.5 text-sky-600" />;
      break;

    case "confirmed":
      label = "Confirmed";
      colorClasses = "bg-blue-50 text-blue-800 border-blue-200";
      icon = <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />;
      break;

    case "packed":
      label = "Packed & Ready";
      colorClasses = "bg-amber-50 text-amber-900 border-amber-200";
      icon = <Package className="h-3.5 w-3.5 text-amber-700" />;
      break;

    case "shipped":
      label = "Dispatched";
      colorClasses = "bg-amber-50 text-amber-900 border-amber-200";
      icon = <Truck className="h-3.5 w-3.5 text-amber-700" />;
      break;

    case "out_for_delivery":
      label = "Out for Delivery";
      colorClasses = "bg-amber-50 text-amber-900 border-amber-200";
      icon = <Truck className="h-3.5 w-3.5 text-amber-700" />;
      break;

    case "delivered":
      label = "Delivered";
      colorClasses = "bg-emerald-50 text-emerald-900 border-emerald-200";
      icon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
      break;

    case "cancelled":
      label = "Cancelled";
      colorClasses = "bg-rose-50 text-rose-800 border-rose-200";
      icon = <XCircle className="h-3.5 w-3.5 text-rose-600" />;
      break;

    case "refunded":
      label = "Refunded";
      colorClasses = "bg-purple-50 text-purple-800 border-purple-200";
      icon = <AlertCircle className="h-3.5 w-3.5 text-purple-600" />;
      break;

    case "payment_failed":
      label = "Payment Failed";
      colorClasses = "bg-rose-50 text-rose-800 border-rose-200";
      icon = <AlertCircle className="h-3.5 w-3.5 text-rose-600" />;
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        colorClasses,
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
