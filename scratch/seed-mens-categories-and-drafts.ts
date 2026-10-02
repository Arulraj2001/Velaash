export {};

/**
 * Seeding script for Men's Clothing Navigation, Categories, Size Charts, and Draft Products
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

async function seedMensClothing() {
  console.log("================================================================");
  console.log("       SEEDING MEN'S CLOTHING CATEGORIES & DRAFT SHELLS        ");
  console.log("================================================================\n");

  const { createAdminClient } = await import("../lib/supabase/admin");
  const admin = createAdminClient();

  // 1. Top-Level Category: Men
  const menTopId = "a7777777-7777-4777-a777-777777777777";
  const { error: menCatErr } = await admin.from("categories").upsert({
    id: menTopId,
    name: "Men",
    slug: "men",
    description: "Contemporary handcrafted clothing for men, tailored in premium natural fabrics.",
    display_order: 7,
    is_active: true,
    parent_id: null,
    seo_title: "Men's Clothing Collection | Velaash",
    seo_description: "Shop handcrafted shirts, kurtas, t-shirts, and bottoms for men at Velaash. Crafted in pure cotton, linen, and artisanal weaves.",
  }, { onConflict: "slug" });

  if (menCatErr) {
    console.error("Failed to seed Men top-level category:", menCatErr);
    process.exit(1);
  }
  console.log("✓ Seeded top-level category: Men (slug: men)");

  // 2. Sub-categories
  const subcategories = [
    {
      id: "b7777777-7777-4777-b777-111111111111",
      name: "Shirts",
      slug: "men-shirts",
      description: "Casual, formal, and resort shirts tailored in pure linen and crisp handloom cotton.",
      display_order: 1,
      parent_id: menTopId,
      seo_title: "Men's Shirts — Linen & Cotton Shirts | Velaash",
      seo_description: "Discover handcrafted men's shirts in pure breathable linen and lightweight cotton.",
    },
    {
      id: "b7777777-7777-4777-b777-222222222222",
      name: "Kurtas",
      slug: "men-kurtas",
      description: "Short and classic length kurtas with subtle embroidery and mandarin collars.",
      display_order: 2,
      parent_id: menTopId,
      seo_title: "Men's Kurtas — Handcrafted Ethnic Wear | Velaash",
      seo_description: "Shop elegant men's kurtas for festive occasions and comfortable everyday wear.",
    },
    {
      id: "b7777777-7777-4777-b777-333333333333",
      name: "T-Shirts",
      slug: "men-t-shirts",
      description: "Everyday crew necks and polo t-shirts crafted from ultra-fine combed cotton.",
      display_order: 3,
      parent_id: menTopId,
      seo_title: "Men's T-Shirts & Polos | Velaash",
      seo_description: "Ultra-soft everyday tees and knit polos for effortless casual style.",
    },
    {
      id: "b7777777-7777-4777-b777-444444444444",
      name: "Bottoms",
      slug: "men-bottoms",
      description: "Relaxed drawstring trousers, tailored chinos, and easy linen pants for men.",
      display_order: 4,
      parent_id: menTopId,
      seo_title: "Men's Bottoms — Trousers & Pants | Velaash",
      seo_description: "Comfort-fit trousers and breathable linen bottoms designed for all-day ease.",
    },
  ];

  for (const sub of subcategories) {
    const { error: subErr } = await admin.from("categories").upsert({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      description: sub.description,
      display_order: sub.display_order,
      is_active: true,
      parent_id: sub.parent_id,
      seo_title: sub.seo_title,
      seo_description: sub.seo_description,
    }, { onConflict: "slug" });

    if (subErr) {
      console.error(`Failed to seed subcategory ${sub.name}:`, subErr);
    } else {
      console.log(`✓ Seeded subcategory: Men > ${sub.name} (slug: ${sub.slug})`);
    }
  }

  // 3. Category Size Charts
  const sizeCharts = [
    {
      id: "c7777777-7777-4777-c777-111111111111",
      category_id: "b7777777-7777-4777-b777-111111111111",
      name: "Men's Shirts Size Chart",
      measurement_unit: "inches",
      chart_data: {
        headers: ["Size", "Chest (in)", "Collar (in)", "Shoulder (in)", "Length (in)", "Sleeve (in)"],
        rows: [
          { Size: "S", "Chest (in)": "38", "Collar (in)": "15.0", "Shoulder (in)": "17.5", "Length (in)": "28.5", "Sleeve (in)": "24.5" },
          { Size: "M", "Chest (in)": "40", "Collar (in)": "15.5", "Shoulder (in)": "18.0", "Length (in)": "29.0", "Sleeve (in)": "25.0" },
          { Size: "L", "Chest (in)": "42", "Collar (in)": "16.0", "Shoulder (in)": "18.5", "Length (in)": "29.5", "Sleeve (in)": "25.5" },
          { Size: "XL", "Chest (in)": "44", "Collar (in)": "16.5", "Shoulder (in)": "19.0", "Length (in)": "30.0", "Sleeve (in)": "26.0" },
          { Size: "XXL", "Chest (in)": "46", "Collar (in)": "17.0", "Shoulder (in)": "19.5", "Length (in)": "30.5", "Sleeve (in)": "26.5" },
        ],
        tips: [
          "Chest: Measure around the fullest part of your chest, keeping the measuring tape horizontal.",
          "Collar: Measure around the base of your neck where your shirt collar sits.",
          "Shoulder: Measure across the back from the tip of one shoulder bone to the other.",
          "Length: Measure from the highest point of the shoulder down to the desired hemline.",
          "Fits true to regular fit. If you prefer a relaxed silhouette, consider one size up.",
        ],
      },
    },
    {
      id: "c7777777-7777-4777-c777-222222222222",
      category_id: "b7777777-7777-4777-b777-222222222222",
      name: "Men's Kurtas Size Chart",
      measurement_unit: "inches",
      chart_data: {
        headers: ["Size", "Chest (in)", "Shoulder (in)", "Kurta Length (in)", "Sleeve (in)"],
        rows: [
          { Size: "S", "Chest (in)": "38", "Shoulder (in)": "17.5", "Kurta Length (in)": "40.0", "Sleeve (in)": "24.5" },
          { Size: "M", "Chest (in)": "40", "Shoulder (in)": "18.0", "Kurta Length (in)": "41.0", "Sleeve (in)": "25.0" },
          { Size: "L", "Chest (in)": "42", "Shoulder (in)": "18.5", "Kurta Length (in)": "42.0", "Sleeve (in)": "25.5" },
          { Size: "XL", "Chest (in)": "44", "Shoulder (in)": "19.0", "Kurta Length (in)": "43.0", "Sleeve (in)": "26.0" },
          { Size: "XXL", "Chest (in)": "46", "Shoulder (in)": "19.5", "Kurta Length (in)": "44.0", "Sleeve (in)": "26.5" },
        ],
        tips: [
          "Chest: Measure under your arms around the fullest part of your chest.",
          "Length: Classic knee-length cut measured from the shoulder seam.",
          "Garment measurements include 4-5 inches of ease for traditional relaxed drape.",
        ],
      },
    },
    {
      id: "c7777777-7777-4777-c777-333333333333",
      category_id: "b7777777-7777-4777-b777-333333333333",
      name: "Men's T-Shirts Size Chart",
      measurement_unit: "inches",
      chart_data: {
        headers: ["Size", "Chest (in)", "Length (in)", "Shoulder (in)", "Sleeve (in)"],
        rows: [
          { Size: "S", "Chest (in)": "38", "Length (in)": "27.0", "Shoulder (in)": "17.0", "Sleeve (in)": "8.0" },
          { Size: "M", "Chest (in)": "40", "Length (in)": "28.0", "Shoulder (in)": "17.5", "Sleeve (in)": "8.5" },
          { Size: "L", "Chest (in)": "42", "Length (in)": "29.0", "Shoulder (in)": "18.0", "Sleeve (in)": "9.0" },
          { Size: "XL", "Chest (in)": "44", "Length (in)": "30.0", "Shoulder (in)": "18.5", "Sleeve (in)": "9.5" },
          { Size: "XXL", "Chest (in)": "46", "Length (in)": "31.0", "Shoulder (in)": "19.0", "Sleeve (in)": "10.0" },
        ],
        tips: [
          "Chest: Measure across the fullest part of your torso.",
          "Length: Measured from high shoulder point to bottom hem.",
          "Regular fit cut. Pre-shrunk 100% combed cotton jersey.",
        ],
      },
    },
    {
      id: "c7777777-7777-4777-c777-444444444444",
      category_id: "b7777777-7777-4777-b777-444444444444",
      name: "Men's Bottoms Size Chart",
      measurement_unit: "inches",
      chart_data: {
        headers: ["Size", "Waist (in)", "Hip (in)", "Inseam (in)", "Outseam (in)"],
        rows: [
          { Size: "S", "Waist (in)": "30", "Hip (in)": "38", "Inseam (in)": "30.5", "Outseam (in)": "40.0" },
          { Size: "M", "Waist (in)": "32", "Hip (in)": "40", "Inseam (in)": "31.0", "Outseam (in)": "41.0" },
          { Size: "L", "Waist (in)": "34", "Hip (in)": "42", "Inseam (in)": "31.5", "Outseam (in)": "41.5" },
          { Size: "XL", "Waist (in)": "36", "Hip (in)": "44", "Inseam (in)": "32.0", "Outseam (in)": "42.0" },
          { Size: "XXL", "Waist (in)": "38", "Hip (in)": "46", "Inseam (in)": "32.5", "Outseam (in)": "42.5" },
        ],
        tips: [
          "Waist: Measure around your natural waistline where you comfortably wear your pants.",
          "Inseam: Measure from the crotch point down to the ankle hem.",
          "Elasticated waistband with drawstring allows ~1.5 inches of flexibility.",
        ],
      },
    },
  ];

  for (const chart of sizeCharts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: chartErr } = await admin.from("size_charts").upsert(chart as any, { onConflict: "id" });
    if (chartErr) {
      console.error(`Failed to seed size chart ${chart.name}:`, chartErr);
    } else {
      console.log(`✓ Seeded size chart: ${chart.name}`);
    }
  }

  // 4. Draft Placeholder Products (2 per subcategory = 8 products)
  // ALL DEACTIVATED (is_active: false)
  const draftProducts = [
    // Shirts
    {
      name: "DRAFT — Classic Linen Casual Shirt",
      slug: "draft-mens-classic-linen-shirt",
      description: "Placeholder draft shell for upcoming men's pure linen casual shirt. To be updated with final photography and catalog copy upon client delivery.",
      category_id: "b7777777-7777-4777-b777-111111111111",
      base_price: 2499,
      fabric: "100% Pure European Linen",
      care_instructions: "Machine wash cold with like colors. Warm iron damp.",
      colors: [{ name: "Ivory White", hex: "#F5F5F0" }, { name: "Sage Green", hex: "#8A9A86" }],
    },
    {
      name: "DRAFT — Handloom Slub Cotton Shirt",
      slug: "draft-mens-handloom-cotton-shirt",
      description: "Placeholder draft shell for men's handloom cotton shirt. Awaiting client photography and specs.",
      category_id: "b7777777-7777-4777-b777-111111111111",
      base_price: 2199,
      fabric: "Hand-spun Organic Cotton",
      care_instructions: "Gentle wash with mild liquid detergent.",
      colors: [{ name: "Sky Blue", hex: "#87CEEB" }],
    },
    // Kurtas
    {
      name: "DRAFT — Mandarin Collar Short Kurta",
      slug: "draft-mens-mandarin-short-kurta",
      description: "Placeholder draft shell for men's short festive kurta. Awaiting client photography and specs.",
      category_id: "b7777777-7777-4777-b777-222222222222",
      base_price: 2799,
      fabric: "Chanderi Cotton Blend",
      care_instructions: "Dry clean recommended for first wash.",
      colors: [{ name: "Mustard Gold", hex: "#D4AF37" }, { name: "Deep Maroon", hex: "#800000" }],
    },
    {
      name: "DRAFT — Long Hand-Embroidered Kurta",
      slug: "draft-mens-long-embroidered-kurta",
      description: "Placeholder draft shell for classic men's long kurta. Awaiting client photography and specs.",
      category_id: "b7777777-7777-4777-b777-222222222222",
      base_price: 3299,
      fabric: "Fine Handloom Mulmul",
      care_instructions: "Dry clean only.",
      colors: [{ name: "Pearl White", hex: "#FDFBF7" }],
    },
    // T-Shirts
    {
      name: "DRAFT — Supima Crew Neck Tee",
      slug: "draft-mens-supima-crew-tee",
      description: "Placeholder draft shell for men's everyday combed cotton crew tee. Awaiting client photography and specs.",
      category_id: "b7777777-7777-4777-b777-333333333333",
      base_price: 1299,
      fabric: "100% Combed Cotton Jersey (220 GSM)",
      care_instructions: "Machine wash cold. Do not tumble dry.",
      colors: [{ name: "Midnight Navy", hex: "#1A2530" }, { name: "Heather Gray", hex: "#A8A8A8" }],
    },
    {
      name: "DRAFT — Breathable Pique Knit Polo",
      slug: "draft-mens-pique-knit-polo",
      description: "Placeholder draft shell for men's classic polo shirt. Awaiting client photography and specs.",
      category_id: "b7777777-7777-4777-b777-333333333333",
      base_price: 1699,
      fabric: "100% Breathable Cotton Pique",
      care_instructions: "Machine wash cold inside out.",
      colors: [{ name: "Forest Olive", hex: "#3B4D3C" }],
    },
    // Bottoms
    {
      name: "DRAFT — Relaxed Linen Drawstring Pants",
      slug: "draft-mens-relaxed-linen-pants",
      description: "Placeholder draft shell for men's summer linen drawstring pants. Awaiting client photography and specs.",
      category_id: "b7777777-7777-4777-b777-444444444444",
      base_price: 2699,
      fabric: "100% Slub Linen",
      care_instructions: "Hand wash or gentle machine wash.",
      colors: [{ name: "Natural Beige", hex: "#E8E2D5" }, { name: "Charcoal Black", hex: "#2B2B2B" }],
    },
    {
      name: "DRAFT — Tailored Cotton Chino Trousers",
      slug: "draft-mens-tailored-cotton-chinos",
      description: "Placeholder draft shell for men's flat-front tailored cotton chinos. Awaiting client photography and specs.",
      category_id: "b7777777-7777-4777-b777-444444444444",
      base_price: 2999,
      fabric: "Cotton Twill with 2% Elastane",
      care_instructions: "Machine wash cold. Warm iron.",
      colors: [{ name: "Khaki Tan", hex: "#C3B091" }],
    },
  ];

  const standardSizes = ["S", "M", "L", "XL", "XXL"];

  for (const dp of draftProducts) {
    // 1. Insert/update product with is_active: false
    const { data: prod, error: prodErr } = await admin
      .from("products")
      .upsert({
        name: dp.name,
        slug: dp.slug,
        description: dp.description,
        category_id: dp.category_id,
        base_price: dp.base_price,
        fabric: dp.fabric,
        care_instructions: dp.care_instructions,
        is_active: false, // EXPLICITLY DEACTIVATED
        is_featured: false,
        stock_status: "in_stock",
      }, { onConflict: "slug" })
      .select("id")
      .single();

    if (prodErr || !prod) {
      console.error(`Failed to upsert draft product ${dp.name}:`, prodErr);
      continue;
    }

    const productId = prod.id;
    console.log(`✓ Seeded draft product shell: ${dp.name} (DEACTIVATED, id: ${productId})`);

    // 2. Insert placeholder variants (sizes S - XXL for each color)
    for (const colorObj of dp.colors) {
      for (const size of standardSizes) {
        const sku = `${dp.slug.replace("draft-mens-", "M-").toUpperCase()}-${colorObj.name.slice(0, 2).toUpperCase()}-${size}`;
        await admin.from("product_variants").upsert({
          product_id: productId,
          size,
          color: colorObj.name,
          color_hex: colorObj.hex,
          stock_quantity: 10,
          sku,
          is_active: false, // EXPLICITLY DEACTIVATED
        }, { onConflict: "product_id,size,color" });
      }
    }
  }

  console.log("\n================================================================");
  console.log("       ALL MEN'S CATEGORIES & DRAFT SHELLS SEEDED!             ");
  console.log("================================================================\n");
}

seedMensClothing().catch(console.error);
