import { z } from "zod";

export type CouponDiscountType = "percentage" | "flat";
export type CouponComputedStatus = "active" | "expired" | "scheduled" | "inactive";

export interface AdminCoupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  computedStatus: CouponComputedStatus;
  ordersCount: number;
}

/**
 * Computes live coupon operational status based on active flag and validity window.
 */
export function getCouponComputedStatus(
  coupon: {
    isActive: boolean;
    validFrom: string;
    validUntil: string;
  },
  now: Date = new Date()
): CouponComputedStatus {
  if (!coupon.isActive) {
    return "inactive";
  }

  const from = new Date(coupon.validFrom);
  const until = new Date(coupon.validUntil);

  if (now.getTime() < from.getTime()) {
    return "scheduled";
  }

  if (now.getTime() > until.getTime()) {
    return "expired";
  }

  return "active";
}

export const COUPON_STATUS_LABELS: Record<CouponComputedStatus, string> = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  inactive: "Inactive",
};

export const COUPON_STATUS_STYLES: Record<
  CouponComputedStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  scheduled: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  expired: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  inactive: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

/**
 * Zod validation schema for creating and editing coupons.
 */
export const CouponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Coupon code must be at least 2 characters.")
      .max(30, "Coupon code cannot exceed 30 characters.")
      .regex(/^[A-Za-z0-9_-]+$/, "Coupon code can only contain letters, numbers, hyphens, and underscores.")
      .transform((val) => val.toUpperCase()),
    discountType: z.enum(["percentage", "flat"]),
    discountValue: z.coerce
      .number({ invalid_type_error: "Discount value must be a valid number." })
      .positive("Discount value must be greater than zero."),
    minOrderValue: z.coerce
      .number()
      .min(0, "Minimum order value cannot be negative.")
      .default(0),
    maxDiscountAmount: z.coerce
      .number()
      .positive("Max discount cap must be greater than zero.")
      .nullable()
      .optional(),
    usageLimit: z.coerce
      .number()
      .int("Usage limit must be an integer.")
      .min(1, "Usage limit must be at least 1, or leave empty for unlimited.")
      .nullable()
      .optional(),
    validFrom: z.string().min(1, "Valid from date is required."),
    validUntil: z.string().min(1, "Valid until date is required."),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    // 1. Percentage discount must not exceed 100%
    if (data.discountType === "percentage" && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage discount cannot exceed 100%.",
        path: ["discountValue"],
      });
    }

    // 2. Date validity order: validUntil must be after validFrom
    const fromTime = new Date(data.validFrom).getTime();
    const untilTime = new Date(data.validUntil).getTime();

    if (isNaN(fromTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid From date is invalid.",
        path: ["validFrom"],
      });
    }

    if (isNaN(untilTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid Until date is invalid.",
        path: ["validUntil"],
      });
    }

    if (!isNaN(fromTime) && !isNaN(untilTime) && untilTime <= fromTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid Until date must be later than Valid From date.",
        path: ["validUntil"],
      });
    }
  });

export type CouponFormData = z.infer<typeof CouponFormSchema>;
