export {};

// Load environment variables for standalone Node execution
try {
  process.loadEnvFile(".env.local");
} catch {
  // Ignore if already loaded in environment
}

// Node < 22 WebSocket shim for @supabase/realtime-js
if (typeof globalThis.WebSocket === "undefined") {
  // @ts-expect-error WebSocket shim for Node 20
  globalThis.WebSocket = class DummyWebSocket {
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

async function runAccountSubpagesTests() {
  console.log("================================================================");
  console.log("    VELAASH PHASE 4B: ADDRESSES & WISHLIST TEST SUITE           ");
  console.log("================================================================\n");

  const { createAdminClient } = await import("../lib/supabase/admin");
  const {
    executeAddAddress,
    executeUpdateAddress,
    executeDeleteAddress,
    executeSetDefaultAddress,
  } = await import("../features/addresses/actions/address-actions");
  const { getCustomerAddresses } = await import(
    "../features/addresses/queries/get-customer-addresses"
  );
  const {
    executeToggleWishlist,
    executeRemoveFromWishlist,
  } = await import("../features/wishlist/actions/wishlist-actions");
  const { getCustomerWishlist } = await import(
    "../features/wishlist/queries/get-customer-wishlist"
  );
  const { getWishlistProductIds } = await import(
    "../features/wishlist/queries/get-wishlist-product-ids"
  );

  const supabase = createAdminClient();

  // Helper to ensure realistic test customer
  async function getOrCreateTestCustomer(email: string, fullName: string) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    let userId: string;

    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email,
        password: "TestPassword123!",
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error || !created.user) {
        throw new Error(`Failed to create test user: ${error?.message}`);
      }
      userId = created.user.id;
    }

    await supabase.from("customers").upsert({
      id: userId,
      full_name: fullName,
      phone: "9876543210",
    });

    return userId;
  }

  const testCustomerEmail = "test.subpages.phase4b@velaash.test";
  const customerId = await getOrCreateTestCustomer(
    testCustomerEmail,
    "Ananya Sundaram"
  );
  console.log(`[INFO] Test customer initialized with ID: ${customerId}\n`);

  try {
    // Clean up any existing addresses or wishlists for this test customer
    await supabase.from("addresses").delete().eq("customer_id", customerId);
    await supabase.from("wishlists").delete().eq("customer_id", customerId);

    // =========================================================================
    // SECTION 1: SAVED ADDRESSES CRUD & DEFAULT REASSIGNMENT
    // =========================================================================
    console.log("--- SECTION 1: SAVED ADDRESSES CRUD & SINGLE-DEFAULT TRIGGER ---");

    // Test 1.1: Add First Address (Should automatically become default)
    console.log("\n[Test 1.1] Adding first address for customer (Auto-default test)");
    const addResult1 = await executeAddAddress(supabase, customerId, {
      fullName: "Ananya Sundaram",
      phone: "9876543210",
      addressLine1: "Flat 4B, Emerald Heights",
      addressLine2: "Avinashi Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641018",
      addressType: "home",
      isDefault: false, // Even if passed false, first address must become default = true
    });

    assert(addResult1.success, "Address 1 added successfully");
    assert(
      addResult1.address?.isDefault === true,
      "Address 1 was automatically set as default because it is the first address",
      `isDefault: ${addResult1.address?.isDefault}`
    );
    const addr1Id = addResult1.address!.id;

    // Test 1.2: Add Second Address (Work, isDefault = false)
    console.log("\n[Test 1.2] Adding second address (Work, isDefault = false)");
    const addResult2 = await executeAddAddress(supabase, customerId, {
      fullName: "Ananya S. - Studio",
      phone: "9876543211",
      addressLine1: "Suite 201, Textile Tech Park",
      addressLine2: "Peelamedu",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641004",
      addressType: "work",
      isDefault: false,
    });

    assert(addResult2.success, "Address 2 added successfully");
    assert(
      addResult2.address?.isDefault === false,
      "Address 2 has isDefault = false"
    );
    const addr2Id = addResult2.address!.id;

    // Verify list addresses: Address 1 is pinned first (default), followed by Address 2
    const listAfter2 = await getCustomerAddresses(customerId);
    assert(listAfter2.length === 2, "Customer has 2 saved addresses");
    assert(
      listAfter2[0].id === addr1Id && listAfter2[0].isDefault === true,
      "Default address (Address 1) is pinned first in the query results"
    );

    // Test 1.3: Add Third Address with isDefault = true (Trigger unsets previous default)
    console.log("\n[Test 1.3] Adding third address with isDefault = true (Single-default trigger test)");
    const addResult3 = await executeAddAddress(supabase, customerId, {
      fullName: "Ananya Sundaram - Holiday Home",
      phone: "9876543212",
      addressLine1: "Bungalow 7, Valley View",
      addressLine2: "Coonoor Road",
      city: "Ooty",
      state: "Tamil Nadu",
      pincode: "643001",
      addressType: "other",
      isDefault: true,
    });

    assert(addResult3.success, "Address 3 added successfully with isDefault = true");
    const addr3Id = addResult3.address!.id;

    // Check in database directly: Address 1 should now have isDefault = false!
    const { data: dbAddr1 } = await supabase
      .from("addresses")
      .select("is_default")
      .eq("id", addr1Id)
      .single();

    assert(
      dbAddr1?.is_default === false,
      "Database trigger correctly unset is_default on Address 1 when Address 3 became default",
      `Address 1 is_default in DB: ${dbAddr1?.is_default}`
    );

    // Test 1.4: In-place edit of Address 2
    console.log("\n[Test 1.4] In-place editing Address 2 (Updating city and address line)");
    const updateResult = await executeUpdateAddress(supabase, customerId, addr2Id, {
      fullName: "Ananya S. - Executive Office",
      phone: "9876543211",
      addressLine1: "Tower B, Level 5, Velaash HQ",
      addressLine2: "Avinashi High Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641014",
      addressType: "work",
      isDefault: false,
    });

    assert(updateResult.success, "Address 2 updated in place");
    assert(
      updateResult.address?.fullName === "Ananya S. - Executive Office",
      "Address 2 fullName was updated correctly"
    );
    assert(
      updateResult.address?.city === "Coimbatore" &&
        updateResult.address?.pincode === "641014",
      "Address 2 city and pincode updated correctly"
    );

    // Test 1.5: Set Address 2 as Default via executeSetDefaultAddress
    console.log("\n[Test 1.5] Setting Address 2 as Default via executeSetDefaultAddress");
    const setDefaultResult = await executeSetDefaultAddress(supabase, customerId, addr2Id);
    assert(setDefaultResult.success, "executeSetDefaultAddress returned success");

    const { data: checkAddrs } = await supabase
      .from("addresses")
      .select("id, is_default")
      .eq("customer_id", customerId);

    const addr2Default = checkAddrs?.find((a) => a.id === addr2Id)?.is_default;
    const addr3Default = checkAddrs?.find((a) => a.id === addr3Id)?.is_default;

    assert(addr2Default === true, "Address 2 is now the default address");
    assert(addr3Default === false, "Address 3 was automatically unset as default");

    // Test 1.6: Delete Default Address (Address 2) with explicit new default assignment
    console.log("\n[Test 1.6] Deleting default address (Address 2) and promoting Address 1");
    const deleteResult1 = await executeDeleteAddress(
      supabase,
      customerId,
      addr2Id,
      addr1Id
    );

    assert(deleteResult1.success, "Default address (Address 2) deleted successfully");
    assert(
      deleteResult1.newDefaultId === addr1Id,
      "Address 1 was designated as the new default address on deletion"
    );

    const listAfterDelete = await getCustomerAddresses(customerId);
    assert(listAfterDelete.length === 2, "2 addresses remain");
    assert(
      listAfterDelete[0].id === addr1Id && listAfterDelete[0].isDefault === true,
      "Address 1 is now verified as default address and pinned first"
    );

    // Test 1.7: Delete remaining addresses down to 0
    console.log("\n[Test 1.7] Deleting remaining addresses down to 0");
    await executeDeleteAddress(supabase, customerId, addr1Id);
    await executeDeleteAddress(supabase, customerId, addr3Id);

    const listEmpty = await getCustomerAddresses(customerId);
    assert(listEmpty.length === 0, "All addresses deleted; returns empty list []");

    // =========================================================================
    // SECTION 2: REAL WISHLIST READ/WRITE & RE-FETCH
    // =========================================================================
    console.log("\n--- SECTION 2: REAL WISHLIST READ/WRITE & RE-FETCH ---");

    // Find an active product to test
    const { data: sampleProducts } = await supabase
      .from("products")
      .select("id, name, slug, is_active")
      .eq("is_active", true)
      .limit(2);

    if (!sampleProducts || sampleProducts.length === 0) {
      throw new Error("No active products found in database to run wishlist tests.");
    }

    const testProduct1 = sampleProducts[0];
    console.log(`[INFO] Using active test product: "${testProduct1.name}" (${testProduct1.id})`);

    // Test 2.1: Add product to wishlist
    console.log("\n[Test 2.1] Adding product to wishlist via executeToggleWishlist");
    const toggleAdd = await executeToggleWishlist(supabase, customerId, testProduct1.id);
    assert(toggleAdd.success, "executeToggleWishlist succeeded");
    assert(
      toggleAdd.isWishlisted === true,
      "executeToggleWishlist reports product is now wishlisted (true)"
    );

    // Test 2.2: Re-fetch wishlist and verify real data
    console.log("\n[Test 2.2] Re-fetching customer wishlist via getCustomerWishlist");
    const wishlistData1 = await getCustomerWishlist(customerId);
    assert(
      wishlistData1.totalCount === 1,
      "getCustomerWishlist returns totalCount: 1"
    );
    assert(
      wishlistData1.wishlistProductIds.includes(testProduct1.id),
      "wishlistProductIds contains the wishlisted product ID"
    );
    assert(
      wishlistData1.products[0].id === testProduct1.id,
      "products array contains the matching ProductListItem"
    );

    const idsOnly = await getWishlistProductIds(customerId);
    assert(
      idsOnly.length === 1 && idsOnly[0] === testProduct1.id,
      "getWishlistProductIds returns [productId] for fast header badge hydration"
    );

    // Test 2.3: Toggle Wishlist off (Remove item)
    console.log("\n[Test 2.3] Toggling product off via executeToggleWishlist");
    const toggleRemove = await executeToggleWishlist(supabase, customerId, testProduct1.id);
    assert(toggleRemove.success, "executeToggleWishlist succeeded on remove");
    assert(
      toggleRemove.isWishlisted === false,
      "executeToggleWishlist reports product is no longer wishlisted (false)"
    );

    const wishlistData2 = await getCustomerWishlist(customerId);
    assert(
      wishlistData2.totalCount === 0 && wishlistData2.products.length === 0,
      "Re-fetch after removal confirms empty wishlist"
    );

    // Test 2.4: Explicit executeRemoveFromWishlist
    console.log("\n[Test 2.4] Adding item again and removing via executeRemoveFromWishlist");
    await executeToggleWishlist(supabase, customerId, testProduct1.id);
    const removeExplicit = await executeRemoveFromWishlist(supabase, customerId, testProduct1.id);
    assert(removeExplicit.success, "executeRemoveFromWishlist succeeded");

    const wishlistData3 = await getCustomerWishlist(customerId);
    assert(wishlistData3.totalCount === 0, "Wishlist is empty after explicit remove");

    // =========================================================================
    // SECTION 3: INACTIVE / UNPUBLISHED PRODUCT RESILIENCE
    // =========================================================================
    console.log("\n--- SECTION 3: INACTIVE / UNPUBLISHED PRODUCT RESILIENCE ---");

    // Insert a temporary test product with is_active = false
    const inactiveProductSlug = `test-archived-product-${Date.now()}`;
    const { data: insertedInactive, error: inactiveInsertError } = await supabase
      .from("products")
      .insert({
        name: "Archived Vintage Kurta (Inactive)",
        slug: inactiveProductSlug,
        description: "An archived piece no longer offered in catalog.",
        base_price: 2499,
        is_active: false,
        is_featured: false,
        stock_status: "out_of_stock",
      })
      .select("id, name, is_active")
      .single();

    if (inactiveInsertError || !insertedInactive) {
      throw new Error(`Failed to create test inactive product: ${inactiveInsertError?.message}`);
    }

    const inactiveProductId = insertedInactive.id;
    console.log(`[INFO] Created inactive product: "${insertedInactive.name}" (${inactiveProductId})`);

    try {
      // Add inactive product to wishlist
      await executeToggleWishlist(supabase, customerId, inactiveProductId);

      // Also add active product to test coexistence
      await executeToggleWishlist(supabase, customerId, testProduct1.id);

      // Test 3.1: getCustomerWishlist executes without crashing and handles inactive product gracefully
      console.log("\n[Test 3.1] Fetching wishlist containing an inactive product");
      const mixedWishlist = await getCustomerWishlist(customerId);

      assert(
        mixedWishlist.totalCount === 2,
        "getCustomerWishlist successfully fetched both products without breaking"
      );

      const inactiveFound = mixedWishlist.products.find((p) => p.id === inactiveProductId);
      assert(
        Boolean(inactiveFound),
        "Inactive product is safely returned in the wishlist dataset"
      );
      assert(
        inactiveFound?.is_active === false,
        "Inactive product preserves is_active = false for UI 'No Longer Available' banner",
        `is_active: ${inactiveFound?.is_active}`
      );

      const activeFound = mixedWishlist.products.find((p) => p.id === testProduct1.id);
      assert(
        Boolean(activeFound && activeFound.is_active === true),
        "Active product remains fully functional alongside the inactive product"
      );

      // Test 3.2: User can remove inactive product without issues
      console.log("\n[Test 3.2] Removing inactive product from customer wishlist");
      const removeInactive = await executeRemoveFromWishlist(supabase, customerId, inactiveProductId);
      assert(removeInactive.success, "Inactive product removed from wishlist successfully");

      const cleanWishlist = await getCustomerWishlist(customerId);
      assert(
        cleanWishlist.totalCount === 1 && cleanWishlist.products[0].id === testProduct1.id,
        "Wishlist now contains only the active product"
      );

      // Clean up the remaining active item
      await executeRemoveFromWishlist(supabase, customerId, testProduct1.id);
    } finally {
      // Clean up temporary inactive product
      await supabase.from("products").delete().eq("id", inactiveProductId);
    }

    console.log("\n================================================================");
    console.log(`    ALL ${totalTests} TESTS PASSED SUCCESSFULLY! (${passedTests}/${totalTests})`);
    console.log("================================================================\n");
  } finally {
    // Final cleanup of test customer records
    await supabase.from("addresses").delete().eq("customer_id", customerId);
    await supabase.from("wishlists").delete().eq("customer_id", customerId);
  }
}

runAccountSubpagesTests().catch((err) => {
  console.error("\n[FATAL TEST RUNNER ERROR]:", err);
  process.exit(1);
});
