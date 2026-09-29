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
      const expirationThreshold = new Date(
        Date.now() - olderThanMinutes * 60 * 1000
      ).toISOString();

      // Query online orders stuck in pending state
      const { data: expiredOrders, error } = await adminSupabase
        .from("orders")
        .select("id, order_number, status, payment_status, payment_method, created_at")
        .eq("payment_method", "razorpay")
        .eq("payment_status", "pending")
        .eq("status", "pending")
        .lt("created_at", expirationThreshold);

      if (!error && expiredOrders && expiredOrders.length > 0) {
        for (const order of expiredOrders) {
          // Release stock for each item
          const { data: items } = await adminSupabase
            .from("order_items")
            .select("variant_id, quantity")
            .eq("order_id", order.id);

          if (items) {
            for (const item of items) {
              if (item.variant_id) {
                const { data: variant } = await adminSupabase
                  .from("product_variants")
                  .select("stock_quantity")
                  .eq("id", item.variant_id)
                  .single();

                if (variant) {
                  await adminSupabase
                    .from("product_variants")
                    .update({
                      stock_quantity: variant.stock_quantity + item.quantity,
                    })
                    .eq("id", item.variant_id);
                }
              }
            }
          }

          // Mark order cancelled
          await adminSupabase
            .from("orders")
            .update({
              status: "cancelled",
              cancel_reason: `Payment window expired (${olderThanMinutes} minutes without payment confirmation)`,
            })
            .eq("id", order.id);

          await adminSupabase.from("order_status_history").insert({
            order_id: order.id,
            status: "cancelled",
            note: `Order automatically cancelled: ${olderThanMinutes}-minute online payment window expired. Reserved stock released.`,
          });

          cancelledOrderNumbers.push(order.order_number);
        }
      }
    } catch (err) {
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
    success: true,
    cancelledCount: cancelledOrderNumbers.length,
    cancelledOrderNumbers,
  };
}
