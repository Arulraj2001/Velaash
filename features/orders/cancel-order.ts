import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function executeOrderCancellation(
  adminSupabase: ReturnType<typeof createAdminClient>,
  params: {
    orderNumber: string;
    userId: string;
    userEmail?: string | null;
    reason?: string;
    isAdmin?: boolean;
  }
): Promise<{ success: boolean; error?: string; orderNumber?: string }> {
  const { orderNumber, userId, userEmail, reason, isAdmin } = params;

  const { data, error } = await adminSupabase.rpc("cancel_order_atomic", {
    p_order_number: orderNumber,
    p_user_id: userId,
    p_user_email: userEmail || null,
    p_reason: reason?.trim() || null,
    p_is_admin: Boolean(isAdmin),
  });

  if (error) {
    console.error("Failed to cancel order atomically:", error);
    return {
      success: false,
      error: "Failed to cancel order and restore inventory. Please try again.",
    };
  }

  const result = data?.[0];
  if (!result?.cancelled) {
    return {
      success: false,
      error: result?.error_message || "Order could not be cancelled.",
    };
  }

  return { success: true, orderNumber };
}