export {};

/**
 * Seeding Script for Pooja & Brass Items Category & Simple Product Draft Shells
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

async function seedPoojaAndBrass() {
  console.log("================================================================");
  console.log("     SEEDING POOJA & BRASS ITEMS CATEGORIES & DRAFT SHELLS      ");
  console.log("================================================================\n");

  const { createAdminClient } = await import("../lib/supabase/admin");
  const admin = createAdminClient();

  // 1. Top-Level Category: Pooja & Brass Items
  const poojaTopId = "a8888888-8888-4888-a888-888888888888";
  const { error: poojaCatErr } = await admin.from("categories").upsert({
    id: poojaTopId,
    name: "Pooja & Brass Items",
    slug: "pooja-and-brass",
    description: "Traditional lamps, handcrafted brassware, and sacred essentials for your home and pooja room.",
    display_order: 8,
    is_active: true,
    parent_id: null,
    seo_title: "Pooja & Brass Items Collection | Velaash",
    seo_description: "Discover traditional brass kuthuvilakku, lamps, diyas, and sacred pooja accessories at Velaash.",
  }, { onConflict: "slug" });

  if (poojaCatErr) {
    console.error("Failed to seed Pooja & Brass top-level category:", poojaCatErr);
    process.exit(1);
  }
  console.log("✓ Seeded top-level category: Pooja & Brass Items (slug: pooja-and-brass)");

  // 2. Sub-categories
  const subcategories = [
    {
      id: "b8888888-8888-4888-b888-111111111111",
      name: "Lamps & Diyas",
      slug: "lamps-diyas",
      description: "Traditional brass kuthuvilakku, table lamps, hanging lamps, and handcrafted oil diyas.",
      display_order: 1,
      is_active: true,
      parent_id: poojaTopId,
      seo_title: "Lamps & Diyas — Traditional Brass Lighting | Velaash",
      seo_description: "Shop traditional brass kuthuvilakku, table lamps, and festive diyas at Velaash.",
    },
    {
      id: "b8888888-8888-4888-b888-222222222222",
      name: "Pooja Accessories",
      slug: "pooja-accessories",
      description: "Bells, brass aarti plates, incense holders, and sacred pooja essentials.",
      display_order: 2,
      is_active: true,
      parent_id: poojaTopId,
      seo_title: "Pooja Accessories — Sacred Brassware | Velaash",
      seo_description: "Discover brass bells, pooja thalis, and traditional accessories at Velaash.",
    },
  ];

  for (const sub of subcategories) {
    const { error: subErr } = await admin.from("categories").upsert({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      description: sub.description,
      display_order: sub.display_order,
      is_active: sub.is_active,
      parent_id: sub.parent_id,
      seo_title: sub.seo_title,
      seo_description: sub.seo_description,
    }, { onConflict: "slug" });

    if (subErr) {
      console.error(`Failed to seed subcategory ${sub.name}:`, subErr);
      process.exit(1);
    }
    console.log(`✓ Seeded subcategory: ${sub.name} (slug: ${sub.slug})`);
  }

  // 3. Simple Product Draft Shells (STRICTLY DEACTIVATED: is_active = false)
  const draftProducts = [
    {
      id: "c8888888-8888-4888-c888-111111111111",
      category_id: "b8888888-8888-4888-b888-111111111111", // Lamps & Diyas
      name: "DRAFT — Traditional Brass Kuthuvilakku",
      slug: "draft-traditional-brass-kuthuvilakku",
      description: "Placeholder draft shell — awaiting client specifications and photography",
      base_price: 2499,
      compare_at_price: 2999,
      has_variants: false,
      stock_quantity: 10,
      specifications: [
        { label: "Material", value: "Brass" },
        { label: "Finish", value: "Gold-tone" },
        { label: "Height", value: "[placeholder — awaiting real measurement]" },
        { label: "Weight", value: "[placeholder — awaiting real measurement]" },
      ],
      fabric: null,
      care_instructions: null,
      craftsmanship: null,
      is_active: false,
      is_featured: false,
      is_made_to_order: false,
      stock_status: "in_stock" as const,
      hsn_code: "7419",
      gst_rate: 12.00,
      seo_title: "DRAFT — Traditional Brass Kuthuvilakku | Velaash",
      seo_description: "Placeholder draft shell for brass kuthuvilakku.",
    },
    {
      id: "c8888888-8888-4888-c888-222222222222",
      category_id: "b8888888-8888-4888-b888-111111111111", // Lamps & Diyas
      name: "DRAFT — Traditional Brass Lamp",
      slug: "draft-traditional-brass-lamp",
      description: "Placeholder draft shell — awaiting client specifications and photography",
      base_price: 1899,
      compare_at_price: 2299,
      has_variants: false,
      stock_quantity: 10,
      specifications: [
        { label: "Material", value: "Brass" },
        { label: "Finish", value: "Gold-tone" },
        { label: "Height", value: "[placeholder — awaiting real measurement]" },
        { label: "Weight", value: "[placeholder — awaiting real measurement]" },
      ],
      fabric: null,
      care_instructions: null,
      craftsmanship: null,
      is_active: false,
      is_featured: false,
      is_made_to_order: false,
      stock_status: "in_stock" as const,
      hsn_code: "7419",
      gst_rate: 12.00,
      seo_title: "DRAFT — Traditional Brass Lamp | Velaash",
      seo_description: "Placeholder draft shell for traditional brass lamp.",
    },
  ];

  for (const prod of draftProducts) {
    const { error: prodErr } = await admin.from("products").upsert({
      id: prod.id,
      name: prod.name,
      slug: prod.slug,
      description: prod.description,
      category_id: prod.category_id,
      base_price: prod.base_price,
      compare_at_price: prod.compare_at_price,
      has_variants: prod.has_variants,
      stock_quantity: prod.stock_quantity,
      specifications: prod.specifications,
      fabric: prod.fabric,
      care_instructions: prod.care_instructions,
      craftsmanship: prod.craftsmanship,
      is_active: prod.is_active,
      is_featured: prod.is_featured,
      is_made_to_order: prod.is_made_to_order,
      stock_status: prod.stock_status,
      hsn_code: prod.hsn_code,
      gst_rate: prod.gst_rate,
      seo_title: prod.seo_title,
      seo_description: prod.seo_description,
    }, { onConflict: "slug" });

    if (prodErr) {
      console.error(`Failed to seed draft product ${prod.name}:`, prodErr);
      process.exit(1);
    }
    console.log(`✓ Seeded simple product draft shell: ${prod.name} (is_active: false, stock: ${prod.stock_quantity})`);
  }

  console.log("\n================================================================");
  console.log("       ALL POOJA & BRASS ITEMS DATA SEEDED SUCCESSFULLY!        ");
  console.log("================================================================");
}

seedPoojaAndBrass().catch((e) => {
  console.error(e);
  process.exit(1);
});
