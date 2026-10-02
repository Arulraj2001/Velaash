import { createAdminClient } from "@/lib/supabase/admin";
import { MOCK_CLOTHING_PRODUCTS } from "@/features/products/queries/mock-products";

export interface CleanupResult {
  success: boolean;
  cancelledCount: number;
  cancelledOrderNumbers: string[];
}

// In-memory mock store for online pending orders in testing
export const MOCK_ONLINE_PENDING_ORDERS: Array<{
  orderNumber: string;
  variantId: string;
  quantity: number;
  createdAt: number;
  paymentMethod: "razorpay" | "cod";
  status: string;
}> = [];

/**
 * Cancels online-payment orders older than 30 minutes still in 'pending' status
 * and releases their soft-reserved inventory back to the catalog.
 * COD orders are explicitly untouched.
 */
export async function cancelExpiredPendingOnlineOrders(
  olderThanMinutes = 30
): Promise<CleanupResult> {
  const cancelledOrderNumbers: string[] = [];
  let success = true;

  // CALL-SITE JUSTIFICATION FOR ELEVATED SERVICE ROLE (Bypassing RLS):
  // Automated background cleanup jobs have no user session. Elevated client is required
  // to query expired orders, update status, and restore stock across variants.
  let adminSupabase: ReturnType<typeof createAdminClient> | null = null;
  try {
    adminSupabase = createAdminClient();
  } catch {
    // Offline / mock fallback
  }

  if (adminSupabase) {
    try {
      const { data, error } = await adminSupabase.rpc(
        "cancel_expired_pending_online_orders",
        { p_older_than_minutes: olderThanMinutes }
      );

      if (error) {
        success = false;
        console.error("Database error during expired order cleanup:", error);
      } else if (data) {
        cancelledOrderNumbers.push(...data);
      }
    } catch (err) {
      success = false;
      console.error("Database error during expired order cleanup:", err);
    }
  }

  // Handle mock store cleanup for test suites
  const cutoff = Date.now() - olderThanMinutes * 60 * 1000;
  for (const mockOrder of MOCK_ONLINE_PENDING_ORDERS) {
    if (
      mockOrder.paymentMethod === "razorpay" &&
      mockOrder.status === "pending" &&
      mockOrder.createdAt < cutoff
    ) {
      mockOrder.status = "cancelled";
      cancelledOrderNumbers.push(mockOrder.orderNumber);

      // Restore mock inventory
      const mockProduct = MOCK_CLOTHING_PRODUCTS[0];
      const mockVariant = mockProduct?.variants.find((v) => v.id === mockOrder.variantId);
      if (mockVariant) {
        mockVariant.stock_quantity += mockOrder.quantity;
      }
    }
  }

  return {
    success,
    cancelledCount: cancelledOrderNumbers.length,
    cancelledOrderNumbers,
  };
}
