"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeOrderCancellation } from "@/features/orders/cancel-order";

export interface CancelOrderResult {
  success: boolean;
  error?: string;
  orderNumber?: string;
}

/**
 * Server Action for an authenticated customer to cancel their own order.
 * - Enforces authentication
 * - Delegates to executeOrderCancellation
 * - Revalidates customer account paths
 */
export async function cancelCustomerOrderAction(
  orderNumber: string,
  reason?: string
): Promise<CancelOrderResult> {
  try {
    // 1. Authenticate user
    const authData = await getCurrentUser();
    if (!authData || !authData.user) {
      return {
        success: false,
        error: "Please sign in to cancel your order.",
      };
    }

    const { user } = authData;

    let adminSupabase: ReturnType<typeof createAdminClient>;
    try {
      adminSupabase = createAdminClient();
    } catch {
      return {
        success: false,
        error: "Server database configuration unavailable.",
      };
    }

    const result = await executeOrderCancellation(adminSupabase, {
      orderNumber,
      userId: user.id,
      userEmail: user.email,
      reason,
    });

    if (result.success) {
      // Revalidate routes
      revalidatePath("/account");
      revalidatePath("/account/orders");
      revalidatePath(`/account/orders/${orderNumber}`);
    }

    return result;
  } catch (err) {
    console.error("Unexpected error in cancelCustomerOrderAction:", err);
    return {
      success: false,
      error: "An unexpected error occurred while cancelling your order.",
    };
  }
}
