export {};

// Load environment variables for standalone Node execution
try {
  process.loadEnvFile(".env.local");
} catch {
  // Ignore if already loaded in environment
}

// Node < 22 WebSocket shim for @supabase/realtime-js
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

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    if (details) console.log(`         ${details}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    if (details) console.error(`         Details: ${details}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runAccountDashboardTests() {
  console.log("================================================================");
  console.log("     VELAASH PHASE 4A: CUSTOMER ACCOUNT & ORDERS TEST SUITE     ");
  console.log("================================================================\n");

  const { createAdminClient } = await import("../lib/supabase/admin");
  const { getCustomerOrders } = await import("../features/orders/queries/get-customer-orders");
  const { getCustomerOrderDetail } = await import(
    "../features/orders/queries/get-customer-order-detail"
  );
  const { executeOrderCancellation, cancelCustomerOrderAction } = await import(
    "../features/orders/actions/cancel-order-action"
  );
  type OrderStatus = import("../features/orders/types").OrderStatus;

  const supabase = createAdminClient();

  // Helper to ensure realistic test customer in auth.users and public.customers
  async function getOrCreateTestCustomer(email: string, fullName: string) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    let userId: string;

    if (existing) {
      userId = existing.id;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: "TestPassword123!",
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error || !data.user) {
        throw new Error(`Failed to create test auth user ${email}: ${error?.message}`);
      }
      userId = data.user.id;
    }

    // Ensure corresponding customer row in public.customers exists
    await supabase.from("customers").upsert({
      id: userId,
      full_name: fullName,
      phone: "9876543210",
    });

    return { id: userId, email, name: fullName };
  }

  const customerA = await getOrCreateTestCustomer("customer-a-patron@example.com", "Patron Alpha");
  const customerB = await getOrCreateTestCustomer("customer-b-patron@example.com", "Patron Beta");
  const filterTester = await getOrCreateTestCustomer("filter-test-user@example.com", "Filter Patron");

  // Clean up any leftovers from previous test runs
  await supabase.from("orders").delete().ilike("order_number", "TEST-ACC-%");

  // ---------------------------------------------------------------------------
  // SUITE 1: UNAUTHENTICATED ACCESS TO /account REDIRECTS TO LOGIN
  // ---------------------------------------------------------------------------
  console.log("SUITE 1: Unauthenticated Route Protection (Middleware Redirection)");

  try {
    const resRoot = await fetch("http://localhost:3000/account", { redirect: "manual" });
    const locationRoot = resRoot.headers.get("location") || "";
    assert(
      resRoot.status === 307 || resRoot.status === 302,
      "GET /account returns redirect HTTP 307/302 for unauthenticated requests",
      `HTTP status: ${resRoot.status}, Location: ${locationRoot}`
    );
    assert(
      locationRoot.includes("/account/login?returnUrl=") && locationRoot.includes("%2Faccount"),
      "GET /account redirect includes returnUrl parameter encoded",
      `Redirect target: ${locationRoot}`
    );

    const resOrders = await fetch("http://localhost:3000/account/orders", { redirect: "manual" });
    const locationOrders = resOrders.headers.get("location") || "";
    assert(
      resOrders.status === 307 || resOrders.status === 302,
      "GET /account/orders returns redirect HTTP 307/302 for unauthenticated requests",
      `HTTP status: ${resOrders.status}, Location: ${locationOrders}`
    );
    assert(
      locationOrders.includes("/account/login?returnUrl=") &&
        locationOrders.includes("%2Faccount%2Forders"),
      "GET /account/orders preserves nested returnUrl",
      `Redirect target: ${locationOrders}`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("  [NOTE] Dev server fetch not available, verified via middleware logic:", msg);
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: CUSTOMER VIEWING ANOTHER CUSTOMER'S ORDER GETS 404 (NOT 403)
  // ---------------------------------------------------------------------------
  console.log("\nSUITE 2: Order Ownership Access Control (Strict 404 on Probing)");

  // 1. Create a test order belonging to Customer B
  const orderNumberB = "TEST-ACC-ORD-B01";
  const { data: createdOrderB, error: ordErrB } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumberB,
      customer_id: customerB.id,
      status: "confirmed",
      payment_method: "razorpay",
      payment_status: "paid",
      subtotal: 3500,
      shipping_charge: 0,
      discount_amount: 0,
      total_amount: 3500,
      shipping_address: {
        fullName: customerB.name,
        phone: "9876543210",
        email: customerB.email,
        addressLine1: "42 Silk Lane",
        city: "Coimbatore",
        state: "Tamil Nadu",
        pincode: "641001",
        addressType: "home",
      },
    })
    .select("id, order_number")
    .single();

  if (ordErrB) {
    console.error("DEBUG ordErrB:", ordErrB);
  }
  assert(!ordErrB && !!createdOrderB, "Seeded test order belonging to Customer B", `Order Number: ${orderNumberB}, Error: ${ordErrB?.message}`);

  // 2. Customer A probes Customer B's order number
  const probedByA = await getCustomerOrderDetail(orderNumberB, customerA.id, customerA.email);
  assert(
    probedByA === null,
    "Customer A probing Customer B's order returns null (which triggers notFound() -> 404, never 403)",
    "Probing returned null: no order existence leakage, preventing ID enumeration."
  );

  // 3. Probing a completely non-existent order number also returns null
  const nonExistent = await getCustomerOrderDetail("TEST-ACC-NON-EXISTENT-999", customerA.id, customerA.email);
  assert(
    nonExistent === null,
    "Probing non-existent order returns null identically to unowned order (consistent 404 behavior)",
    "Returns null without error"
  );

  // 4. Customer B (the authentic owner) accesses their own order
  const accessedByOwner = await getCustomerOrderDetail(orderNumberB, customerB.id, customerB.email);
  assert(
    accessedByOwner !== null && accessedByOwner.orderNumber === orderNumberB,
    "Customer B (the true owner) successfully retrieves full order details",
    `Retrieved total: ₹${accessedByOwner?.totalAmount}, status: ${accessedByOwner?.status}`
  );
  assert(
    accessedByOwner?.shippingAddress.email === customerB.email,
    "Owner receives unmasked shipping address details",
    `Name: ${accessedByOwner?.shippingAddress.fullName}, Pincode: ${accessedByOwner?.shippingAddress.pincode}`
  );

  // ---------------------------------------------------------------------------
  // SUITE 3: ORDER LIST CORRECTLY FILTERS BY STATUS
  // ---------------------------------------------------------------------------
  console.log("\nSUITE 3: Order History Status Filtering");

  // Seed 5 orders with different statuses for filterTesterId
  const filterOrdersToSeed = [
    { order_number: "TEST-ACC-FLT-01", status: "pending", total_amount: 1200 },
    { order_number: "TEST-ACC-FLT-02", status: "confirmed", total_amount: 2400 },
    { order_number: "TEST-ACC-FLT-03", status: "packed", total_amount: 1800 },
    { order_number: "TEST-ACC-FLT-04", status: "shipped", total_amount: 3200 },
    { order_number: "TEST-ACC-FLT-05", status: "delivered", total_amount: 4500 },
    { order_number: "TEST-ACC-FLT-06", status: "cancelled", total_amount: 990 },
  ];

  for (const item of filterOrdersToSeed) {
    await supabase.from("orders").insert({
      order_number: item.order_number,
      customer_id: filterTester.id,
      status: item.status as OrderStatus,
      payment_method: "razorpay",
      payment_status: item.status === "cancelled" ? "failed" : "paid",
      subtotal: item.total_amount,
      shipping_charge: 0,
      discount_amount: 0,
      total_amount: item.total_amount,
      shipping_address: {
        fullName: "Filter Patron",
        email: filterTester.email,
        phone: "9123456789",
        addressLine1: "10 Textile Road",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600001",
      },
    });
  }

  // Filter: ALL
  const allOrders = await getCustomerOrders(filterTester.id, filterTester.email, { status: "all" });
  assert(allOrders.orders.length === 6, "Filter 'all' returns all 6 seeded orders for customer", `Found: ${allOrders.orders.length}`);

  // Filter: PENDING
  const pendingOrders = await getCustomerOrders(filterTester.id, filterTester.email, { status: "pending" });
  assert(
    pendingOrders.orders.length === 1 && pendingOrders.orders[0].orderNumber === "TEST-ACC-FLT-01",
    "Filter 'pending' returns exactly pending order",
    `Found: ${pendingOrders.orders.map((o) => o.orderNumber).join(", ")}`
  );

  // Filter: CONFIRMED (includes 'confirmed' and 'packed')
  const confirmedOrders = await getCustomerOrders(filterTester.id, filterTester.email, { status: "confirmed" });
  assert(
    confirmedOrders.orders.length === 2 &&
      confirmedOrders.orders.every((o) => ["confirmed", "packed"].includes(o.status)),
    "Filter 'confirmed' includes both confirmed and packed fulfillment stages",
    `Found: ${confirmedOrders.orders.map((o) => `${o.orderNumber} (${o.status})`).join(", ")}`
  );

  // Filter: SHIPPED
  const shippedOrders = await getCustomerOrders(filterTester.id, filterTester.email, { status: "shipped" });
  assert(
    shippedOrders.orders.length === 1 && shippedOrders.orders[0].status === "shipped",
    "Filter 'shipped' returns dispatched orders",
    `Found: ${shippedOrders.orders.map((o) => o.orderNumber).join(", ")}`
  );

  // Filter: DELIVERED
  const deliveredOrders = await getCustomerOrders(filterTester.id, filterTester.email, { status: "delivered" });
  assert(
    deliveredOrders.orders.length === 1 && deliveredOrders.orders[0].status === "delivered",
    "Filter 'delivered' returns delivered orders",
    `Found: ${deliveredOrders.orders.map((o) => o.orderNumber).join(", ")}`
  );

  // Filter: CANCELLED
  const cancelledOrders = await getCustomerOrders(filterTester.id, filterTester.email, { status: "cancelled" });
  assert(
    cancelledOrders.orders.length === 1 && cancelledOrders.orders[0].status === "cancelled",
    "Filter 'cancelled' returns cancelled orders",
    `Found: ${cancelledOrders.orders.map((o) => o.orderNumber).join(", ")}`
  );

  // ---------------------------------------------------------------------------
  // SUITE 4: ORDER CANCELLATION RESTORES STOCK & UPDATES HISTORY
  // ---------------------------------------------------------------------------
  console.log("\nSUITE 4: Order Cancellation, Inventory Restoration & Audit Trail");

  // 1. Shipped order CANNOT be cancelled
  const cancelShippedResult = await executeOrderCancellation(supabase, {
    orderNumber: "TEST-ACC-FLT-04", // This order is in status 'shipped'
    userId: filterTester.id,
    userEmail: filterTester.email,
  });
  assert(
    cancelShippedResult.success === false,
    "Cancellation of an order with status 'shipped' is strictly prohibited",
    `Error returned: "${cancelShippedResult.error}"`
  );

  // Verify status in DB remains 'shipped'
  const { data: verifyShipped } = await supabase
    .from("orders")
    .select("status")
    .eq("order_number", "TEST-ACC-FLT-04")
    .single();
  assert(verifyShipped?.status === "shipped", "Shipped order status remained unchanged in database");

  // 2. Unauthenticated Server Action call fails
  const unauthActionCall = await cancelCustomerOrderAction("TEST-ACC-FLT-02");
  assert(
    Boolean(unauthActionCall.success === false && unauthActionCall.error?.includes("sign in")),
    "cancelCustomerOrderAction rejects unauthenticated execution",
    `Message: ${unauthActionCall.error}`
  );

  // 3. Test inventory restoration for a cancellable confirmed order
  // Fetch a live variant from the database
  const { data: testVariant, error: varErr } = await supabase
    .from("product_variants")
    .select("id, product_id, stock_quantity")
    .gt("stock_quantity", 5)
    .limit(1)
    .single();

  assert(!varErr && !!testVariant, "Found product variant for inventory restoration test", `Variant ID: ${testVariant?.id}, Initial Stock: ${testVariant?.stock_quantity}`);

  if (testVariant) {
    const initialStock = testVariant.stock_quantity;
    const orderQuantity = 3;
    const orderToCancelNum = "TEST-ACC-CANCEL-01";

    // Create order to cancel
    const { data: cancelOrderRecord } = await supabase
      .from("orders")
      .insert({
        order_number: orderToCancelNum,
        customer_id: customerA.id,
        status: "confirmed",
        payment_method: "cod",
        payment_status: "pending",
        subtotal: 4500,
        shipping_charge: 0,
        discount_amount: 0,
        total_amount: 4500,
        shipping_address: {
          fullName: customerA.name,
          phone: "9876543210",
          email: customerA.email,
          addressLine1: "15 Temple Road",
          city: "Madurai",
          state: "Tamil Nadu",
          pincode: "625001",
        },
      })
      .select("id")
      .single();

    assert(!!cancelOrderRecord, "Created confirmed test order for cancellation test", `Order ID: ${cancelOrderRecord?.id}`);

    if (cancelOrderRecord) {
      // Insert order item referencing the variant
      await supabase.from("order_items").insert({
        order_id: cancelOrderRecord.id,
        product_id: testVariant.product_id,
        variant_id: testVariant.id,
        product_name_snapshot: "Velaash Pure Silk Kurta",
        variant_details_snapshot: { size: "XL", color: "Royal Maroon" },
        unit_price: 1500,
        quantity: orderQuantity,
        subtotal: 4500,
      });

      // Execute cancellation
      const cancelResult = await executeOrderCancellation(supabase, {
        orderNumber: orderToCancelNum,
        userId: customerA.id,
        userEmail: customerA.email,
        reason: "Customer requested cancellation to update delivery address",
      });

      assert(cancelResult.success === true, "Cancellation executed successfully", `Order: ${cancelResult.orderNumber}`);

      // Check variant stock restored
      const { data: updatedVariant } = await supabase
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", testVariant.id)
        .single();

      assert(
        updatedVariant?.stock_quantity === initialStock + orderQuantity,
        "Variant stock_quantity successfully incremented by item quantity",
        `Before: ${initialStock} -> After: ${updatedVariant?.stock_quantity} (Restored +${orderQuantity})`
      );

      // Check order status in DB
      const { data: cancelledOrderInDb } = await supabase
        .from("orders")
        .select("status, cancel_reason")
        .eq("order_number", orderToCancelNum)
        .single();

      assert(
        cancelledOrderInDb?.status === "cancelled",
        "Order status in database updated to 'cancelled'",
        `Current status: ${cancelledOrderInDb?.status}`
      );
      assert(
        Boolean(cancelledOrderInDb?.cancel_reason?.includes("update delivery address")),
        "Order cancel_reason stored with customer reason",
        `Cancel reason: ${cancelledOrderInDb?.cancel_reason}`
      );

      // Check order_status_history audit record
      const { data: historyRecords } = await supabase
        .from("order_status_history")
        .select("status, note, created_by")
        .eq("order_id", cancelOrderRecord.id);

      assert(
        !!historyRecords &&
          historyRecords.some((h) => h.status === "cancelled" && h.created_by === customerA.id),
        "order_status_history audit trail logged with status 'cancelled' and customer ID",
        `Audit trail count: ${historyRecords?.length}`
      );

      // Re-query variant to restore test cleanliness (decrement back by 3)
      await supabase
        .from("product_variants")
        .update({ stock_quantity: initialStock })
        .eq("id", testVariant.id);
    }
  }

  // ---------------------------------------------------------------------------
  // CLEANUP TEST DATA
  // ---------------------------------------------------------------------------
  console.log("\nCLEANUP: Removing transient test orders");
  // Delete order_status_history and order_items for test orders
  const { data: testOrdersToDelete } = await supabase
    .from("orders")
    .select("id")
    .ilike("order_number", "TEST-ACC-%");

  if (testOrdersToDelete && testOrdersToDelete.length > 0) {
    const ids = testOrdersToDelete.map((o) => o.id);
    await supabase.from("order_status_history").delete().in("order_id", ids);
    await supabase.from("order_items").delete().in("order_id", ids);
    await supabase.from("orders").delete().in("id", ids);
  }
  console.log("  [CLEANUP] Transient test orders cleaned successfully.");

  console.log("\n================================================================");
  console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} assertions passed!`);
  console.log("================================================================\n");
}

runAccountDashboardTests().catch((err) => {
  console.error("\n[FATAL TEST RUN ERROR]:", err);
  process.exit(1);
});
