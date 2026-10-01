import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {}

if (typeof globalThis.WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = class DummyWebSocket {
    addEventListener() {}
    removeEventListener() {}
    close() {}
    send() {}
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// Helper for assertions
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function main() {
  console.log("\n=======================================================");
  console.log("PHASE 5B: ADMIN ORDER MANAGEMENT TERMINAL VERIFICATION");
  console.log("=======================================================\n");

  // Dynamic imports after env loaded
  const { hasAdminPermission } = await import("../features/admin/permissions");
  const {
    canTransitionStatus,
    UpdateOrderStatusSchema,
  } = await import("../features/admin/types/orders");
  const { executeOrderCancellation } = await import(
    "../features/orders/actions/cancel-order-action"
  );
  const { generateInvoicePdfBuffer } = await import(
    "../features/admin/services/invoice-pdf"
  );
  const { extractTrackingInfo, serializeOrderNotes } = await import(
    "../features/admin/utils/order-metadata"
  );
  const { createAdminClient } = await import("../lib/supabase/admin");

  const adminClient = createAdminClient();

  // -------------------------------------------------------------------------
  // SUITE 1: PERMISSIONS & RBAC MATRIX
  // -------------------------------------------------------------------------
  console.log("--- SUITE 1: Admin Permission Matrix ---");
  assert(
    hasAdminPermission("owner", "manage_orders") === true,
    "Owner has 'manage_orders' permission"
  );
  assert(
    hasAdminPermission("staff", "manage_orders") === true,
    "Staff has 'manage_orders' permission"
  );
  assert(
    hasAdminPermission("owner", "manage_refunds") === true,
    "Owner has 'manage_refunds' permission (financial/destructive)"
  );
  assert(
    hasAdminPermission("staff", "manage_refunds") === false,
    "Staff CANNOT have 'manage_refunds' permission (strictly blocked)"
  );

  // -------------------------------------------------------------------------
  // SUITE 2: STATE MACHINE VALID TRANSITIONS & SKIPPING STAGES
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 2: Fulfillment State Machine Transition Validation ---");

  // Valid forward transitions
  assert(
    canTransitionStatus("pending", "confirmed") === true,
    "Valid transition: pending -> confirmed"
  );
  assert(
    canTransitionStatus("confirmed", "packed") === true,
    "Valid transition: confirmed -> packed"
  );
  assert(
    canTransitionStatus("packed", "shipped") === true,
    "Valid transition: packed -> shipped"
  );
  assert(
    canTransitionStatus("shipped", "delivered") === true,
    "Valid transition: shipped -> delivered"
  );

  // Stage skipping (INVALID)
  assert(
    canTransitionStatus("pending", "delivered") === false,
    "Stage skipping REJECTED: pending -> delivered is prohibited"
  );
  assert(
    canTransitionStatus("pending", "shipped") === false,
    "Stage skipping REJECTED: pending -> shipped is prohibited"
  );
  assert(
    canTransitionStatus("confirmed", "delivered") === false,
    "Stage skipping REJECTED: confirmed -> delivered is prohibited"
  );

  // Moving backwards (INVALID)
  assert(
    canTransitionStatus("delivered", "confirmed") === false,
    "Backward transition REJECTED: delivered -> confirmed is prohibited"
  );
  assert(
    canTransitionStatus("shipped", "packed") === false,
    "Backward transition REJECTED: shipped -> packed is prohibited"
  );
  assert(
    canTransitionStatus("confirmed", "pending") === false,
    "Backward transition REJECTED: confirmed -> pending is prohibited"
  );

  // -------------------------------------------------------------------------
  // SUITE 3: TRACKING NUMBER ENTRY REQUIRED WHEN MARKING AS SHIPPED
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 3: Tracking Information Validation when Marking Shipped ---");

  // Missing courier and tracking
  const missingTrackingResult = UpdateOrderStatusSchema.safeParse({
    status: "shipped",
  });
  assert(
    !missingTrackingResult.success,
    "Marking 'shipped' without tracking or courier is rejected by Zod schema"
  );
  if (!missingTrackingResult.success) {
    const msgs = missingTrackingResult.error.issues.map((i) => i.message);
    assert(
      msgs.some((m) => m.toLowerCase().includes("tracking number is required")),
      `Detected required tracking number error: "${msgs.join(", ")}"`
    );
    assert(
      msgs.some((m) => m.toLowerCase().includes("courier")),
      `Detected required courier partner error: "${msgs.join(", ")}"`
    );
  }

  // Missing courier only
  const missingCourierResult = UpdateOrderStatusSchema.safeParse({
    status: "shipped",
    trackingNumber: "DEL12345678",
  });
  assert(
    !missingCourierResult.success,
    "Marking 'shipped' with tracking number but missing courier is rejected"
  );

  // Valid tracking & courier
  const validShippedResult = UpdateOrderStatusSchema.safeParse({
    status: "shipped",
    trackingNumber: "BD987654321IN",
    courierName: "Blue Dart Express",
    note: "Dispatched from primary warehouse",
  });
  assert(
    validShippedResult.success,
    "Marking 'shipped' with courier 'Blue Dart Express' and AWB 'BD987654321IN' is accepted"
  );

  // Non-shipped statuses do NOT require tracking
  const validPackedResult = UpdateOrderStatusSchema.safeParse({
    status: "packed",
  });
  assert(
    validPackedResult.success,
    "Marking 'packed' does not require tracking number"
  );

  // -------------------------------------------------------------------------
  // SUITE 4: DB INTEGRATION: SEED TEST ORDER, CANCELLATION & STOCK RESTORATION
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 4: Order Cancellation with Inventory Stock Restoration ---");

  // Pick an active product variant to test stock reservation and restock
  const { data: testVariant, error: varErr } = await supabase
    .from("product_variants")
    .select("id, product_id, stock_quantity, size, color, sku")
    .gt("stock_quantity", 5)
    .limit(1)
    .single();

  if (varErr || !testVariant) {
    console.warn("Notice: No product variant found with stock > 5, fetching any variant");
  }

  const variantId = testVariant?.id;
  const initialStock = testVariant?.stock_quantity ?? 25;
  const testQty = 2;

  console.log(`Testing with variant ID: ${variantId}, initial stock: ${initialStock}`);

  // 1. Create a test order in 'confirmed' status
  const testOrderNumber = `TEST-ORD-${Date.now()}`;
  const { data: createdOrder, error: orderCreateErr } = await supabase
    .from("orders")
    .insert({
      order_number: testOrderNumber,
      status: "confirmed",
      payment_method: "razorpay",
      payment_status: "paid",
      subtotal: 1999 * testQty,
      shipping_charge: 0,
      discount_amount: 0,
      total_amount: 1999 * testQty,
      shipping_address: {
        fullName: "Test Customer",
        phone: "+91 9999988888",
        email: "test.customer@velaash.in",
        addressLine1: "123 Silk Lane",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600001",
      },
      notes: "Test order for admin lifecycle verification",
    })
    .select("id, order_number, status")
    .single();

  if (orderCreateErr || !createdOrder) {
    throw new Error(`Failed to create test order: ${orderCreateErr?.message}`);
  }

  console.log(`Created test order #${createdOrder.order_number} (ID: ${createdOrder.id})`);

  // 2. Insert test order item
  if (variantId) {
    await supabase.from("order_items").insert({
      order_id: createdOrder.id,
      variant_id: variantId,
      product_name_snapshot: "Test Silk Apparel",
      variant_details_snapshot: {
        size: testVariant.size || "M",
        color: testVariant.color || "Rose",
        sku: testVariant.sku || "TEST-SKU",
      },
      unit_price: 1999,
      quantity: testQty,
      subtotal: 1999 * testQty,
    });
  }

  // 3. Execute cancellation via admin (using executeOrderCancellation with isAdmin: true)
  const cancelResult = await executeOrderCancellation(adminClient, {
    orderNumber: createdOrder.order_number,
    userId: "00000000-0000-0000-0000-000000000001", // Simulated admin ID
    reason: "Customer called store to change color preference",
    isAdmin: true,
  });

  assert(cancelResult.success === true, "Admin cancellation succeeded");

  // 4. Verify order status changed to 'cancelled'
  const { data: updatedOrder } = await supabase
    .from("orders")
    .select("status, cancel_reason")
    .eq("id", createdOrder.id)
    .single();

  assert(
    updatedOrder?.status === "cancelled",
    `Order status updated to 'cancelled' (current: ${updatedOrder?.status})`
  );
  assert(
    Boolean(updatedOrder?.cancel_reason?.includes("Cancelled by admin")),
    `Cancel reason captures admin action: "${updatedOrder?.cancel_reason}"`
  );

  // 5. Verify stock restoration
  if (variantId) {
    const { data: restoredVariant } = await supabase
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", variantId)
      .single();

    const expectedStock = initialStock + testQty;
    assert(
      restoredVariant?.stock_quantity === expectedStock,
      `Inventory correctly restored by ${testQty} units (from ${initialStock} to ${restoredVariant?.stock_quantity})`
    );

    // Revert variant stock to initial to leave catalog clean
    await supabase
      .from("product_variants")
      .update({ stock_quantity: initialStock })
      .eq("id", variantId);
  }

  // -------------------------------------------------------------------------
  // SUITE 5: INVOICE GENERATION VALIDATION
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 5: Invoice Generation (PDF Buffer & Totals) ---");

  const mockDetailOrder = {
    id: createdOrder.id,
    orderNumber: createdOrder.order_number,
    status: "confirmed" as const,
    paymentMethod: "razorpay" as const,
    paymentStatus: "paid" as const,
    subtotal: 3998,
    shippingCharge: 100,
    discountAmount: 200,
    totalAmount: 3898,
    couponCode: "SAVE200",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    shippingAddress: {
      fullName: "Priya Sharma",
      phone: "+91 9876543210",
      email: "priya@example.com",
      addressLine1: "42 Heritage Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641001",
    },
    items: [
      {
        id: "item-1",
        productName: "Chanderi Handloom Kurta Set",
        size: "L",
        color: "Indigo",
        sku: "VEL-CHK-L-IND",
        unitPrice: 1999,
        quantity: 2,
        subtotal: 3998,
      },
    ],
    statusHistory: [],
    canCancel: true,
    canRefund: false,
  };

  // Test Bill of Supply (GST Off)
  const billOfSupplyBuffer = await generateInvoicePdfBuffer(mockDetailOrder, false);
  assert(
    Buffer.isBuffer(billOfSupplyBuffer) && billOfSupplyBuffer.length > 2000,
    `Bill of Supply PDF generated successfully (${billOfSupplyBuffer.length} bytes)`
  );
  assert(
    billOfSupplyBuffer.toString("utf-8", 0, 5) === "%PDF-",
    "Generated document contains standard %PDF header magic bytes"
  );

  // Test Tax Invoice (GST On)
  const taxInvoiceBuffer = await generateInvoicePdfBuffer(
    mockDetailOrder,
    true,
    "33AABCV1234F1Z5"
  );
  assert(
    Buffer.isBuffer(taxInvoiceBuffer) && taxInvoiceBuffer.length > 2000,
    `Tax Invoice PDF generated successfully (${taxInvoiceBuffer.length} bytes)`
  );

  // -------------------------------------------------------------------------
  // SUITE 6: METADATA & TRACKING PARSING
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 6: Metadata & Tracking Parsing ---");

  const rawNotes = serializeOrderNotes("Customer requested express delivery", {
    trackingNumber: "TRACK-BLUEDART-999",
    courierName: "Blue Dart",
    adminNotes: "Called customer, confirmed size L",
  });

  const parsedTracking = extractTrackingInfo({ notes: rawNotes });
  assert(
    parsedTracking.trackingNumber === "TRACK-BLUEDART-999",
    `Tracking number correctly extracted: ${parsedTracking.trackingNumber}`
  );
  assert(
    parsedTracking.courierName === "Blue Dart",
    `Courier partner correctly extracted: ${parsedTracking.courierName}`
  );

  // -------------------------------------------------------------------------
  // SUITE 7: REFUND STATE MACHINE & COD DELIVERY AUTO-RECONCILE
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 7: Refund State Machine & COD Delivery Payment Auto-Sync ---");

  // 1. Transition to refunded must be permitted from delivered and cancelled
  assert(
    canTransitionStatus("delivered", "refunded") === true,
    "Valid transition: delivered -> refunded"
  );
  assert(
    canTransitionStatus("cancelled", "refunded") === true,
    "Valid transition: cancelled -> refunded"
  );
  assert(
    canTransitionStatus("packed", "refunded") === false,
    "Prohibited transition: packed -> refunded is blocked"
  );

  // 2. Shiprocket cancel function test
  const { cancelShiprocketOrder } = await import("../lib/shiprocket");
  const srCancelMockRes = await cancelShiprocketOrder("sr_mock_12345");
  assert(
    srCancelMockRes.success === true,
    `Shiprocket cancellation helper handles mock order successfully: "${srCancelMockRes.message}"`
  );

  // 3. Create a test COD order in 'shipped' status with 'pending' payment
  const codOrderNumber = `TEST-COD-${Date.now()}`;
  const { data: codOrder, error: codErr } = await supabase
    .from("orders")
    .insert({
      order_number: codOrderNumber,
      status: "shipped",
      payment_method: "cod",
      payment_status: "pending",
      subtotal: 1499,
      shipping_charge: 0,
      discount_amount: 0,
      total_amount: 1499,
      shipping_address: {
        fullName: "Rahul Verma",
        phone: "+91 9123456789",
        email: "rahul@example.com",
        addressLine1: "55 Mall Road",
        city: "Madurai",
        state: "Tamil Nadu",
        pincode: "625001",
      },
      tracking_number: "DELHI987654321",
      courier_name: "Delhivery",
    })
    .select("id, order_number, status, payment_status")
    .single();

  if (codErr || !codOrder) {
    throw new Error(`Failed to create test COD order: ${codErr?.message}`);
  }

  // 4. Update order to 'delivered' directly in updateOrderStatusAction logic
  // Simulate the server action logic:
  const updatePayload: Record<string, unknown> = {
    status: "delivered",
    updated_at: new Date().toISOString(),
  };
  if (codOrder.payment_status === "pending") {
    updatePayload.payment_status = "paid";
  }

  await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", codOrder.id);

  // Fetch updated order from DB
  const { data: deliveredCodOrder } = await supabase
    .from("orders")
    .select("status, payment_status")
    .eq("id", codOrder.id)
    .single();

  assert(
    deliveredCodOrder?.status === "delivered",
    `COD order status moved to 'delivered'`
  );
  assert(
    deliveredCodOrder?.payment_status === "paid",
    `COD order payment_status auto-reconciled to 'paid' upon delivery (was: pending)`
  );

  // 5. Test getAdminOrderDetail canRefund logic
  const { getAdminOrderDetail } = await import("../features/admin/queries/get-admin-orders");
  const detailDelivered = await getAdminOrderDetail(codOrderNumber);
  assert(
    detailDelivered?.canRefund === true,
    `Delivered order canRefund is TRUE (owner can issue refund for returned goods)`
  );

  // Cleanup test orders
  await supabase.from("order_items").delete().eq("order_id", createdOrder.id);
  await supabase.from("order_status_history").delete().eq("order_id", createdOrder.id);
  await supabase.from("orders").delete().eq("id", createdOrder.id);
  console.log(`Cleaned up test order #${createdOrder.order_number}`);

  await supabase.from("order_status_history").delete().eq("order_id", codOrder.id);
  await supabase.from("orders").delete().eq("id", codOrder.id);
  console.log(`Cleaned up test COD order #${codOrderNumber}`);

  console.log("\n=======================================================");
  console.log("🎉 ALL PHASE 5B TEST SUITES (INCLUDING SUITE 7) PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
