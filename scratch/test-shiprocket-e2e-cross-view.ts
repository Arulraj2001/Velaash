export {};

/**
 * ==============================================================================
 * End-to-End Cross-View Verification: Shiprocket Push -> Admin & Customer Tracking
 * ==============================================================================
 *
 * Verifies that when an order is pushed to Shiprocket:
 * 1. The order status transitions to 'shipped' in PostgreSQL
 * 2. Dedicated tracking columns (tracking_number, courier_name, shiprocket_order_id, shiprocket_shipment_id)
 *    are populated accurately
 * 3. The Admin Order Detail view (getAdminOrderDetail) displays the exact tracking data
 * 4. The Customer Account Order Detail view (getCustomerOrderDetail) displays the identical tracking data
 * 5. The Guest Order Tracking view (trackGuestOrderAction) displays the identical tracking data
 * 6. The Refresh Tracking Action (refreshShiprocketTrackingAction) successfully returns tracking checkpoints
 * 7. Clean DB teardown leaves zero test artifacts
 */

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

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
    if (detail) console.log(`         ${detail}`);
  } else {
    console.error(`  [FAIL] ${testName}`);
    if (detail) console.error(`         Reason: ${detail}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

async function runCrossViewTest() {
  console.log("================================================================");
  console.log("  SHIPROCKET CROSS-VIEW INTEGRATION & DATA CONSISTENCY SUITE   ");
  console.log("================================================================\n");

  const { createAdminClient } = await import("../lib/supabase/admin");
  const { pushToShiprocketAction } = await import(
    "../features/admin/actions/order-actions"
  );
  const { getAdminOrderDetail } = await import(
    "../features/admin/queries/get-admin-orders"
  );
  const { getCustomerOrderDetail } = await import(
    "../features/orders/queries/get-customer-order-detail"
  );
  const { trackGuestOrderAction } = await import(
    "../features/orders/actions/track-guest-order-action"
  );
  const { refreshShiprocketTrackingAction } = await import(
    "../features/orders/actions/refresh-tracking-action"
  );

  const adminClient = createAdminClient();

  // 1. Fetch an active product variant to attach to test order
  const { data: dbVariant } = await adminClient
    .from("product_variants")
    .select("id, product_id, stock_quantity, products!inner(id, name, base_price, is_active)")
    .eq("products.is_active", true)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!dbVariant) {
    throw new Error("No active product variant found to seed test order.");
  }

  const testOrderNumber = `VEL-TEST-SR-${Date.now().toString().slice(-6)}`;
  const testCustomerEmail = "ananya.sengupta@example.com";
  const testCustomerPhone = "9876543210";
  const testCustomerId = "c3d0dec0-a43c-4711-9fcb-bdf3b77c5c87";

  console.log(`Creating test order ${testOrderNumber} in status 'packed'...`);

  const { data: createdOrder, error: orderInsertErr } = await adminClient
    .from("orders")
    .insert({
      order_number: testOrderNumber,
      customer_id: testCustomerId,
      status: "packed", // Packed and ready for carrier dispatch
      payment_method: "razorpay",
      payment_status: "paid",
      subtotal: 4250,
      shipping_charge: 0,
      discount_amount: 0,
      total_amount: 4250,
      shipping_address: {
        fullName: "Ananya Sengupta",
        email: testCustomerEmail,
        phone: testCustomerPhone,
        addressLine1: "Flat 301, Palm Meadows, Whitefield",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560066",
        addressType: "home",
      },
      billing_address: {
        fullName: "Ananya Sengupta",
        email: testCustomerEmail,
        phone: testCustomerPhone,
        addressLine1: "Flat 301, Palm Meadows, Whitefield",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560066",
        addressType: "home",
      },
      notes: "Please call before delivery",
    })
    .select("id")
    .single();

  if (orderInsertErr || !createdOrder) {
    throw new Error(`Failed to create test order: ${orderInsertErr?.message}`);
  }

  const orderId = createdOrder.id;

  // Insert line item
  await adminClient.from("order_items").insert({
    order_id: orderId,
    product_id: dbVariant.product_id,
    variant_id: dbVariant.id,
    product_name_snapshot: (dbVariant as unknown as { products: { name: string } }).products.name,
    variant_details_snapshot: { size: "M", color: "Indigo" },
    unit_price: 4250,
    quantity: 1,
    subtotal: 4250,
  });

  // Initial status history
  await adminClient.from("order_status_history").insert({
    order_id: orderId,
    status: "packed",
    note: "Order packed and ready for carrier dispatch",
  });

  try {
    // -------------------------------------------------------------------------
    // SUITE 1: PUSH TO SHIPROCKET
    // -------------------------------------------------------------------------
    console.log("\nSUITE 1: Push Order to Shiprocket via Admin Server Action");

    const { data: realAdmin } = await adminClient
      .from("admin_users")
      .select("id, role, full_name")
      .limit(1)
      .single();

    const adminSessionOverride = realAdmin
      ? {
          id: realAdmin.id,
          email: "admin@velaash.in",
          fullName: realAdmin.full_name,
          role: realAdmin.role as "owner" | "staff",
        }
      : {
          id: "c1111111-1111-4111-a111-111111111111",
          email: "admin@velaash.in",
          fullName: "Operations Manager",
          role: "owner" as const,
        };

    const pushResult = await pushToShiprocketAction(testOrderNumber, {
      adminSessionOverride,
    });

    assert(
      pushResult.success === true,
      "pushToShiprocketAction executes successfully for packed order",
      `AWB Code: ${pushResult.awbCode}, SR Order: ${pushResult.shiprocketOrderId}`
    );

    assert(
      typeof pushResult.awbCode === "string" && pushResult.awbCode.length > 5,
      "AWB tracking code is returned and non-empty",
      `AWB: ${pushResult.awbCode}`
    );

    const generatedAwb = pushResult.awbCode!;

    // -------------------------------------------------------------------------
    // SUITE 2: ADMIN VIEW CONSISTENCY
    // -------------------------------------------------------------------------
    console.log("\nSUITE 2: Admin Order Detail View Verification (getAdminOrderDetail)");

    const adminView = await getAdminOrderDetail(testOrderNumber);

    assert(adminView !== null, "getAdminOrderDetail returns the order record");
    assert(
      adminView?.status === "shipped",
      "Admin view shows status updated to 'shipped'",
      `Status: ${adminView?.status}`
    );
    assert(
      adminView?.trackingNumber === generatedAwb,
      "Admin view trackingNumber matches Shiprocket AWB exactly",
      `Admin trackingNumber: ${adminView?.trackingNumber}`
    );
    assert(
      Boolean(adminView?.courierName),
      "Admin view courierName is populated",
      `Courier: ${adminView?.courierName}`
    );
    assert(
      Boolean(adminView?.shiprocketOrderId),
      "Admin view shiprocketOrderId is recorded",
      `Shiprocket Order ID: ${adminView?.shiprocketOrderId}`
    );

    // -------------------------------------------------------------------------
    // SUITE 3: CUSTOMER ACCOUNT VIEW CONSISTENCY
    // -------------------------------------------------------------------------
    console.log("\nSUITE 3: Customer Account View Verification (getCustomerOrderDetail)");

    const customerView = await getCustomerOrderDetail(
      testOrderNumber,
      testCustomerId,
      testCustomerEmail
    );

    assert(customerView !== null, "getCustomerOrderDetail returns order for authorized owner");
    assert(
      customerView?.status === "shipped",
      "Customer view shows status updated to 'shipped'",
      `Status: ${customerView?.status}`
    );
    assert(
      customerView?.trackingNumber === generatedAwb,
      "Customer view trackingNumber is identical to admin view trackingNumber",
      `Customer trackingNumber: ${customerView?.trackingNumber}`
    );
    assert(
      customerView?.courierName === adminView?.courierName,
      "Customer view courierName matches admin view courierName exactly",
      `Customer courierName: ${customerView?.courierName}`
    );
    assert(
      customerView?.shiprocketOrderId === adminView?.shiprocketOrderId,
      "Customer view shiprocketOrderId matches admin view exactly",
      `Customer shiprocketOrderId: ${customerView?.shiprocketOrderId}`
    );

    // -------------------------------------------------------------------------
    // SUITE 4: GUEST TRACKING VIEW CONSISTENCY
    // -------------------------------------------------------------------------
    console.log("\nSUITE 4: Guest Order Tracking Verification (trackGuestOrderAction)");

    const guestView = await trackGuestOrderAction(
      testOrderNumber,
      testCustomerEmail,
      "127.0.0.1"
    );

    assert(
      guestView.success === true && Boolean(guestView.order),
      "trackGuestOrderAction verifies identity and returns order"
    );
    assert(
      guestView.order?.status === "shipped",
      "Guest tracking view shows status updated to 'shipped'",
      `Status: ${guestView.order?.status}`
    );
    assert(
      guestView.order?.trackingNumber === generatedAwb,
      "Guest tracking view trackingNumber is identical to generated AWB",
      `Guest trackingNumber: ${guestView.order?.trackingNumber}`
    );
    assert(
      guestView.order?.courierName === adminView?.courierName,
      "Guest tracking view courierName is identical to admin & customer views",
      `Guest courierName: ${guestView.order?.courierName}`
    );

    // -------------------------------------------------------------------------
    // SUITE 5: ON-DEMAND LIVE TRACKING REFRESH
    // -------------------------------------------------------------------------
    console.log("\nSUITE 5: On-Demand Tracking Refresh (refreshShiprocketTrackingAction)");

    const refreshResult = await refreshShiprocketTrackingAction(generatedAwb);

    assert(
      refreshResult.success === true,
      "refreshShiprocketTrackingAction returns successful tracking response",
      `Current Status: ${refreshResult.tracking?.currentStatus}`
    );
    assert(
      Boolean(refreshResult.tracking?.currentStatus),
      "Tracking result contains currentStatus",
      `Status: ${refreshResult.tracking?.currentStatus}`
    );
    assert(
      Boolean(refreshResult.tracking?.activities && refreshResult.tracking.activities.length > 0),
      "Tracking result contains activity history checkpoints",
      `Activities count: ${refreshResult.tracking?.activities?.length}`
    );

    // -------------------------------------------------------------------------
    // SUITE 6: AUDIT TRAIL VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\nSUITE 6: Status History Audit Trail");

    const { data: auditRecords } = await adminClient
      .from("order_status_history")
      .select("status, note")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    const shippedAudit = auditRecords?.find((r) => r.status === "shipped");
    assert(
      Boolean(shippedAudit),
      "Order status history has an entry for 'shipped'",
      `Note: ${shippedAudit?.note}`
    );

    const srAudit = auditRecords?.find((r) => r.note?.includes("Shiprocket"));
    assert(
      Boolean(srAudit && srAudit.note?.includes(generatedAwb)),
      "Audit trail note records the Shiprocket AWB code",
      `Audit note snippet: ${srAudit?.note?.slice(0, 80)}...`
    );

  } finally {
    // -------------------------------------------------------------------------
    // TEARDOWN & CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n--- Cleaning up test order records ---");
    await adminClient.from("order_status_history").delete().eq("order_id", orderId);
    await adminClient.from("order_items").delete().eq("order_id", orderId);
    await adminClient.from("orders").delete().eq("id", orderId);
    console.log("Database cleanup complete ✓");
  }

  console.log("\n================================================================");
  console.log(`FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log("STATUS: ALL SHIPROCKET CROSS-VIEW INTEGRATION TESTS PASSED! ✓");
    console.log("================================================================");
  } else {
    throw new Error(`STATUS: ${totalTests - passedTests} TESTS FAILED! ✗`);
  }
}

runCrossViewTest().catch((err) => {
  console.error("Fatal error during cross-view test:", err);
  process.exit(1);
});
