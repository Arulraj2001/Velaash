export {};

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

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function main() {
  console.log("\n=======================================================");
  console.log("PHASE 5C: ADMIN COUPON MANAGEMENT TERMINAL VERIFICATION");
  console.log("=======================================================\n");

  // Dynamic imports
  const {
    hasAdminPermission,
    canAccessAdminRoute,
    getVisibleNavItems,
    ROLE_PERMISSIONS,
    ADMIN_NAV_ITEMS,
  } = await import("../features/admin/permissions");

  const {
    getCouponComputedStatus,
    CouponFormSchema,
  } = await import("../features/admin/types/coupons");

  const { calculateCouponDiscount } = await import(
    "../features/cart/utils/pricing"
  );

  const {
    createCouponAction,
    updateCouponAction,
    toggleCouponStatusAction,
    deleteCouponAction,
  } = await import("../features/admin/actions/coupon-actions");

  const { getAdminCoupons } = await import(
    "../features/admin/queries/get-admin-coupons"
  );

  const { createAdminClient } = await import("../lib/supabase/admin");
  const adminClient = createAdminClient();

  // -------------------------------------------------------------------------
  // SUITE 1: OWNER ONLY PERMISSIONS & STAFF ZERO ACCESS
  // -------------------------------------------------------------------------
  console.log("--- SUITE 1: Staff Zero Access & Owner-Only Enforcement ---");

  // 1. Staff permission check
  assert(
    hasAdminPermission("staff", "manage_coupons") === false,
    "Staff role has manage_coupons = false"
  );
  assert(
    ROLE_PERMISSIONS.staff.includes("manage_coupons") === false,
    "ROLE_PERMISSIONS.staff does not contain manage_coupons"
  );

  // 2. Owner permission check
  assert(
    hasAdminPermission("owner", "manage_coupons") === true,
    "Owner role has manage_coupons = true"
  );
  assert(
    ROLE_PERMISSIONS.owner.includes("manage_coupons") === true,
    "ROLE_PERMISSIONS.owner contains manage_coupons"
  );

  // 3. Route access checks
  assert(
    canAccessAdminRoute("staff", "/admin/coupons") === false,
    "canAccessAdminRoute('staff', '/admin/coupons') is rejected (false)"
  );
  assert(
    canAccessAdminRoute("owner", "/admin/coupons") === true,
    "canAccessAdminRoute('owner', '/admin/coupons') is permitted (true)"
  );

  // 4. Admin sidebar navigation visibility check
  const staffNav = getVisibleNavItems("staff");
  assert(
    !staffNav.some((item) => item.href === "/admin/coupons"),
    "Staff nav items list omits /admin/coupons"
  );

  const ownerNav = getVisibleNavItems("owner");
  assert(
    ownerNav.some((item) => item.href === "/admin/coupons"),
    "Owner nav items list contains /admin/coupons"
  );

  const couponNavItem = ADMIN_NAV_ITEMS.find(
    (item) => item.href === "/admin/coupons"
  );
  assert(
    couponNavItem !== undefined &&
      couponNavItem.ownerOnly === true &&
      couponNavItem.requiredPermission === "manage_coupons",
    "Coupons nav item configuration is explicitly ownerOnly with manage_coupons permission"
  );

  // 5. Server-side query guard (getAdminCoupons) with unauthenticated/staff context
  let queryBlocked = false;
  try {
    await getAdminCoupons();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (
      errorMsg.includes("UNAUTHORIZED_ADMIN_ACCESS") ||
      errorMsg.includes("FORBIDDEN")
    ) {
      queryBlocked = true;
    }
  }
  assert(
    queryBlocked,
    "getAdminCoupons() throws UNAUTHORIZED / FORBIDDEN server guard when called without owner session"
  );

  // 6. Server actions guard (create, update, toggle, delete) without owner session
  const createRes = await createCouponAction({
    code: "UNAUTHORIZED_TEST",
    discountType: "percentage",
    discountValue: 10,
    minOrderValue: 0,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    isActive: true,
  });
  assert(
    Boolean(
      createRes.success === false &&
        (createRes.error?.includes("Access denied") ||
          createRes.error?.includes("UNAUTHORIZED") ||
          createRes.error?.includes("permission"))
    ),
    "createCouponAction() rejects unauthorized callers server-side"
  );

  const toggleRes = await toggleCouponStatusAction("any-id", false);
  assert(
    toggleRes.success === false,
    "toggleCouponStatusAction() rejects unauthorized callers server-side"
  );

  const deleteRes = await deleteCouponAction("any-id");
  assert(
    Boolean(
      deleteRes.success === false &&
        (deleteRes.error?.includes("Access denied") ||
          deleteRes.error?.includes("UNAUTHORIZED") ||
          deleteRes.error?.includes("permission"))
    ),
    "deleteCouponAction() rejects unauthorized callers server-side"
  );

  const updateRes = await updateCouponAction("any-id", {
    code: "UNAUTHORIZED_TEST",
    discountType: "percentage",
    discountValue: 10,
    minOrderValue: 0,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    isActive: true,
  });
  assert(
    Boolean(
      updateRes.success === false &&
        (updateRes.error?.includes("Access denied") ||
          updateRes.error?.includes("UNAUTHORIZED") ||
          updateRes.error?.includes("permission"))
    ),
    "updateCouponAction() rejects unauthorized callers server-side"
  );

  // -------------------------------------------------------------------------
  // SUITE 2: SHARED DISCOUNT MATH & FORM PREVIEW SYNCHRONIZATION
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 2: Shared Discount Math & Live Preview Calculation ---");

  // Percentage discount calculation (20% on ₹2000 order = ₹400)
  const discount1 = calculateCouponDiscount(
    {
      discountType: "percentage",
      discountValue: 20,
      minOrderValue: 0,
    },
    2000
  );
  assert(
    discount1 === 400,
    "20% discount on ₹2000 gives exact ₹400 off"
  );

  // Percentage discount capped by maxDiscountAmount (20% on ₹5000 order, cap ₹500 = ₹500)
  const discountCapped = calculateCouponDiscount(
    {
      discountType: "percentage",
      discountValue: 20,
      minOrderValue: 0,
      maxDiscountAmount: 500,
    },
    5000
  );
  assert(
    discountCapped === 500,
    "20% discount on ₹5000 capped at max ₹500 gives ₹500 (not ₹1000)"
  );

  // 100% discount on ₹2500 order
  const discount100 = calculateCouponDiscount(
    {
      discountType: "percentage",
      discountValue: 100,
      minOrderValue: 0,
    },
    2500
  );
  assert(
    discount100 === 2500,
    "100% discount gives full subtotal ₹2500"
  );

  // Flat discount calculation (₹500 flat on ₹2000 order = ₹500)
  const discountFlat = calculateCouponDiscount(
    {
      discountType: "flat",
      discountValue: 500,
      minOrderValue: 0,
    },
    2000
  );
  assert(
    discountFlat === 500,
    "₹500 flat discount on ₹2000 order gives ₹500 off"
  );

  // Flat discount cannot exceed order subtotal (₹500 flat on ₹350 order = ₹350)
  const discountFlatCapped = calculateCouponDiscount(
    {
      discountType: "flat",
      discountValue: 500,
      minOrderValue: 0,
    },
    350
  );
  assert(
    discountFlatCapped === 350,
    "₹500 flat discount on ₹350 order capped to subtotal ₹350"
  );

  // Minimum order value threshold
  const discountBelowMin = calculateCouponDiscount(
    {
      discountType: "percentage",
      discountValue: 20,
      minOrderValue: 1000,
    },
    800
  );
  assert(
    discountBelowMin === 0,
    "Order ₹800 below min order value ₹1000 yields ₹0 discount"
  );

  const discountAboveMin = calculateCouponDiscount(
    {
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 1000,
    },
    1500
  );
  assert(
    discountAboveMin === 150,
    "Order ₹1500 above min order value ₹1000 yields ₹150 discount (10%)"
  );

  // Zod validation rules
  // Rule A: Percentage > 100 must be rejected
  const over100Parse = CouponFormSchema.safeParse({
    code: "TEST150",
    discountType: "percentage",
    discountValue: 150,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    isActive: true,
  });
  assert(
    over100Parse.success === false,
    "CouponFormSchema rejects percentage discount > 100"
  );

  // Rule B: Negative discount must be rejected
  const negativeParse = CouponFormSchema.safeParse({
    code: "TESTNEG",
    discountType: "flat",
    discountValue: -50,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    isActive: true,
  });
  assert(
    negativeParse.success === false,
    "CouponFormSchema rejects negative discount value"
  );

  // Rule C: validUntil before validFrom must be rejected
  const dateOrderParse = CouponFormSchema.safeParse({
    code: "TESTDATES",
    discountType: "flat",
    discountValue: 100,
    validFrom: new Date(Date.now() + 86400000).toISOString(),
    validUntil: new Date(Date.now() - 86400000).toISOString(),
    isActive: true,
  });
  assert(
    dateOrderParse.success === false,
    "CouponFormSchema rejects validUntil earlier than validFrom"
  );

  // Rule D: Code auto-uppercase transformation
  const lowercaseCodeParse = CouponFormSchema.safeParse({
    code: "diwali2026",
    discountType: "percentage",
    discountValue: 20,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 86400000).toISOString(),
    isActive: true,
  });
  assert(
    lowercaseCodeParse.success === true &&
      lowercaseCodeParse.data.code === "DIWALI2026",
    "CouponFormSchema automatically uppercases lowercase code input"
  );

  // -------------------------------------------------------------------------
  // SUITE 3: STATUS DATES COMPUTATION (ACTIVE / EXPIRED / SCHEDULED / INACTIVE)
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 3: Status Computation Based on Dates & Active Flag ---");

  const testNow = new Date("2026-09-30T10:00:00Z");

  // Inactive toggle takes precedence
  const statusInactive = getCouponComputedStatus(
    {
      isActive: false,
      validFrom: "2026-09-01T00:00:00Z",
      validUntil: "2026-10-31T00:00:00Z",
    },
    testNow
  );
  assert(
    statusInactive === "inactive",
    "Coupon with isActive = false computed as 'inactive'"
  );

  // Expired coupon (validUntil in past)
  const statusExpired = getCouponComputedStatus(
    {
      isActive: true,
      validFrom: "2026-09-01T00:00:00Z",
      validUntil: "2026-09-25T00:00:00Z",
    },
    testNow
  );
  assert(
    statusExpired === "expired",
    "Coupon with validUntil in the past computed as 'expired'"
  );

  // Scheduled coupon (validFrom in the future)
  const statusScheduled = getCouponComputedStatus(
    {
      isActive: true,
      validFrom: "2026-10-05T00:00:00Z",
      validUntil: "2026-10-31T00:00:00Z",
    },
    testNow
  );
  assert(
    statusScheduled === "scheduled",
    "Coupon with validFrom in the future computed as 'scheduled'"
  );

  // Active coupon (validFrom <= testNow <= validUntil, isActive = true)
  const statusActive = getCouponComputedStatus(
    {
      isActive: true,
      validFrom: "2026-09-01T00:00:00Z",
      validUntil: "2026-10-31T00:00:00Z",
    },
    testNow
  );
  assert(
    statusActive === "active",
    "Coupon within valid date window and isActive = true computed as 'active'"
  );

  // -------------------------------------------------------------------------
  // SUITE 4: DELETION SAFEGUARD & HISTORICAL ORDER SNAPSHOT INTEGRITY
  // -------------------------------------------------------------------------
  console.log("\n--- SUITE 4: Deletion Safeguards & Snapshot Data Integrity ---");

  const testCouponCode = `TEST_SNAP_${Date.now()}`;
  let createdCouponId: string | null = null;
  let testOrderId: string | null = null;

  try {
    // 1. Insert test coupon directly into database
    const { data: couponRow, error: couponErr } = await adminClient
      .from("coupons")
      .insert({
        code: testCouponCode,
        discount_type: "flat",
        discount_value: 350.0,
        min_order_value: 1000.0,
        usage_limit: 10,
        usage_count: 0,
        valid_from: new Date(Date.now() - 3600000).toISOString(),
        valid_until: new Date(Date.now() + 86400000).toISOString(),
        is_active: true,
      })
      .select("id, code, usage_count")
      .single();

    assert(!couponErr && !!couponRow, `Created test coupon ${testCouponCode}`);
    if (!couponRow) throw new Error("Coupon row null");
    createdCouponId = couponRow.id;

    // 2. Insert a historical order referencing this coupon
    const testOrderNumber = `VEL-TST-${Date.now().toString().slice(-6)}`;
    const { data: orderRow, error: orderErr } = await adminClient
      .from("orders")
      .insert({
        order_number: testOrderNumber,
        status: "delivered",
        payment_method: "razorpay",
        payment_status: "paid",
        subtotal: 2500.0,
        shipping_charge: 0,
        discount_amount: 350.0,
        total_amount: 2150.0,
        coupon_code: testCouponCode,
        shipping_address: {
          fullName: "Test Customer",
          phone: "9876543210",
          addressLine1: "123 Test St",
          city: "Chennai",
          state: "Tamil Nadu",
          pincode: "600001",
        },
        billing_address: {
          fullName: "Test Customer",
          phone: "9876543210",
          addressLine1: "123 Test St",
          city: "Chennai",
          state: "Tamil Nadu",
          pincode: "600001",
        },
      })
      .select("id, order_number, coupon_code, discount_amount, total_amount")
      .single();

    if (orderErr) {
      console.error("Order insertion error:", orderErr);
    }
    assert(!orderErr && !!orderRow, `Created test order ${testOrderNumber} referencing coupon`);
    if (!orderRow) throw new Error("Order row null");
    testOrderId = orderRow.id;

    // 3. Increment coupon usage_count to simulate checkout increment
    const { error: incErr } = await adminClient
      .from("coupons")
      .update({ usage_count: 1 })
      .eq("id", createdCouponId);
    assert(!incErr, "Updated test coupon usage_count to 1");

    // 4. Verify coupon has usage_count > 0 before deletion
    const { data: fetchedCoupon } = await adminClient
      .from("coupons")
      .select("usage_count")
      .eq("id", createdCouponId)
      .single();
    assert(
      (fetchedCoupon?.usage_count || 0) === 1,
      "Coupon reflects usage_count = 1 prior to deletion"
    );

    // 5. Delete the coupon from the database
    const { error: delErr } = await adminClient
      .from("coupons")
      .delete()
      .eq("id", createdCouponId);
    assert(!delErr, `Deleted coupon ${testCouponCode} from coupons table`);

    // 6. Query the historical order to verify snapshot integrity
    const { data: historicalOrder, error: histErr } = await adminClient
      .from("orders")
      .select("id, order_number, coupon_code, discount_amount, total_amount, status")
      .eq("id", testOrderId)
      .single();

    assert(!histErr && !!historicalOrder, "Historical order is still present in database");
    if (!historicalOrder) throw new Error("Historical order null");
    assert(
      historicalOrder.coupon_code === testCouponCode,
      `Historical order preserved coupon_code string '${historicalOrder.coupon_code}' intact after coupon row was deleted`
    );
    assert(
      Number(historicalOrder.discount_amount) === 350.0,
      `Historical order preserved discount_amount ₹${historicalOrder.discount_amount} snapshot intact`
    );
    assert(
      Number(historicalOrder.total_amount) === 2150.0,
      `Historical order preserved total_amount ₹${historicalOrder.total_amount} intact`
    );
    console.log(
      "✅ Verified snapshot integrity: historical order is unaffected by coupon deletion!"
    );
  } finally {
    // Cleanup test data
    if (testOrderId) {
      await adminClient.from("orders").delete().eq("id", testOrderId);
      console.log(`Cleaned up test order ${testOrderId}`);
    }
    if (createdCouponId) {
      await adminClient.from("coupons").delete().eq("id", createdCouponId);
      console.log(`Cleaned up test coupon ${createdCouponId}`);
    }
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL PHASE 5C ADMIN COUPON TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

main().catch((err) => {
  console.error("\n❌ Test execution failed:", err);
  process.exit(1);
});
