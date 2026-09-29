import type { ProductListItem } from "../types";

/**
 * Curated 14 realistic clothing products for Velaash
 * Used as fallback data during SSR prerender or when database is offline.
 */
export const MOCK_CLOTHING_PRODUCTS: ProductListItem[] = [
  // 1. Kurtas & Sets
  {
    id: "p1111111-1111-4111-b111-111111111111",
    name: "Chanderi Embroidered Kurta Set",
    slug: "chanderi-embroidered-kurta-set",
    description:
      "Breathable Chanderi cotton blend with delicate embroidered neck detailing and coordinating palazzo.",
    category_id: "a1111111-1111-4111-a111-111111111111",
    category_name: "Kurtas & Sets",
    category_slug: "kurtas-sets",
    base_price: 4250,
    compare_at_price: 5200,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago -> NEW
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    total_stock: 18,
    rating: { average: 4.8, count: 16 },
    images: [
      {
        id: "img-kurta-1a",
        image_url:
          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
        alt_text: "Chanderi Embroidered Kurta Set Front View",
        is_primary: true,
        display_order: 1,
        color: "Ivory",
      },
      {
        id: "img-kurta-1b",
        image_url:
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        alt_text: "Chanderi Embroidered Kurta Set Fabric Detail",
        is_primary: false,
        display_order: 2,
        color: "Ivory",
      },
      {
        id: "img-kurta-1c",
        image_url:
          "https://images.unsplash.com/photo-1583391733975-47b198188151?auto=format&fit=crop&w=800&q=80",
        alt_text: "Chanderi Embroidered Kurta Set in Sage Green",
        is_primary: false,
        display_order: 3,
        color: "Sage Green",
      },
    ],
    colors: [
      {
        color: "Ivory",
        color_hex: "#FFFFF0",
        image_url:
          "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      },
      {
        color: "Sage Green",
        color_hex: "#8A9A86",
        image_url:
          "https://images.unsplash.com/photo-1583391733975-47b198188151?auto=format&fit=crop&w=800&q=80",
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    variants: [
      {
        id: "v1-1",
        size: "S",
        color: "Ivory",
        color_hex: "#FFFFF0",
        stock_quantity: 4,
        sku: "VEL-KRT-01-S-IVR",
        is_active: true,
      },
      {
        id: "v1-2",
        size: "M",
        color: "Ivory",
        color_hex: "#FFFFF0",
        stock_quantity: 5,
        sku: "VEL-KRT-01-M-IVR",
        is_active: true,
      },
      {
        id: "v1-3",
        size: "L",
        color: "Ivory",
        color_hex: "#FFFFF0",
        stock_quantity: 3,
        sku: "VEL-KRT-01-L-IVR",
        is_active: true,
      },
      {
        id: "v1-4",
        size: "M",
        color: "Sage Green",
        color_hex: "#8A9A86",
        stock_quantity: 6,
        sku: "VEL-KRT-01-M-SGE",
        is_active: true,
      },
    ],
  },
  {
    id: "p1111111-1111-4111-b111-222222222222",
    name: "A-Line Pintuck Cotton Kurta",
    slug: "a-line-pintuck-cotton-kurta",
    description:
      "Pure breathable mulmul with tailored horizontal pintucks and subtle wooden button placket.",
    category_id: "a1111111-1111-4111-a111-111111111111",
    category_name: "Kurtas & Sets",
    category_slug: "kurtas-sets",
    base_price: 2450,
    compare_at_price: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    is_featured: false,
    stock_status: "in_stock",
    total_stock: 14,
    rating: { average: 4.6, count: 9 },
    images: [
      {
        id: "img-kurta-2a",
        image_url:
          "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
        alt_text: "A-Line Pintuck Cotton Kurta",
        is_primary: true,
        display_order: 1,
        color: "Deep Indigo",
      },
      {
        id: "img-kurta-2b",
        image_url:
          "https://images.unsplash.com/photo-1617627143788-cb940e4fdf56?auto=format&fit=crop&w=800&q=80",
        alt_text: "A-Line Pintuck Cotton Kurta Back",
        is_primary: false,
        display_order: 2,
        color: "Deep Indigo",
      },
    ],
    colors: [
      {
        color: "Deep Indigo",
        color_hex: "#2E4057",
        image_url:
          "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
      },
      { color: "Blush Pink", color_hex: "#E8C5C8", image_url: null },
    ],
    sizes: ["XS", "S", "M", "L"],
    variants: [
      {
        id: "v2-1",
        size: "XS",
        color: "Deep Indigo",
        color_hex: "#2E4057",
        stock_quantity: 3,
        sku: "VEL-KRT-02-XS-IND",
        is_active: true,
      },
      {
        id: "v2-2",
        size: "S",
        color: "Deep Indigo",
        color_hex: "#2E4057",
        stock_quantity: 5,
        sku: "VEL-KRT-02-S-IND",
        is_active: true,
      },
      {
        id: "v2-3",
        size: "M",
        color: "Blush Pink",
        color_hex: "#E8C5C8",
        stock_quantity: 6,
        sku: "VEL-KRT-02-M-BLS",
        is_active: true,
      },
    ],
  },
  {
    id: "p1111111-1111-4111-b111-333333333333",
    name: "Hand-Block Printed Anarkali Ensemble",
    slug: "hand-block-printed-anarkali-ensemble",
    description:
      "Flowing 24-kali silhouette printed with natural azo-free pigments, paired with an organza floral dupatta.",
    category_id: "a1111111-1111-4111-a111-111111111111",
    category_name: "Kurtas & Sets",
    category_slug: "kurtas-sets",
    base_price: 5800,
    compare_at_price: 6900,
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    total_stock: 9,
    rating: { average: 5.0, count: 22 },
    images: [
      {
        id: "img-kurta-3a",
        image_url:
          "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80",
        alt_text: "Hand-Block Printed Anarkali",
        is_primary: true,
        display_order: 1,
        color: "Mustard Gold",
      },
      {
        id: "img-kurta-3b",
        image_url:
          "https://images.unsplash.com/photo-1609357605150-13f508a8a4f9?auto=format&fit=crop&w=800&q=80",
        alt_text: "Hand-Block Printed Anarkali Movement",
        is_primary: false,
        display_order: 2,
        color: "Mustard Gold",
      },
    ],
    colors: [
      {
        color: "Mustard Gold",
        color_hex: "#D4AF37",
        image_url:
          "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80",
      },
    ],
    sizes: ["S", "M", "L"],
    variants: [
      {
        id: "v3-1",
        size: "S",
        color: "Mustard Gold",
        color_hex: "#D4AF37",
        stock_quantity: 3,
        sku: "VEL-ANR-03-S-GLD",
        is_active: true,
      },
      {
        id: "v3-2",
        size: "M",
        color: "Mustard Gold",
        color_hex: "#D4AF37",
        stock_quantity: 4,
        sku: "VEL-ANR-03-M-GLD",
        is_active: true,
      },
      {
        id: "v3-3",
        size: "L",
        color: "Mustard Gold",
        color_hex: "#D4AF37",
        stock_quantity: 2,
        sku: "VEL-ANR-03-L-GLD",
        is_active: true,
      },
    ],
  },

  // 2. Dresses
  {
    id: "p2222222-2222-4222-b222-111111111111",
    name: "Tiered Organic Cotton Midi Dress",
    slug: "tiered-organic-cotton-midi-dress",
    description:
      "Airy three-tier gathered skirt with feminine flutter sleeves and functional side seam pockets.",
    category_id: "a2222222-2222-4222-a222-222222222222",
    category_name: "Dresses",
    category_slug: "dresses",
    base_price: 3600,
    compare_at_price: 4500,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // NEW
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    total_stock: 12,
    rating: { average: 4.9, count: 18 },
    images: [
      {
        id: "img-dress-1a",
        image_url:
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
        alt_text: "Tiered Organic Cotton Midi Dress",
        is_primary: true,
        display_order: 1,
        color: "Terracotta",
      },
      {
        id: "img-dress-1b",
        image_url:
          "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
        alt_text: "Tiered Organic Cotton Midi Dress Detail",
        is_primary: false,
        display_order: 2,
        color: "Terracotta",
      },
    ],
    colors: [
      {
        color: "Terracotta",
        color_hex: "#C86D51",
        image_url:
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
      },
      { color: "Olive Green", color_hex: "#6B7D56", image_url: null },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    variants: [
      {
        id: "v4-1",
        size: "XS",
        color: "Terracotta",
        color_hex: "#C86D51",
        stock_quantity: 2,
        sku: "VEL-DRS-01-XS-TER",
        is_active: true,
      },
      {
        id: "v4-2",
        size: "S",
        color: "Terracotta",
        color_hex: "#C86D51",
        stock_quantity: 4,
        sku: "VEL-DRS-01-S-TER",
        is_active: true,
      },
      {
        id: "v4-3",
        size: "M",
        color: "Terracotta",
        color_hex: "#C86D51",
        stock_quantity: 4,
        sku: "VEL-DRS-01-M-TER",
        is_active: true,
      },
      {
        id: "v4-4",
        size: "M",
        color: "Olive Green",
        color_hex: "#6B7D56",
        stock_quantity: 2,
        sku: "VEL-DRS-01-M-OLV",
        is_active: true,
      },
    ],
  },
  {
    id: "p2222222-2222-4222-b222-222222222222",
    name: "Relaxed Linen Belted Shirt Dress",
    slug: "relaxed-linen-belted-shirt-dress",
    description:
      "Pure European linen crafted with mother-of-pearl buttons and a coordinating self-fabric tie belt.",
    category_id: "a2222222-2222-4222-a222-222222222222",
    category_name: "Dresses",
    category_slug: "dresses",
    base_price: 4100,
    compare_at_price: null,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    is_featured: false,
    stock_status: "in_stock",
    total_stock: 15,
    rating: { average: 4.7, count: 11 },
    images: [
      {
        id: "img-dress-2a",
        image_url:
          "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
        alt_text: "Relaxed Linen Belted Shirt Dress",
        is_primary: true,
        display_order: 1,
        color: "Natural Beige",
      },
      {
        id: "img-dress-2b",
        image_url:
          "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
        alt_text: "Relaxed Linen Belted Shirt Dress Side View",
        is_primary: false,
        display_order: 2,
        color: "Natural Beige",
      },
    ],
    colors: [
      {
        color: "Natural Beige",
        color_hex: "#D8C7B5",
        image_url:
          "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
      },
      { color: "Sky Blue", color_hex: "#87CEEB", image_url: null },
    ],
    sizes: ["S", "M", "L"],
    variants: [
      {
        id: "v5-1",
        size: "S",
        color: "Natural Beige",
        color_hex: "#D8C7B5",
        stock_quantity: 5,
        sku: "VEL-DRS-02-S-BGE",
        is_active: true,
      },
      {
        id: "v5-2",
        size: "M",
        color: "Natural Beige",
        color_hex: "#D8C7B5",
        stock_quantity: 6,
        sku: "VEL-DRS-02-M-BGE",
        is_active: true,
      },
      {
        id: "v5-3",
        size: "L",
        color: "Sky Blue",
        color_hex: "#87CEEB",
        stock_quantity: 4,
        sku: "VEL-DRS-02-L-SKY",
        is_active: true,
      },
    ],
  },
  {
    id: "p2222222-2222-4222-b222-333333333333",
    name: "Flared Woven Maxi Dress",
    slug: "flared-woven-maxi-dress",
    description:
      "Flowing woven fabric falling effortlessly into a sweeping ankle-grazing silhouette for occasion wear.",
    category_id: "a2222222-2222-4222-a222-222222222222",
    category_name: "Dresses",
    category_slug: "dresses",
    base_price: 6950,
    compare_at_price: 8500,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    total_stock: 4, // LOW STOCK (<= 5)
    rating: { average: 5.0, count: 7 },
    images: [
      {
        id: "img-dress-3a",
        image_url:
          "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
        alt_text: "Flared Woven Maxi Dress",
        is_primary: true,
        display_order: 1,
        color: "Dusty Rose",
      },
      {
        id: "img-dress-3b",
        image_url:
          "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=800&q=80",
        alt_text: "Flared Woven Maxi Dress Back",
        is_primary: false,
        display_order: 2,
        color: "Dusty Rose",
      },
    ],
    colors: [
      {
        color: "Dusty Rose",
        color_hex: "#DCAE96",
        image_url:
          "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
      },
      { color: "Emerald Green", color_hex: "#2E6F40", image_url: null },
    ],
    sizes: ["S", "M"],
    variants: [
      {
        id: "v6-1",
        size: "S",
        color: "Dusty Rose",
        color_hex: "#DCAE96",
        stock_quantity: 2,
        sku: "VEL-DRS-03-S-RSE",
        is_active: true,
      },
      {
        id: "v6-2",
        size: "M",
        color: "Dusty Rose",
        color_hex: "#DCAE96",
        stock_quantity: 2,
        sku: "VEL-DRS-03-M-RSE",
        is_active: true,
      },
    ],
  },

  // 3. Co-ord Sets
  {
    id: "p3333333-3333-4333-b333-111111111111",
    name: "Pure Linen Tunic & Palazzo Set",
    slug: "pure-linen-tunic-palazzo-set",
    description:
      "Structured split-neck tunic matched with high-waisted wide leg palazzos in breathable pure slub linen.",
    category_id: "a3333333-3333-4333-a333-333333333333",
    category_name: "Co-ord Sets",
    category_slug: "coord-sets",
    base_price: 4800,
    compare_at_price: 5800,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // NEW
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    total_stock: 16,
    rating: { average: 4.7, count: 14 },
    images: [
      {
        id: "img-coord-1a",
        image_url:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
        alt_text: "Pure Linen Tunic & Palazzo Set",
        is_primary: true,
        display_order: 1,
        color: "Oatmeal",
      },
      {
        id: "img-coord-1b",
        image_url:
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80",
        alt_text: "Pure Linen Set Detail",
        is_primary: false,
        display_order: 2,
        color: "Oatmeal",
      },
    ],
    colors: [
      {
        color: "Oatmeal",
        color_hex: "#E5DEC9",
        image_url:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
      },
      { color: "Charcoal", color_hex: "#36454F", image_url: null },
    ],
    sizes: ["S", "M", "L", "XL"],
    variants: [
      {
        id: "v7-1",
        size: "S",
        color: "Oatmeal",
        color_hex: "#E5DEC9",
        stock_quantity: 4,
        sku: "VEL-CRD-01-S-OAT",
        is_active: true,
      },
      {
        id: "v7-2",
        size: "M",
        color: "Oatmeal",
        color_hex: "#E5DEC9",
        stock_quantity: 6,
        sku: "VEL-CRD-01-M-OAT",
        is_active: true,
      },
      {
        id: "v7-3",
        size: "L",
        color: "Oatmeal",
        color_hex: "#E5DEC9",
        stock_quantity: 3,
        sku: "VEL-CRD-01-L-OAT",
        is_active: true,
      },
      {
        id: "v7-4",
        size: "M",
        color: "Charcoal",
        color_hex: "#36454F",
        stock_quantity: 3,
        sku: "VEL-CRD-01-M-CHR",
        is_active: true,
      },
    ],
  },
  {
    id: "p3333333-3333-4333-b333-222222222222",
    name: "Woven Cotton Notch-Lapel Co-ord Set",
    slug: "woven-cotton-notch-lapel-coord-set",
    description:
      "Relaxed tailored blazer silhouette paired with straight pull-on trousers for understated elegance.",
    category_id: "a3333333-3333-4333-a333-333333333333",
    category_name: "Co-ord Sets",
    category_slug: "coord-sets",
    base_price: 3950,
    compare_at_price: null,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    is_featured: false,
    stock_status: "in_stock",
    total_stock: 10,
    rating: null, // No reviews yet -> will omit star rating
    images: [
      {
        id: "img-coord-2a",
        image_url:
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
        alt_text: "Woven Cotton Notch-Lapel Co-ord Set",
        is_primary: true,
        display_order: 1,
        color: "Sage",
      },
      {
        id: "img-coord-2b",
        image_url:
          "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
        alt_text: "Woven Cotton Co-ord Silhouette",
        is_primary: false,
        display_order: 2,
        color: "Sage",
      },
    ],
    colors: [
      {
        color: "Sage",
        color_hex: "#9CAF88",
        image_url:
          "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
      },
      { color: "Sand Dune", color_hex: "#C2B280", image_url: null },
    ],
    sizes: ["XS", "S", "M", "L"],
    variants: [
      {
        id: "v8-1",
        size: "S",
        color: "Sage",
        color_hex: "#9CAF88",
        stock_quantity: 4,
        sku: "VEL-CRD-02-S-SGE",
        is_active: true,
      },
      {
        id: "v8-2",
        size: "M",
        color: "Sage",
        color_hex: "#9CAF88",
        stock_quantity: 4,
        sku: "VEL-CRD-02-M-SGE",
        is_active: true,
      },
      {
        id: "v8-3",
        size: "L",
        color: "Sand Dune",
        color_hex: "#C2B280",
        stock_quantity: 2,
        sku: "VEL-CRD-02-L-SND",
        is_active: true,
      },
    ],
  },
  {
    id: "p3333333-3333-4333-b333-333333333333",
    name: "Peplum Embroidered Co-ord Ensemble",
    slug: "peplum-embroidered-coord-ensemble",
    description:
      "Flattering cinched peplum tunic featuring tone-on-tone embroidery, accompanied by ankle-tapered pants.",
    category_id: "a3333333-3333-4333-a333-333333333333",
    category_name: "Co-ord Sets",
    category_slug: "coord-sets",
    base_price: 5400,
    compare_at_price: 6500,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    total_stock: 3, // LOW STOCK (<= 5)
    rating: { average: 4.9, count: 21 },
    images: [
      {
        id: "img-coord-3a",
        image_url:
          "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
        alt_text: "Peplum Embroidered Co-ord Ensemble",
        is_primary: true,
        display_order: 1,
        color: "Rust Red",
      },
      {
        id: "img-coord-3b",
        image_url:
          "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80",
        alt_text: "Peplum Ensemble Back",
        is_primary: false,
        display_order: 2,
        color: "Rust Red",
      },
    ],
    colors: [
      {
        color: "Rust Red",
        color_hex: "#B7410E",
        image_url:
          "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
      },
      { color: "Navy Blue", color_hex: "#000080", image_url: null },
    ],
    sizes: ["S", "M"],
    variants: [
      {
        id: "v9-1",
        size: "S",
        color: "Rust Red",
        color_hex: "#B7410E",
        stock_quantity: 1,
        sku: "VEL-CRD-03-S-RST",
        is_active: true,
      },
      {
        id: "v9-2",
        size: "M",
        color: "Rust Red",
        color_hex: "#B7410E",
        stock_quantity: 2,
        sku: "VEL-CRD-03-M-RST",
        is_active: true,
      },
    ],
  },

  // 4. Tops & Shirts
  {
    id: "p4444444-4444-4444-b444-111111111111",
    name: "Breezy Mandarin Collar Cotton Shirt",
    slug: "breezy-mandarin-collar-cotton-shirt",
    description:
      "Casual yet elevated boyfriend fit shirt in lightweight organic poplin with curved hemline.",
    category_id: "a4444444-4444-4444-a444-444444444444",
    category_name: "Tops & Shirts",
    category_slug: "tops-shirts",
    base_price: 1950,
    compare_at_price: 2400,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // NEW
    is_active: true,
    is_featured: false,
    stock_status: "in_stock",
    total_stock: 22,
    rating: { average: 4.5, count: 8 },
    images: [
      {
        id: "img-top-1a",
        image_url:
          "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80",
        alt_text: "Breezy Mandarin Collar Cotton Shirt",
        is_primary: true,
        display_order: 1,
        color: "Crisp White",
      },
      {
        id: "img-top-1b",
        image_url:
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        alt_text: "Mandarin Collar Shirt Detail",
        is_primary: false,
        display_order: 2,
        color: "Crisp White",
      },
    ],
    colors: [
      {
        color: "Crisp White",
        color_hex: "#FFFFFF",
        image_url:
          "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80",
      },
      { color: "Pale Sky", color_hex: "#C6D8E3", image_url: null },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    variants: [
      {
        id: "v10-1",
        size: "XS",
        color: "Crisp White",
        color_hex: "#FFFFFF",
        stock_quantity: 4,
        sku: "VEL-TOP-01-XS-WHT",
        is_active: true,
      },
      {
        id: "v10-2",
        size: "S",
        color: "Crisp White",
        color_hex: "#FFFFFF",
        stock_quantity: 6,
        sku: "VEL-TOP-01-S-WHT",
        is_active: true,
      },
      {
        id: "v10-3",
        size: "M",
        color: "Crisp White",
        color_hex: "#FFFFFF",
        stock_quantity: 8,
        sku: "VEL-TOP-01-M-WHT",
        is_active: true,
      },
      {
        id: "v10-4",
        size: "L",
        color: "Pale Sky",
        color_hex: "#C6D8E3",
        stock_quantity: 4,
        sku: "VEL-TOP-01-L-SKY",
        is_active: true,
      },
    ],
  },
  {
    id: "p4444444-4444-4444-b444-222222222222",
    name: "Delicate Pintuck Handloom Tunic",
    slug: "delicate-pintuck-handloom-tunic",
    description:
      "Relaxed tunic silhouette with micro-pleats across the yoke and soft mother-of-pearl buttons.",
    category_id: "a4444444-4444-4444-a444-444444444444",
    category_name: "Tops & Shirts",
    category_slug: "tops-shirts",
    base_price: 2200,
    compare_at_price: null,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    is_featured: false,
    stock_status: "in_stock",
    total_stock: 11,
    rating: { average: 4.8, count: 5 },
    images: [
      {
        id: "img-top-2a",
        image_url:
          "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=800&q=80",
        alt_text: "Delicate Pintuck Handloom Tunic",
        is_primary: true,
        display_order: 1,
        color: "Pistachio",
      },
      {
        id: "img-top-2b",
        image_url:
          "https://images.unsplash.com/photo-1534126511673-b6899657816a?auto=format&fit=crop&w=800&q=80",
        alt_text: "Delicate Pintuck Tunic Fabric",
        is_primary: false,
        display_order: 2,
        color: "Pistachio",
      },
    ],
    colors: [
      {
        color: "Pistachio",
        color_hex: "#93C572",
        image_url:
          "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=800&q=80",
      },
      { color: "Soft Coral", color_hex: "#F88379", image_url: null },
    ],
    sizes: ["S", "M", "L"],
    variants: [
      {
        id: "v11-1",
        size: "S",
        color: "Pistachio",
        color_hex: "#93C572",
        stock_quantity: 4,
        sku: "VEL-TOP-02-S-PST",
        is_active: true,
      },
      {
        id: "v11-2",
        size: "M",
        color: "Pistachio",
        color_hex: "#93C572",
        stock_quantity: 4,
        sku: "VEL-TOP-02-M-PST",
        is_active: true,
      },
      {
        id: "v11-3",
        size: "L",
        color: "Soft Coral",
        color_hex: "#F88379",
        stock_quantity: 3,
        sku: "VEL-TOP-02-L-CRL",
        is_active: true,
      },
    ],
  },

  // 5. Bottoms
  {
    id: "p5555555-5555-4555-b555-111111111111",
    name: "High-Rise Wide Leg Cotton Trousers",
    slug: "high-rise-wide-leg-cotton-trousers",
    description:
      "Tailored front pleats, elasticated back comfort waistband, and clean wide silhouette in durable cotton twill.",
    category_id: "a5555555-5555-4555-a555-555555555555",
    category_name: "Bottoms",
    category_slug: "bottoms",
    base_price: 2600,
    compare_at_price: 3200,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // NEW
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    total_stock: 4, // LOW STOCK (<= 5)
    rating: { average: 4.7, count: 12 },
    images: [
      {
        id: "img-btm-1a",
        image_url:
          "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80",
        alt_text: "High-Rise Wide Leg Cotton Trousers",
        is_primary: true,
        display_order: 1,
        color: "Khaki Beige",
      },
      {
        id: "img-btm-1b",
        image_url:
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
        alt_text: "High-Rise Trousers Fit View",
        is_primary: false,
        display_order: 2,
        color: "Khaki Beige",
      },
    ],
    colors: [
      {
        color: "Khaki Beige",
        color_hex: "#C3B091",
        image_url:
          "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80",
      },
      { color: "Classic Black", color_hex: "#1A1A1A", image_url: null },
    ],
    sizes: ["S", "M", "L"],
    variants: [
      {
        id: "v12-1",
        size: "S",
        color: "Khaki Beige",
        color_hex: "#C3B091",
        stock_quantity: 2,
        sku: "VEL-BTM-01-S-KHK",
        is_active: true,
      },
      {
        id: "v12-2",
        size: "M",
        color: "Khaki Beige",
        color_hex: "#C3B091",
        stock_quantity: 1,
        sku: "VEL-BTM-01-M-KHK",
        is_active: true,
      },
      {
        id: "v12-3",
        size: "M",
        color: "Classic Black",
        color_hex: "#1A1A1A",
        stock_quantity: 1,
        sku: "VEL-BTM-01-M-BLK",
        is_active: true,
      },
    ],
  },
  {
    id: "p5555555-5555-4555-b555-222222222222",
    name: "Pleated Relaxed Linen Palazzos",
    slug: "pleated-relaxed-linen-palazzos",
    description:
      "Sweeping wide flared hemline crafted from natural washed linen with side pockets.",
    category_id: "a5555555-5555-4555-a555-555555555555",
    category_name: "Bottoms",
    category_slug: "bottoms",
    base_price: 2850,
    compare_at_price: null,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    is_featured: false,
    stock_status: "in_stock",
    total_stock: 12,
    rating: { average: 4.6, count: 6 },
    images: [
      {
        id: "img-btm-2a",
        image_url:
          "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=800&q=80",
        alt_text: "Pleated Relaxed Linen Palazzos",
        is_primary: true,
        display_order: 1,
        color: "Off-White",
      },
      {
        id: "img-btm-2b",
        image_url:
          "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80",
        alt_text: "Linen Palazzos Flare Detail",
        is_primary: false,
        display_order: 2,
        color: "Off-White",
      },
    ],
    colors: [
      {
        color: "Off-White",
        color_hex: "#FDFDFD",
        image_url:
          "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=800&q=80",
      },
      { color: "Mocha Brown", color_hex: "#7A5C43", image_url: null },
    ],
    sizes: ["S", "M", "L", "XL"],
    variants: [
      {
        id: "v13-1",
        size: "S",
        color: "Off-White",
        color_hex: "#FDFDFD",
        stock_quantity: 4,
        sku: "VEL-BTM-02-S-WHT",
        is_active: true,
      },
      {
        id: "v13-2",
        size: "M",
        color: "Off-White",
        color_hex: "#FDFDFD",
        stock_quantity: 5,
        sku: "VEL-BTM-02-M-WHT",
        is_active: true,
      },
      {
        id: "v13-3",
        size: "L",
        color: "Mocha Brown",
        color_hex: "#7A5C43",
        stock_quantity: 3,
        sku: "VEL-BTM-02-L-MCH",
        is_active: true,
      },
    ],
  },

  // 6. Loungewear
  {
    id: "p6666666-6666-4666-b666-111111111111",
    name: "Organic Cotton Notch-Collar Lounge Set",
    slug: "organic-cotton-notch-collar-lounge-set",
    description:
      "Soft and breathable 100% organic cotton set with piped notch lapels and drawstring matching pajama pants.",
    category_id: "a6666666-6666-4666-a666-666666666666",
    category_name: "Loungewear",
    category_slug: "loungewear",
    base_price: 3200,
    compare_at_price: 3999,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // NEW
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    total_stock: 14,
    rating: { average: 4.9, count: 28 },
    images: [
      {
        id: "img-lng-1a",
        image_url:
          "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
        alt_text: "Organic Cotton Notch-Collar Lounge Set",
        is_primary: true,
        display_order: 1,
        color: "Soft Lavender",
      },
      {
        id: "img-lng-1b",
        image_url:
          "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
        alt_text: "Lounge Set Fabric Softness Detail",
        is_primary: false,
        display_order: 2,
        color: "Soft Lavender",
      },
    ],
    colors: [
      {
        color: "Soft Lavender",
        color_hex: "#E6E6FA",
        image_url:
          "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
      },
      { color: "Slate Grey", color_hex: "#708090", image_url: null },
    ],
    sizes: ["XS", "S", "M", "L"],
    variants: [
      {
        id: "v14-1",
        size: "XS",
        color: "Soft Lavender",
        color_hex: "#E6E6FA",
        stock_quantity: 3,
        sku: "VEL-LNG-01-XS-LAV",
        is_active: true,
      },
      {
        id: "v14-2",
        size: "S",
        color: "Soft Lavender",
        color_hex: "#E6E6FA",
        stock_quantity: 5,
        sku: "VEL-LNG-01-S-LAV",
        is_active: true,
      },
      {
        id: "v14-3",
        size: "M",
        color: "Soft Lavender",
        color_hex: "#E6E6FA",
        stock_quantity: 4,
        sku: "VEL-LNG-01-M-LAV",
        is_active: true,
      },
      {
        id: "v14-4",
        size: "L",
        color: "Slate Grey",
        color_hex: "#708090",
        stock_quantity: 2,
        sku: "VEL-LNG-01-L-SLT",
        is_active: true,
      },
    ],
  },
];
