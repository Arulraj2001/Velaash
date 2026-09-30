"use server";

import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ShiprocketTrackingResult } from "@/lib/shiprocket";

export interface RefreshTrackingResult {
  success: boolean;
  error?: string;
  tracking?: ShiprocketTrackingResult;
  /** true when tracking came from live Shiprocket API */
  isLive?: boolean;
}

/**
 * Fetches live tracking status from Shiprocket for the given AWB code.
 * Called from both:
 *   - Admin order detail view (admin "Refresh Tracking" button)
 *   - Customer account order detail page
 *   - Guest tracking form
 *
 * This is the chosen approach over webhooks because:
 *   a) Shiprocket webhooks require a publicly accessible HTTPS URL (not possible during dev)
 *   b) Webhook registration is manual per channel in their dashboard — fragile for small stores
 *   c) On-demand polling fits the volume of a boutique D2C store perfectly
 *   d) Customer controls when to refresh — no background polling costs
 *
 * Gracefully returns success: false if credentials are not configured (mock mode),
 * so the UI degrades to showing static AWB number without an error.
 */
export async function refreshShiprocketTrackingAction(
  awbCode: string
): Promise<RefreshTrackingResult> {
  if (!awbCode?.trim()) {
    return { success: false, error: "No AWB code provided." };
  }

  const { trackShipment, isShiprocketConfigured } = await import("@/lib/shiprocket");

  // Short-circuit if Shiprocket is not configured (unless tracking a simulated mock order)
  if (!isShiprocketConfigured() && !awbCode.startsWith("SRMOCK")) {
    return {
      success: false,
      error:
        "Live tracking is not enabled. AWB number is shown above — track it on the courier website.",
      isLive: false,
    };
  }

  try {
    const result = await trackShipment(awbCode.trim());

    if (!result) {
      return {
        success: false,
        error: "Shiprocket could not return tracking data. Try again in a few minutes.",
        isLive: true,
      };
    }

    return {
      success: true,
      tracking: result,
      isLive: true,
    };
  } catch (err) {
    console.error("[refreshShiprocketTrackingAction] error:", err);
    Sentry.captureException(err, { tags: { service: "shiprocket_tracking", awbCode } });
    return {
      success: false,
      error: "Failed to fetch live tracking. Please try again.",
      isLive: true,
    };
  }
}

/**
 * Admin-only: persists the latest Shiprocket tracking status to the order's audit log.
 * Called after a successful live tracking refresh in the admin view.
 */
export async function recordTrackingRefreshAction(
  orderNumber: string,
  currentStatus: string
): Promise<{ success: boolean }> {
  try {
    const adminSupabase = createAdminClient();
    const { data: order } = await adminSupabase
      .from("orders")
      .select("id")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (!order) return { success: false };

    await adminSupabase.from("order_status_history").insert({
      order_id: order.id,
      status: "shipped", // stays in shipped; this is just a note
      note: `[Shiprocket Tracking Refresh] Current status: ${currentStatus}`,
      created_by: null, // system-triggered
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}
