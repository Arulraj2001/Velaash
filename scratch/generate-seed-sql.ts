/* eslint-disable */
import * as fs from "fs";
import * as path from "path";

// Top categories
const TOP_CATEGORIES = [
  {
    id: "a1111111-1111-4111-a111-111111111111",
    name: "Kurtas & Suits",
    slug: "kurtas-sets",
    description: "Handcrafted everyday and festive kurtas, anarkalis, and suit ensembles",
    image_url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    display_order: 1,
    is_active: true,
  },
  {
    id: "a2222222-2222-4222-a222-222222222222",
    name: "Sarees & Drapes",
    slug: "sarees-drapes",
    description: "Pure Chanderi, Maheshwari, organza, and pre-draped contemporary sarees",
    image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    display_order: 2,
    is_active: true,
  },
  {
    id: "a3333333-3333-4333-a333-333333333333",
    name: "Co-ord Sets",
    slug: "coord-sets",
    description: "Effortlessly coordinated top and bottom ensembles tailored in breathable weaves",
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    display_order: 3,
    is_active: true,
  },
  {
    id: "a4444444-4444-4444-a444-444444444444",
    name: "Dresses & Gowns",
    slug: "dresses",
    description: "Refined midi, maxi, and angrakha dresses designed for relaxed elegance",
    image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
    display_order: 4,
    is_active: true,
  },
  {
    id: "a5555555-5555-4555-a555-555555555555",
    name: "Tops & Tunics",
    slug: "tops-shirts",
    description: "Crisp cotton shirts, breezy handloom tunics, and embroidered blouses",
    image_url: "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80",
    display_order: 5,
    is_active: true,
  },
  {
    id: "a6666666-6666-4666-a666-666666666666",
    name: "Bottoms & Palazzos",
    slug: "bottoms",
    description: "Tailored cotton trousers, sweeping flared palazzos, and draped dhoti pants",
    image_url: "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80",
    display_order: 6,
    is_active: true,
  },
];

// Subcategories
const SUBCATEGORIES = [
  // Kurtas & Suits
  { id: "b1111111-1111-4111-b111-111111111111", name: "Straight Kurtas", slug: "straight-kurtas", description: "Classic straight-cut silhouettes with fine neck embroidery", display_order: 1, is_active: true, parent_id: "a1111111-1111-4111-a111-111111111111" },
  { id: "b1111111-1111-4111-b111-222222222222", name: "Anarkali & Flared Sets", slug: "anarkali-flared-sets", description: "Graceful 24-kali flared anarkalis with coordinated dupattas", display_order: 2, is_active: true, parent_id: "a1111111-1111-4111-a111-111111111111" },
  { id: "b1111111-1111-4111-b111-333333333333", name: "Short Kurtis & Tunics", slug: "short-kurtis-tunics", description: "Contemporary everyday kurtis paired with pants or denims", display_order: 3, is_active: true, parent_id: "a1111111-1111-4111-a111-111111111111" },

  // Sarees & Drapes
  { id: "b2222222-2222-4222-b222-111111111111", name: "Chanderi & Silk Sarees", slug: "chanderi-silk-sarees", description: "Lightweight silk-cotton handlooms with heritage zari borders", display_order: 1, is_active: true, parent_id: "a2222222-2222-4222-a222-222222222222" },
  { id: "b2222222-2222-4222-b222-222222222222", name: "Organza & Floral Sarees", slug: "organza-sarees", description: "Airy pastel organza sarees with delicate floral motif prints", display_order: 2, is_active: true, parent_id: "a2222222-2222-4222-a222-222222222222" },
  { id: "b2222222-2222-4222-b222-333333333333", name: "Pre-Draped Sarees", slug: "pre-draped-sarees", description: "Modern ready-to-wear sarees with stitched pleats for hassle-free drape", display_order: 3, is_active: true, parent_id: "a2222222-2222-4222-a222-222222222222" },

  // Co-ord Sets
  { id: "b3333333-3333-4333-b333-111111111111", name: "Pure Linen Sets", slug: "linen-coord-sets", description: "Breathable luxury slub linen sets for warm summer days", display_order: 1, is_active: true, parent_id: "a3333333-3333-4333-a333-333333333333" },
  { id: "b3333333-3333-4333-b333-222222222222", name: "Printed Co-ords", slug: "printed-coord-sets", description: "Hand-block and botanical prints on soft mulmul and modal", display_order: 2, is_active: true, parent_id: "a3333333-3333-4333-a333-333333333333" },
  { id: "b3333333-3333-4333-b333-333333333333", name: "Festive & Embroidered Sets", slug: "festive-coord-sets", description: "Refined gota-patti and threadwork evening coordinates", display_order: 3, is_active: true, parent_id: "a3333333-3333-4333-a333-333333333333" },

  // Dresses & Gowns
  { id: "b4444444-4444-4444-b444-111111111111", name: "Midi Dresses", slug: "midi-dresses", description: "Flattering lengths tailored in breathable cottons and linens", display_order: 1, is_active: true, parent_id: "a4444444-4444-4444-a444-444444444444" },
  { id: "b4444444-4444-4444-b444-222222222222", name: "Maxi Dresses", slug: "maxi-dresses", description: "Sweeping bohemian hemlines crafted for relaxed soirees", display_order: 2, is_active: true, parent_id: "a4444444-4444-4444-a444-444444444444" },
  { id: "b4444444-4444-4444-b444-333333333333", name: "Angrakha & Tiered Dresses", slug: "tiered-dresses", description: "Traditional cross-body ties with modern tiered volume", display_order: 3, is_active: true, parent_id: "a4444444-4444-4444-a444-444444444444" },

  // Tops & Tunics
  { id: "b5555555-5555-4555-b555-111111111111", name: "Handloom Tunics", slug: "handloom-tunics", description: "Micro-pleated tunics in hand-spun organic cotton", display_order: 1, is_active: true, parent_id: "a5555555-5555-4555-a555-555555555555" },
  { id: "b5555555-5555-4555-b555-222222222222", name: "Mandarin Collar Shirts", slug: "mandarin-collar-shirts", description: "Elevated everyday boyfriend shirts in crisp poplin", display_order: 2, is_active: true, parent_id: "a5555555-5555-4555-a555-555555555555" },
  { id: "b5555555-5555-4555-b555-333333333333", name: "Embroidered Tops", slug: "embroidered-tops", description: "Delicate Chikankari and Kashmiri inspired neckline motifs", display_order: 3, is_active: true, parent_id: "a5555555-5555-4555-a555-555555555555" },

  // Bottoms & Palazzos
  { id: "b6666666-6666-4666-b666-111111111111", name: "Trousers & Pants", slug: "pants-trousers", description: "Structured front pleats with all-day elastic back comfort", display_order: 1, is_active: true, parent_id: "a6666666-6666-4666-a666-666666666666" },
  { id: "b6666666-6666-4666-b666-222222222222", name: "Flared Palazzos", slug: "palazzos-culottes", description: "Voluminous sweeping hemlines in breathable mulmul and linen", display_order: 2, is_active: true, parent_id: "a6666666-6666-4666-a666-666666666666" },
  { id: "b6666666-6666-4666-b666-333333333333", name: "Draped Dhoti Pants", slug: "dhoti-pants", description: "Contemporary draped silhouettes designed for ethnic tops", display_order: 3, is_active: true, parent_id: "a6666666-6666-4666-a666-666666666666" },
];

function escapeSql(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return val.toString();
  if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  return `'${val.toString().replace(/'/g, "''")}'`;
}

// Read data from execute-seed.ts
import { PRODUCTS, VARIANTS, IMAGES, REVIEWS, COUPONS, ORDERS, ORDER_ITEMS } from "./seed-data";

function generateSql(): string {
  let sql = `-- ============================================================================
-- Supabase Database Seed File for Velaash (VELAASH TRADER'S)
-- Curated for Indian Ethnic & Contemporary Women's Fashion
-- Run directly in Supabase SQL Editor. Safe to run multiple times (ON CONFLICT).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TOP-LEVEL CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, description, image_url, display_order, is_active, parent_id)
VALUES
${TOP_CATEGORIES.map(
  (c) =>
    `  (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.slug)}, ${escapeSql(c.description)}, ${escapeSql(c.image_url)}, ${c.display_order}, true, NULL)`
).join(",\n")}
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 2. SUB-CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (id, name, slug, description, display_order, is_active, parent_id)
VALUES
${SUBCATEGORIES.map(
  (c) =>
    `  (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.slug)}, ${escapeSql(c.description)}, ${c.display_order}, true, ${escapeSql(c.parent_id)})`
).join(",\n")}
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  parent_id = EXCLUDED.parent_id;

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS (AUTHENTIC INDIAN WEAR CATALOG)
-- ----------------------------------------------------------------------------
INSERT INTO public.products (
  id, name, slug, description, category_id, base_price, compare_at_price,
  fabric, care_instructions, craftsmanship, is_active, is_featured, stock_status,
  hsn_code, gst_rate, blouse_included, saree_length_meters, created_at
)
VALUES
${PRODUCTS.map(
  (p, i) =>
    `  (
    ${escapeSql(p.id)},
    ${escapeSql(p.name)},
    ${escapeSql(p.slug)},
    ${escapeSql(p.description)},
    ${escapeSql(p.category_id)},
    ${p.base_price.toFixed(2)},
    ${p.compare_at_price ? p.compare_at_price.toFixed(2) : "NULL"},
    ${escapeSql(p.fabric)},
    ${escapeSql(p.care_instructions)},
    ${escapeSql(p.craftsmanship)},
    ${p.is_active ? "true" : "false"},
    ${p.is_featured ? "true" : "false"},
    '${p.stock_status}',
    ${escapeSql(p.hsn_code)},
    ${p.gst_rate.toFixed(2)},
    ${p.blouse_included ? "true" : "false"},
    ${p.saree_length_meters ? p.saree_length_meters.toFixed(2) : "NULL"},
    now() - interval '${i + 1} days'
  )`
).join(",\n")}
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  base_price = EXCLUDED.base_price,
  compare_at_price = EXCLUDED.compare_at_price,
  fabric = EXCLUDED.fabric,
  care_instructions = EXCLUDED.care_instructions,
  craftsmanship = EXCLUDED.craftsmanship,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  stock_status = EXCLUDED.stock_status,
  hsn_code = EXCLUDED.hsn_code,
  gst_rate = EXCLUDED.gst_rate,
  blouse_included = EXCLUDED.blouse_included,
  saree_length_meters = EXCLUDED.saree_length_meters;

-- ----------------------------------------------------------------------------
-- 4. PRODUCT VARIANTS (SIZES XS to XXL & AUTHENTIC INDIAN COLOR PALETTE)
-- ----------------------------------------------------------------------------
INSERT INTO public.product_variants (id, product_id, size, color, color_hex, sku, stock_quantity, is_active)
VALUES
${VARIANTS.map(
  (v) =>
    `  (${escapeSql(v.id)}, ${escapeSql(v.product_id)}, ${escapeSql(v.size)}, ${escapeSql(v.color)}, ${escapeSql(v.color_hex)}, ${escapeSql(v.sku)}, ${v.stock_quantity}, ${v.is_active ? "true" : "false"})`
).join(",\n")}
ON CONFLICT (id) DO UPDATE SET
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  color_hex = EXCLUDED.color_hex,
  sku = EXCLUDED.sku,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 5. PRODUCT IMAGES (HIGH QUALITY AUTHENTIC WEAR PHOTOGRAPHY)
-- ----------------------------------------------------------------------------
INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
VALUES
${IMAGES.map(
  (img) =>
    `  (${escapeSql(img.id)}, ${escapeSql(img.product_id)}, ${escapeSql(img.image_url)}, ${escapeSql(img.alt_text)}, ${img.display_order}, ${img.is_primary ? "true" : "false"})`
).join(",\n")}
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  alt_text = EXCLUDED.alt_text,
  display_order = EXCLUDED.display_order,
  is_primary = EXCLUDED.is_primary;

-- ----------------------------------------------------------------------------
-- 6. REVIEWS (AUTHENTIC INDIAN SHOPPER REVIEWS)
-- ----------------------------------------------------------------------------
INSERT INTO public.reviews (id, product_id, customer_name, rating, title, comment, is_verified_purchase, is_approved, created_at)
VALUES
${REVIEWS.map(
  (r, i) =>
    `  (
    ${escapeSql(r.id)},
    ${escapeSql(r.product_id)},
    ${escapeSql(r.customer_name)},
    ${r.rating},
    ${escapeSql(r.title)},
    ${escapeSql(r.comment)},
    ${r.is_verified_purchase ? "true" : "false"},
    ${r.is_approved ? "true" : "false"},
    now() - interval '${i + 2} days'
  )`
).join(",\n")}
ON CONFLICT (id) DO UPDATE SET
  rating = EXCLUDED.rating,
  title = EXCLUDED.title,
  comment = EXCLUDED.comment,
  is_approved = EXCLUDED.is_approved;

-- ----------------------------------------------------------------------------
-- 7. COUPONS (VALID DISCOUNT CODES FOR INDIAN SHOPPERS)
-- ----------------------------------------------------------------------------
INSERT INTO public.coupons (id, code, discount_type, discount_value, min_order_value, max_discount_amount, usage_limit, usage_count, valid_from, valid_until, is_active)
VALUES
${COUPONS.map(
  (c) =>
    `  (${escapeSql(c.id)}, ${escapeSql(c.code)}, ${escapeSql(c.discount_type)}, ${c.discount_value.toFixed(2)}, ${c.min_order_value.toFixed(2)}, ${c.max_discount_amount ? c.max_discount_amount.toFixed(2) : "NULL"}, ${c.usage_limit}, ${c.usage_count}, ${escapeSql(c.valid_from)}, ${escapeSql(c.valid_until)}, ${c.is_active ? "true" : "false"})`
).join(",\n")}
ON CONFLICT (code) DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_order_value = EXCLUDED.min_order_value,
  max_discount_amount = EXCLUDED.max_discount_amount,
  usage_limit = EXCLUDED.usage_limit,
  usage_count = EXCLUDED.usage_count,
  valid_from = EXCLUDED.valid_from,
  valid_until = EXCLUDED.valid_until,
  is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 8. SAMPLE ORDERS (FOR ADMIN ORDER MANAGEMENT TESTING)
-- ----------------------------------------------------------------------------
INSERT INTO public.orders (
  id, order_number, customer_id, status, payment_method, payment_status,
  subtotal, shipping_charge, discount_amount, total_amount, shipping_address, billing_address,
  coupon_code, notes, created_at
)
VALUES
${ORDERS.map(
  (o, i) =>
    `  (
    ${escapeSql(o.id)},
    ${escapeSql(o.order_number)},
    NULL,
    '${o.status}',
    '${o.payment_method}',
    '${o.payment_status}',
    ${o.subtotal.toFixed(2)},
    ${o.shipping_charge.toFixed(2)},
    ${o.discount_amount.toFixed(2)},
    ${o.total_amount.toFixed(2)},
    ${escapeSql(o.shipping_address)},
    ${escapeSql(o.billing_address)},
    ${escapeSql(o.coupon_code)},
    ${escapeSql(o.notes)},
    now() - interval '${i + 1} days'
  )`
).join(",\n")}
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  payment_status = EXCLUDED.payment_status,
  total_amount = EXCLUDED.total_amount;

-- ----------------------------------------------------------------------------
-- 9. ORDER ITEMS
-- ----------------------------------------------------------------------------
INSERT INTO public.order_items (
  id, order_id, product_id, variant_id, product_name_snapshot,
  variant_details_snapshot, unit_price, quantity, subtotal
)
VALUES
${ORDER_ITEMS.map(
  (item) =>
    `  (
    ${escapeSql(item.id)},
    ${escapeSql(item.order_id)},
    ${escapeSql(item.product_id)},
    ${escapeSql(item.variant_id)},
    ${escapeSql(item.product_name_snapshot)},
    ${escapeSql(item.variant_details_snapshot)},
    ${item.unit_price.toFixed(2)},
    ${item.quantity},
    ${item.subtotal.toFixed(2)}
  )`
).join(",\n")}
ON CONFLICT (id) DO UPDATE SET
  unit_price = EXCLUDED.unit_price,
  quantity = EXCLUDED.quantity,
  subtotal = EXCLUDED.subtotal;

-- ----------------------------------------------------------------------------
-- 10. SITE SETTINGS (VERIFIED BUSINESS & BRAND PROFILE)
-- ----------------------------------------------------------------------------
INSERT INTO public.site_settings (key, value, description, is_public)
VALUES
  (
    'store_profile',
    '{
      "name": "Velaash",
      "legal_name": "VELAASH TRADER''S",
      "tagline": "Contemporary Elegance, Handcrafted in India",
      "email": "bestrchandra@gmail.com",
      "phone": "+91 8508643832",
      "whatsapp_number": "+91 8508643832",
      "whatsapp_url": "https://wa.me/918508643832",
      "logo_url": "/brand/logo.svg",
      "favicon_url": "/favicon.ico"
    }'::jsonb,
    'Core business and brand identity info (email: temporary bestrchandra@gmail.com until custom domain email is set up)',
    true
  ),
  (
    'social_links',
    '{
      "instagram": "https://instagram.com/velaash",
      "facebook": "https://facebook.com/velaash",
      "whatsapp": "https://wa.me/918508643832",
      "pinterest": "https://pinterest.com/velaash"
    }'::jsonb,
    'Official social media profile links',
    true
  ),
  (
    'shipping_policy',
    '{
      "free_shipping_threshold": 1999,
      "standard_shipping_fee": 99,
      "cod_available": true,
      "cod_fee": 50,
      "estimated_days_metro": 3,
      "estimated_days_rest_of_india": 6
    }'::jsonb,
    'Pan-India delivery fees and transit estimations',
    true
  ),
  (
    'returns_policy',
    '{
      "return_window_days": 7,
      "exchange_window_days": 10,
      "is_returnable": true,
      "conditions": "Items must be unused, unwashed, and returned in original packaging with tags intact."
    }'::jsonb,
    'Hassle-free 7-day doorstep return and exchange terms',
    true
  ),
  (
    'announcement_bar',
    '{
      "is_enabled": true,
      "text": "Festive Special: Enjoy Complimentary Shipping on Orders Above ₹1,999 | Use Code WELCOME500 for ₹500 Off",
      "link": "/shop"
    }'::jsonb,
    'Top notification announcement ribbon',
    true
  ),
  (
    'payment_settings',
    '{
      "razorpay_enabled": true,
      "cod_enabled": true,
      "supported_currencies": ["INR"]
    }'::jsonb,
    'Active checkout payment methods',
    true
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 11. HOMEPAGE BUILDER SECTIONS (DYNAMIC ORDER & CONTENT)
-- ----------------------------------------------------------------------------
INSERT INTO public.homepage_sections (id, section_type, title, display_order, is_active, content)
VALUES
  (
    '40000000-0000-4000-8000-000000000001',
    'hero_banner',
    'Hero Banner',
    1,
    true,
    '{
      "headline": "Handcrafted Indian Textiles for the Contemporary Soul",
      "subheadline": "Effortless silhouettes in breathable Chanderi, pure linen, and fine Mulmul. Designed for modern life, rooted in tradition.",
      "cta_text": "Explore Collection",
      "cta_link": "/shop",
      "image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=2000&q=85"
    }'::jsonb
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    'category_grid',
    'Curated Collections',
    2,
    true,
    '{
      "subtitle": "Discover our signature edits crafted for comfort and grace."
    }'::jsonb
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    'featured_products',
    'Featured Arrivals',
    3,
    true,
    '{
      "subtitle": "Handpicked favorites from our latest artisan weaving cycles.",
      "limit": 8
    }'::jsonb
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    'value_strip',
    'The Velaash Promise',
    4,
    true,
    '{
      "items": [
        {
          "title": "Authentic Handlooms",
          "description": "Woven with pure natural fibers by certified master weavers"
        },
        {
          "title": "All-India Delivery",
          "description": "Fast doorstep dispatch across 26,000+ Indian postal codes"
        },
        {
          "title": "Easy 7-Day Exchange",
          "description": "Doorstep size exchanges and hassle-free returns"
        },
        {
          "title": "Secure Payments",
          "description": "UPI, Credit/Debit cards, Net Banking, and Cash on Delivery"
        }
      ]
    }'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  content = EXCLUDED.content;
`;

  return sql;
}

const sqlOutput = generateSql();
const targetPath = path.resolve(process.cwd(), "supabase/seed.sql");
fs.writeFileSync(targetPath, sqlOutput, "utf8");
console.log(`Successfully generated ${targetPath} (${sqlOutput.length} bytes, ${sqlOutput.split("\n").length} lines).`);
