/* eslint-disable @typescript-eslint/no-explicit-any */
import path from "path";

// Load environment variables before any application imports
try {
  process.loadEnvFile(path.resolve(process.cwd(), ".env.local"));
} catch (e) {
  console.warn("Could not load .env.local via process.loadEnvFile:", e);
}

interface TestReport {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const testResults: TestReport[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    if (details) console.log(`         ${details}`);
    testResults.push({ name, passed: true, details });
  } else {
    console.error(`  [FAIL] ${name}`);
    if (details) console.error(`         Details: ${details}`);
    testResults.push({ name, passed: false, details, error: "Assertion failed" });
    throw new Error(`Test failed: ${name}`);
  }
}

async function runE2ECustomerJourneyTest() {
  console.log("================================================================================");
  console.log("       VELAASH END-TO-END CUSTOMER JOURNEY TEST SUITE                           ");
  console.log("   Simulating Continuous Guest Journey -> Account Creation -> Return via OTP    ");
  console.log("================================================================================\n");

  const { createAdminClient } = await import("../lib/supabase/admin");
  const { createClient } = await import("@supabase/supabase-js");
  const { createOrderAction } = await import("../features/checkout/actions/create-order-action");
  const { getOrderByNumber } = await import("../features/checkout/queries/get-order-by-number");
  const { getCustomerOrders } = await import("../features/orders/queries/get-customer-orders");
  const { DISPATCHED_EMAILS_LOG } = await import("../lib/email/resend");
  const { getProducts } = await import("../features/products/queries/get-products");
  const { MOCK_CLOTHING_PRODUCTS } = await import("../features/products/queries/mock-products");
  const { resetCodRateLimitsForTest } = await import("../lib/rate-limit");

  const adminSupabase = createAdminClient();
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  resetCodRateLimitsForTest();
  DISPATCHED_EMAILS_LOG.length = 0;

  let createdUserId: string | null = null;
  let createdOrderNumber: string | null = null;
  let createdOrderId: string | null = null;
  let secondOrderNumber: string | null = null;
  let secondOrderId: string | null = null;
  let variantA: any = null;
  let variantB: any = null;
  let originalStockA: number = 10;
  let originalStockB: number = 10;

  try {
    // -------------------------------------------------------------------------
    // STEP 1: GUEST BROWSES SHOP & ADDS 2 PRODUCTS TO CART
    // -------------------------------------------------------------------------
    console.log("--- STEP 1: Guest Browses Shop & Adds 2 Distinct Products to Cart ---");

    // Fetch products from database
    const catalogResult = await getProducts({ limit: 6 });
    let productA: any;
    let productB: any;

    if (catalogResult.products.length >= 2) {
      productA = catalogResult.products[0];
      productB = catalogResult.products[1];
    } else {
      productA = MOCK_CLOTHING_PRODUCTS[0];
      productB = MOCK_CLOTHING_PRODUCTS[1];
    }

    assert(
      Boolean(productA && productB && productA.id !== productB.id),
      "Guest finds 2 distinct products in catalog",
      `Product A: "${productA.name}" | Product B: "${productB.name}"`
    );

    // Get live variants for both products with at least 3 stock units
    const { data: variantsA } = await adminSupabase
      .from("product_variants")
      .select("id, size, color, stock_quantity, price_override")
      .eq("product_id", productA.id)
      .gte("stock_quantity", 3)
      .limit(1);

    const { data: variantsB } = await adminSupabase
      .from("product_variants")
      .select("id, size, color, stock_quantity, price_override")
      .eq("product_id", productB.id)
      .gte("stock_quantity", 3)
      .limit(1);

    variantA = variantsA?.[0] || productA.variants?.[0] || {
      id: "v-mock-001",
      size: "M",
      color: "Burgundy",
    };
    variantB = variantsB?.[0] || productB.variants?.[0] || {
      id: "v-mock-002",
      size: "Free Size",
      color: "Maroon",
    };
    originalStockA = variantA?.stock_quantity ?? 10;
    originalStockB = variantB?.stock_quantity ?? 10;

    const cartItems = [
      {
        productId: productA.id,
        variantId: variantA.id,
        quantity: 1,
      },
      {
        productId: productB.id,
        variantId: variantB.id,
        quantity: 1,
      },
    ];

    assert(
      cartItems.length === 2 && cartItems[0].variantId !== cartItems[1].variantId,
      "Guest successfully builds cart with 2 distinct items/variants",
      `Variant 1 ID: ${cartItems[0].variantId} | Variant 2 ID: ${cartItems[1].variantId}`
    );

    // -------------------------------------------------------------------------
    // STEP 2: GUEST CHECKOUT WITH 'CREATE AN ACCOUNT?' CHECKED + COD PAYMENT
    // -------------------------------------------------------------------------
    console.log("\n--- STEP 2: Guest Checkout (Create Account Checked, COD Payment) ---");

    const testTimestamp = Date.now();
    const guestEmail = `meera.nair.${testTimestamp}@example-velaash.in`;
    const guestPhone = "9876543210";
    const guestFullName = "Meera Nair";
    const idempotencyKey = `idemp-e2e-${testTimestamp}`;

    const orderResult = await createOrderAction({
      contact: {
        email: guestEmail,
        phone: guestPhone,
        createAccount: true, // Guest opts to create an account
      },
      shippingAddress: {
        fullName: guestFullName,
        phone: guestPhone,
        addressLine1: "42 Indiranagar 100ft Road, Stage 2",
        addressLine2: "Near BDA Complex",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038",
        addressType: "home",
        saveAddress: false, // NOT checked: explicitly verify this flag is respected
      },
      paymentMethod: "cod",
      items: cartItems,
      idempotencyKey,
    });

    assert(
      orderResult.success === true,
      "Guest order placed successfully via createOrderAction",
      `Order Number: ${orderResult.success ? orderResult.orderNumber : "FAILED (Error: " + (orderResult as any).error + ", Code: " + (orderResult as any).code + ")"}`
    );

    if (!orderResult.success) {
      throw new Error(`Order placement failed: ${orderResult.error}`);
    }

    createdOrderNumber = orderResult.orderNumber!;
    createdOrderId = orderResult.orderId!;
    const accessToken = orderResult.accessToken!;

    assert(
      Boolean(accessToken && accessToken.length > 20),
      "Order returns secure temporary first-visit access token",
      `Access Token: ${accessToken.slice(0, 16)}...`
    );

    // -------------------------------------------------------------------------
    // STEP 3: CONFIRM ORDER DETAILS, CUSTOMER_ID, ACCESS LEVEL & EMAIL NOTICES
    // -------------------------------------------------------------------------
    console.log("\n--- STEP 3: Confirm Order Association, Access Level & Email Content ---");

    const fetchedOrder = await getOrderByNumber(createdOrderNumber, { accessToken });

    assert(
      fetchedOrder !== null,
      "Order retrieved via getOrderByNumber with first-visit token",
      `Order: ${fetchedOrder?.orderNumber}`
    );

    assert(
      fetchedOrder?.customerId !== null && Boolean(fetchedOrder?.customerId),
      "Order created with customer_id populated (not null)",
      `Assigned Customer ID: ${fetchedOrder?.customerId}`
    );

    createdUserId = fetchedOrder!.customerId!;

    assert(
      fetchedOrder?.accessLevel === "FULL",
      "Confirmation page grants FULL access to order details via first-visit token",
      `Access Level: ${fetchedOrder?.accessLevel}`
    );

    assert(
      fetchedOrder?.accountCreatedFromGuest === true,
      "Order metadata flags accountCreatedFromGuest === true",
      "Notice banner will display on confirmation page"
    );

    // Check emails in DISPATCHED_EMAILS_LOG
    const orderConfirmationEmail = DISPATCHED_EMAILS_LOG.find(
      (e) => e.to.toLowerCase() === guestEmail.toLowerCase() && e.orderNumber === createdOrderNumber
    );

    assert(
      orderConfirmationEmail !== undefined,
      "Order confirmation email dispatched to customer email",
      `Recipient: ${orderConfirmationEmail?.to} | Subject: "${orderConfirmationEmail?.subject}"`
    );

    const emailProps = (orderConfirmationEmail?.reactComponent as any)?.props;
    assert(
      emailProps?.accountCreatedFromGuest === true,
      "Order confirmation email has accountCreatedFromGuest === true prop",
      "Email includes passwordless OTP login notice (no password setup link)"
    );

    const welcomeEmail = DISPATCHED_EMAILS_LOG.find(
      (e) =>
        e.to.toLowerCase() === guestEmail.toLowerCase() &&
        e.subject.includes("Welcome to Velaash — Your Account is Ready")
    );

    assert(
      welcomeEmail !== undefined,
      "Account welcome email dispatched to customer with passwordless OTP login instructions",
      `Subject: "${welcomeEmail?.subject}" | Has OTP guidance, no password link`
    );

    // -------------------------------------------------------------------------
    // STEP 4: CONFIRM auth.users AND customers ROW EXIST WITH NO PASSWORD
    // -------------------------------------------------------------------------
    console.log("\n--- STEP 4: Confirm auth.users & customers Records (No Password Set) ---");

    const { data: authUserData, error: authUserErr } = await adminSupabase.auth.admin.getUserById(
      createdUserId
    );

    assert(
      !authUserErr && authUserData.user !== null,
      "auth.users record exists for provisioned account",
      `UID: ${authUserData.user?.id} | Email: ${authUserData.user?.email}`
    );

    assert(
      authUserData.user?.email?.toLowerCase() === guestEmail.toLowerCase(),
      "auth.users record email matches guest checkout email",
      `Expected: ${guestEmail} | Actual: ${authUserData.user?.email}`
    );

    // Confirm no password was set: providers is ['email'] and encrypted_password is empty/undefined
    const rawUser = authUserData.user as any;
    const hasPassword = Boolean(rawUser.encrypted_password);
    assert(
      !hasPassword,
      "User record has NO password set (encrypted_password is not set / null)",
      `Password status: ${hasPassword ? "PASSWORD PRESENT (FAILED)" : "NO PASSWORD SET (PASSED)"}`
    );

    // Confirm public.customers record exists
    const { data: customerRow, error: customerErr } = await adminSupabase
      .from("customers")
      .select("id, full_name, phone, created_at")
      .eq("id", createdUserId)
      .single();

    assert(
      !customerErr && customerRow !== null,
      "public.customers record exists in database",
      `Customer Name: "${customerRow?.full_name}" | Phone: "${customerRow?.phone}"`
    );

    assert(
      customerRow?.full_name === guestFullName,
      "Customer record has accurate full_name matching guest checkout input",
      `Name: ${customerRow?.full_name}`
    );

    // -------------------------------------------------------------------------
    // STEP 5: SIMULATE CUSTOMER RETURNING LATER (NEW SESSION) VIA OTP
    // -------------------------------------------------------------------------
    console.log("\n--- STEP 5: Customer Returns Later (New Session, Request & Verify OTP) ---");

    // Generate an OTP code for this email (simulates the 6-digit access code sent to email)
    const { data: linkData, error: linkErr } = await adminSupabase.auth.admin.generateLink({
      type: "magiclink",
      email: guestEmail,
    });

    assert(
      !linkErr && Boolean(linkData.properties?.email_otp),
      "Supabase generates 6-digit OTP code for passwordless customer email",
      `Generated OTP Token: ${linkData.properties?.email_otp}`
    );

    const emailOtp = linkData.properties!.email_otp!;

    // Authenticate using verifyOtp on a fresh unauthenticated anon client (new session)
    const { data: verifyData, error: verifyErr } = await anonSupabase.auth.verifyOtp({
      email: guestEmail,
      token: emailOtp,
      type: "email",
    });

    assert(
      !verifyErr && Boolean(verifyData.user),
      "verifyOtp successfully logs customer in via 6-digit email access code",
      `Verified User ID: ${verifyData.user?.id}`
    );

    assert(
      verifyData.user?.id === createdUserId,
      "Customer is logged into the EXACT SAME account created at guest checkout (no duplicate)",
      `Original Customer ID: ${createdUserId} | Session User ID: ${verifyData.user?.id}`
    );

    // -------------------------------------------------------------------------
    // STEP 6: CUSTOMER VIEWS GUEST-PLACED ORDER IN /account/orders HISTORY
    // -------------------------------------------------------------------------
    console.log("\n--- STEP 6: Customer Sees Guest-Placed Order in /account/orders History ---");

    const ordersResponse = await getCustomerOrders(verifyData.user!.id, guestEmail);

    assert(
      ordersResponse.orders.length >= 1,
      "Customer order history returns at least 1 order",
      `Total Orders Found: ${ordersResponse.totalCount}`
    );

    const matchedOrder = ordersResponse.orders.find(
      (o) => o.orderNumber === createdOrderNumber
    );

    assert(
      matchedOrder !== undefined,
      "Order placed as guest is present in authenticated customer's order history",
      `Found Order #${matchedOrder?.orderNumber} (Status: ${matchedOrder?.status}, Total: ₹${matchedOrder?.totalAmount})`
    );

    // -------------------------------------------------------------------------
    // STEP 7A: CONFIRM GUEST ACCOUNT ADDRESS WAS AUTO-SAVED AS DEFAULT
    // -------------------------------------------------------------------------
    console.log("\n--- STEP 7A: Confirm Address Auto-Saved as Default on Guest Account Creation ---");

    const { data: savedAddresses, error: addrErr } = await adminSupabase
      .from("addresses")
      .select("id, address_line1, city, pincode, is_default")
      .eq("customer_id", createdUserId);

    assert(
      !addrErr && Array.isArray(savedAddresses),
      "Queried saved addresses table for customer",
      `Total Addresses: ${savedAddresses?.length}`
    );

    assert(
      savedAddresses?.length === 1,
      "Exactly 1 address exists in customer account after guest checkout with account creation",
      `Address count: ${savedAddresses?.length}`
    );

    const defaultAddress = savedAddresses?.[0];

    assert(
      defaultAddress?.is_default === true,
      "Auto-saved address is marked as default (is_default === true)",
      `is_default: ${defaultAddress?.is_default}`
    );

    assert(
      defaultAddress?.address_line1 === "42 Indiranagar 100ft Road, Stage 2" &&
        defaultAddress?.city === "Bengaluru" &&
        defaultAddress?.pincode === "560038",
      "Auto-saved default address matches the checkout shipping address entered",
      `Saved: ${defaultAddress?.address_line1}, ${defaultAddress?.city} - ${defaultAddress?.pincode}`
    );

    // -------------------------------------------------------------------------
    // STEP 7B: CONFIRM GUEST CHECKOUT WITHOUT "SAVE THIS ADDRESS" DOES NOT AUTO-SAVE
    // -------------------------------------------------------------------------
    console.log("\n--- STEP 7B: Guest Checkout Without 'Save Address' Does Not Auto-Save ---");

    const secondOrderResult = await createOrderAction({
        contact: {
          email: guestEmail,
          phone: guestPhone,
          createAccount: false,
        },
        shippingAddress: {
          fullName: guestFullName,
          phone: guestPhone,
          addressLine1: "88 Koramangala 4th Block, 80ft Road",
          addressLine2: "Opposite Sony World",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560034",
          addressType: "work",
          saveAddress: false, // NOT checked: must NOT be auto-saved for existing logged-in customer
        },
        paymentMethod: "cod",
        items: cartItems,
        idempotencyKey: `idemp-second-${Date.now()}`,
      }
    );

    assert(
      secondOrderResult.success === true,
      "Guest customer places second order successfully",
      `Order Number: ${secondOrderResult.success ? secondOrderResult.orderNumber : (secondOrderResult as any).error}`
    );

    if (secondOrderResult.success) {
      secondOrderNumber = secondOrderResult.orderNumber!;
      secondOrderId = secondOrderResult.orderId!;
    }

    // Verify address count remains strictly 1 and the second address was NOT saved
    const { data: addressesAfterSecondOrder, error: secondAddrErr } = await adminSupabase
      .from("addresses")
      .select("id, address_line1, is_default")
      .eq("customer_id", createdUserId);

    assert(
      !secondAddrErr && Array.isArray(addressesAfterSecondOrder),
      "Queried saved addresses after second logged-in order",
      `Total Addresses: ${addressesAfterSecondOrder?.length}`
    );

    assert(
      addressesAfterSecondOrder?.length === 1,
      "Address count remains strictly 1 (logged-in customer checkout with saveAddress=false did NOT auto-save)",
      `Expected: 1 | Actual: ${addressesAfterSecondOrder?.length}`
    );

    const hasSecondAddress = addressesAfterSecondOrder?.some(
      (a) => a.address_line1 === "88 Koramangala 4th Block, 80ft Road"
    );

    assert(
      !hasSecondAddress,
      "Second order shipping address was NOT saved to customer address book",
      "Rule confirmed: Auto-save default address rule ONLY applies to new account creation during guest checkout"
    );

    console.log("\n================================================================================");
    console.log(`                      ALL ${testResults.length} END-TO-END CHECKS PASSED                           `);
    console.log("================================================================================\n");

  } finally {
    // -------------------------------------------------------------------------
    // STEP 8: CLEANUP TEST ARTIFACTS
    // -------------------------------------------------------------------------
    console.log("--- Cleanup: Pruning Test Records from Database ---");
    if (createdOrderId) {
      await adminSupabase.from("order_items").delete().eq("order_id", createdOrderId);
      await adminSupabase.from("orders").delete().eq("id", createdOrderId);
      console.log(`  Cleaned up order #${createdOrderNumber}`);
    }
    if (secondOrderId) {
      await adminSupabase.from("order_items").delete().eq("order_id", secondOrderId);
      await adminSupabase.from("orders").delete().eq("id", secondOrderId);
      console.log(`  Cleaned up second order #${secondOrderNumber}`);
    }
    if (createdUserId) {
      await adminSupabase.from("addresses").delete().eq("customer_id", createdUserId);
      await adminSupabase.from("customers").delete().eq("id", createdUserId);
      await adminSupabase.auth.admin.deleteUser(createdUserId);
      console.log(`  Cleaned up customer & auth user (${createdUserId})`);
    }
    if (variantA?.id) {
      await adminSupabase.from("product_variants").update({ stock_quantity: originalStockA }).eq("id", variantA.id);
    }
    if (variantB?.id) {
      await adminSupabase.from("product_variants").update({ stock_quantity: originalStockB }).eq("id", variantB.id);
    }
  }
}

runE2ECustomerJourneyTest()
  .then(() => {
    console.log("Customer Journey E2E Test execution finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("FATAL: Customer Journey E2E Test failed:", err);
    process.exit(1);
  });
