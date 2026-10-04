import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with clsx and merges conflicting Tailwind classes with tailwind-merge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a currency amount in Indian Rupees (INR).
 * Prepending the Rupee symbol directly avoids ICU space / non-breaking space mismatches between SSR and client.
 */
export function formatCurrencyINR(amount: number): string {
  if (typeof amount !== "number" || isNaN(amount)) return "₹0";
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
}

export const formatCurrency = formatCurrencyINR;
