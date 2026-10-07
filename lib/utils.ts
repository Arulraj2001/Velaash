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

/**
 * Canonical timezone for Velaash e-commerce operations across India.
 */
export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Formats a date string, timestamp, or Date object strictly in Indian Standard Time (IST).
 * Prevents UTC drift between serverless environments (Node.js on Vercel) and user browsers.
 *
 * Example: formatDateIST("2026-10-07T09:30:00Z") => "7 October 2026"
 */
export function formatDateIST(
  dateInput: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "object" && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  });
}

/**
 * Formats date and time strictly in Indian Standard Time (IST).
 * Example: formatDateTimeIST("2026-10-07T09:30:00Z") => "7 Oct 2026, 03:00 PM"
 */
export function formatDateTimeIST(
  dateInput: string | Date | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "object" && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  });
}

/**
 * Formats time only strictly in Indian Standard Time (IST).
 * Example: formatTimeIST("2026-10-07T09:30:00Z") => "03:00 PM"
 */
export function formatTimeIST(
  dateInput: string | Date | number | null | undefined
): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "object" && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
