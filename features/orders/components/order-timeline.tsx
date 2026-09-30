import React from "react";
import { Check, Clock, Package, Truck, Home, XCircle } from "lucide-react";
import type { OrderStatus, OrderStatusHistoryRecord } from "../types";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  history: OrderStatusHistoryRecord[];
  createdAt: string;
}

interface StepDefinition {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  matchingStatuses: OrderStatus[];
}

const STANDARD_STEPS: StepDefinition[] = [
  {
    key: "placed",
    label: "Order Placed",
    description: "Order received & payment confirmed",
    icon: Clock,
    matchingStatuses: ["pending", "confirmed"],
  },
  {
    key: "packed",
    label: "Quality Check & Packed",
    description: "Handcrafted garment tailored & packed",
    icon: Package,
    matchingStatuses: ["packed"],
  },
  {
    key: "shipped",
    label: "Dispatched",
    description: "Handed over to delivery courier partner",
    icon: Truck,
    matchingStatuses: ["shipped", "out_for_delivery"],
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Successfully delivered to your doorstep",
    icon: Home,
    matchingStatuses: ["delivered"],
  },
];

export function OrderTimeline({ currentStatus, history, createdAt }: OrderTimelineProps) {
  const isCancelled = ["cancelled", "refunded", "payment_failed"].includes(currentStatus);

  // Map history events to timestamp lookup
  const historyMap = new Map<string, OrderStatusHistoryRecord>();
  history.forEach((h) => {
    historyMap.set(h.status, h);
  });

  // Determine which standard step index is currently reached
  let currentStepIdx = 0;
  if (currentStatus === "confirmed" || currentStatus === "pending") currentStepIdx = 0;
  else if (currentStatus === "packed") currentStepIdx = 1;
  else if (currentStatus === "shipped" || currentStatus === "out_for_delivery") currentStepIdx = 2;
  else if (currentStatus === "delivered") currentStepIdx = 3;

  // Format date helper
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (isCancelled) {
    const cancelRecord = historyMap.get("cancelled") || history[history.length - 1];
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <XCircle className="h-6 w-6 stroke-[2]" />
          </div>
          <div className="space-y-1">
            <h4 className="font-heading text-base font-semibold text-rose-900">
              Order Cancelled
            </h4>
            <p className="text-xs text-rose-700">
              {cancelRecord?.note || "This order was cancelled."}
            </p>
            {cancelRecord && (
              <p className="font-mono text-[11px] text-rose-600/80">
                {formatDate(cancelRecord.createdAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="relative">
        {/* Progress Bar (Desktop) */}
        <div className="hidden sm:block absolute top-5 left-6 right-6 h-0.5 bg-brand-border/60 -z-0">
          <div
            className="h-full bg-brand-gold transition-all duration-500"
            style={{
              width: `${(currentStepIdx / (STANDARD_STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-2">
          {STANDARD_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const isFuture = idx > currentStepIdx;

            // Find matching event timestamp from history
            let eventTime: string | null = null;
            if (idx === 0) {
              eventTime = createdAt;
            } else {
              for (const st of step.matchingStatuses) {
                const rec = historyMap.get(st);
                if (rec) {
                  eventTime = rec.createdAt;
                  break;
                }
              }
            }

            const StepIcon = step.icon;

            return (
              <div key={step.key} className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-2">
                {/* Node Circle */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors relative z-10",
                    isCompleted && "border-brand-gold bg-brand-gold text-brand-dark shadow-sm",
                    isCurrent && "border-brand-gold bg-brand-cream text-brand-dark ring-4 ring-brand-gold/20 shadow-sm",
                    isFuture && "border-brand-border/80 bg-white text-brand-subtle"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 stroke-[2.5]" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>

                {/* Text Details */}
                <div className="sm:text-center space-y-0.5">
                  <p
                    className={cn(
                      "text-xs font-semibold tracking-wide",
                      isCurrent ? "text-brand-dark font-bold" : isCompleted ? "text-brand-dark" : "text-brand-muted"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] text-brand-muted leading-tight hidden sm:block max-w-[140px]">
                    {step.description}
                  </p>
                  {eventTime && (isCompleted || isCurrent) && (
                    <p className="text-[11px] font-mono text-brand-accent font-medium pt-0.5">
                      {formatDate(eventTime)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
