/* eslint-disable */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  realtime: {
    transport: class DummyWS {} as any,
  },
});

// Category IDs matching live DB
const CAT_KURTAS = "a1111111-1111-4111-a111-111111111111";
const CAT_SAREES = "a2222222-2222-4222-a222-222222222222";
const CAT_COORDS = "a3333333-3333-4333-a333-333333333333";
const CAT_DRESSES = "a4444444-4444-4444-a444-444444444444";
const CAT_TOPS = "a5555555-5555-4555-a555-555555555555";
const CAT_BOTTOMS = "a6666666-6666-4666-a666-666666666666";

// Subcategory IDs
const SUBCATS = [
  { id: "b1111111-1111-4111-b111-111111111111", name: "Straight Kurtas", slug: "straight-kurtas", description: "Classic straight-cut silhouettes with fine neck embroidery", display_order: 1, is_active: true, parent_id: CAT_KURTAS },
  { id: "b1111111-1111-4111-b111-222222222222", name: "Anarkali & Flared Sets", slug: "anarkali-flared-sets", description: "Graceful 24-kali flared anarkalis with coordinated dupattas", display_order: 2, is_active: true, parent_id: CAT_KURTAS },
  { id: "b1111111-1111-4111-b111-333333333333", name: "Short Kurtis & Tunics", slug: "short-kurtis-tunics", description: "Contemporary everyday kurtis paired with pants or denims", display_order: 3, is_active: true, parent_id: CAT_KURTAS },
  { id: "b2222222-2222-4222-b222-111111111111", name: "Chanderi & Silk Sarees", slug: "chanderi-silk-sarees", description: "Lightweight silk-cotton handlooms with heritage zari borders", display_order: 1, is_active: true, parent_id: CAT_SAREES },
  { id: "b2222222-2222-4222-b222-222222222222", name: "Organza & Floral Sarees", slug: "organza-sarees", description: "Airy pastel organza sarees with delicate floral motif prints", display_order: 2, is_active: true, parent_id: CAT_SAREES },
  { id: "b2222222-2222-4222-b222-333333333333", name: "Pre-Draped Sarees", slug: "pre-draped-sarees", description: "Modern ready-to-wear sarees with stitched pleats for hassle-free drape", display_order: 3, is_active: true, parent_id: CAT_SAREES },
  { id: "b3333333-3333-4333-b333-111111111111", name: "Pure Linen Sets", slug: "linen-coord-sets", description: "Breathable luxury slub linen sets for warm summer days", display_order: 1, is_active: true, parent_id: CAT_COORDS },
  { id: "b3333333-3333-4333-b333-222222222222", name: "Printed Co-ords", slug: "printed-coord-sets", description: "Hand-block and botanical prints on soft mulmul and modal", display_order: 2, is_active: true, parent_id: CAT_COORDS },
  { id: "b3333333-3333-4333-b333-333333333333", name: "Festive & Embroidered Sets", slug: "festive-coord-sets", description: "Refined gota-patti and threadwork evening coordinates", display_order: 3, is_active: true, parent_id: CAT_COORDS },
  { id: "b4444444-4444-4444-b444-111111111111", name: "Midi Dresses", slug: "midi-dresses", description: "Flattering lengths tailored in breathable cottons and linens", display_order: 1, is_active: true, parent_id: CAT_DRESSES },
  { id: "b4444444-4444-4444-b444-222222222222", name: "Maxi Dresses", slug: "maxi-dresses", description: "Sweeping bohemian hemlines crafted for relaxed soirees", display_order: 2, is_active: true, parent_id: CAT_DRESSES },
  { id: "b4444444-4444-4444-b444-333333333333", name: "Angrakha & Tiered Dresses", slug: "tiered-dresses", description: "Traditional cross-body ties with modern tiered volume", display_order: 3, is_active: true, parent_id: CAT_DRESSES },
  { id: "b5555555-5555-4555-b555-111111111111", name: "Handloom Tunics", slug: "handloom-tunics", description: "Micro-pleated tunics in hand-spun organic cotton", display_order: 1, is_active: true, parent_id: CAT_TOPS },
  { id: "b5555555-5555-4555-b555-222222222222", name: "Mandarin Collar Shirts", slug: "mandarin-collar-shirts", description: "Elevated everyday boyfriend shirts in crisp poplin", display_order: 2, is_active: true, parent_id: CAT_TOPS },
  { id: "b5555555-5555-4555-b555-333333333333", name: "Embroidered Tops", slug: "embroidered-tops", description: "Delicate Chikankari and Kashmiri inspired neckline motifs", display_order: 3, is_active: true, parent_id: CAT_TOPS },
  { id: "b6666666-6666-4666-b666-111111111111", name: "Trousers & Pants", slug: "pants-trousers", description: "Structured front pleats with all-day elastic back comfort", display_order: 1, is_active: true, parent_id: CAT_BOTTOMS },
  { id: "b6666666-6666-4666-b666-222222222222", name: "Flared Palazzos", slug: "palazzos-culottes", description: "Voluminous sweeping hemlines in breathable mulmul and linen", display_order: 2, is_active: true, parent_id: CAT_BOTTOMS },
  { id: "b6666666-6666-4666-b666-333333333333", name: "Draped Dhoti Pants", slug: "dhoti-pants", description: "Contemporary draped silhouettes designed for ethnic tops", display_order: 3, is_active: true, parent_id: CAT_BOTTOMS },
];

const TOP_CATEGORIES = [
  { id: CAT_KURTAS, name: "Kurtas & Suits", slug: "kurtas-sets", description: "Handcrafted everyday and festive kurtas, anarkalis, and suit ensembles", image_url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80", display_order: 1, is_active: true, parent_id: null },
  { id: CAT_SAREES, name: "Sarees & Drapes", slug: "sarees-drapes", description: "Pure Chanderi, Maheshwari, organza, and pre-draped contemporary sarees", image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80", display_order: 2, is_active: true, parent_id: null },
  { id: CAT_COORDS, name: "Co-ord Sets", slug: "coord-sets", description: "Effortlessly coordinated top and bottom ensembles tailored in breathable weaves", image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80", display_order: 3, is_active: true, parent_id: null },
  { id: CAT_DRESSES, name: "Dresses & Gowns", slug: "dresses", description: "Refined midi, maxi, and angrakha dresses designed for relaxed elegance", image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80", display_order: 4, is_active: true, parent_id: null },
  { id: CAT_TOPS, name: "Tops & Tunics", slug: "tops-shirts", description: "Crisp cotton shirts, breezy handloom tunics, and embroidered blouses", image_url: "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80", display_order: 5, is_active: true, parent_id: null },
  { id: CAT_BOTTOMS, name: "Bottoms & Palazzos", slug: "bottoms", description: "Tailored cotton trousers, sweeping flared palazzos, and draped dhoti pants", image_url: "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80", display_order: 6, is_active: true, parent_id: null },
];

const ALL_CATEGORIES = [...TOP_CATEGORIES, ...SUBCATS];

// 18 Products with valid hex UUIDs: c1111111-1111-4111-c111-000000000001 to 000000000018
const PRODUCTS = [
  // 1. Kurtas & Suits
  {
    id: "c1111111-1111-4111-c111-000000000001",
    name: "Chanderi Embroidered Kurta Set",
    slug: "chanderi-embroidered-kurta-set",
    description: "Crafted in luxurious Chanderi silk blend with a pure cotton inner lining. Detailed with delicate zardozi and thread embroidery around the jewel neckline, paired with straight-cut palazzos and a sheer organza dupatta.",
    category_id: CAT_KURTAS,
    base_price: 4250.00,
    compare_at_price: 5200.00,
    fabric: "Chanderi Silk Blend with 100% Mulmul Cotton Lining",
    care_instructions: "Dry clean only for the first two washes. Subsequently gentle hand wash in cold water.",
    craftsmanship: "Hand-guided zardozi and threadwork along neckline and cuffs",
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },
  {
    id: "c1111111-1111-4111-c111-000000000002",
    name: "A-Line Pintuck Mulmul Kurta",
    slug: "a-line-pintuck-mulmul-kurta",
    description: "Pure breathable 60x60 mulmul cotton featuring tailored horizontal pintucks across the front yoke. Styled with mother-of-pearl buttons and deep side pockets for effortless everyday elegance.",
    category_id: CAT_KURTAS,
    base_price: 2450.00,
    compare_at_price: null,
    fabric: "100% Breathable Mulmul Cotton",
    care_instructions: "Machine wash cold on gentle cycle. Line dry in shade.",
    craftsmanship: "Precision hand-stitched pintucks with mother-of-pearl button placket",
    is_active: true,
    is_featured: false,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },
  {
    id: "c1111111-1111-4111-c111-000000000003",
    name: "Hand-Block Printed Anarkali Ensemble",
    slug: "hand-block-printed-anarkali-ensemble",
    description: "Voluminous 24-kali flared anarkali handcrafted by Rajasthani artisans using natural vegetable dyes. Paired with a churidar and a coordinated Kota Doria dupatta with subtle gota patti border work.",
    category_id: CAT_KURTAS,
    base_price: 5800.00,
    compare_at_price: 6900.00,
    fabric: "Pure Cambric Cotton & Kota Doria Dupatta",
    care_instructions: "Dry clean recommended to preserve natural vegetable block prints.",
    craftsmanship: "Traditional Sanganeri hand-block printing with gota patti detailing",
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },
  {
    id: "c1111111-1111-4111-c111-000000000004",
    name: "Lucknowi Chikankari Straight Kurta",
    slug: "lucknowi-chikankari-straight-kurta",
    description: "Soft modal cotton kurta adorned with authentic hand-embroidered Bakhiya and Phanda stitches. Subtle and dignified, ideal for intimate gatherings and formal occasions.",
    category_id: CAT_KURTAS,
    base_price: 3600.00,
    compare_at_price: 4200.00,
    fabric: "Fine Modal Cotton",
    care_instructions: "Gentle hand wash with mild liquid detergent. Do not wring.",
    craftsmanship: "Authentic Lucknowi hand Chikankari embroidery",
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },

  // 2. Sarees & Drapes
  {
    id: "c1111111-1111-4111-c111-000000000005",
    name: "Pure Maheshwari Zari Border Saree",
    slug: "pure-maheshwari-zari-border-saree",
    description: "Handwoven Maheshwari silk-cotton saree featuring the traditional Bugdi border and lustrous gold zari pallu stripes. Lightweight, regal, and comfortable for all-day celebrations.",
    category_id: CAT_SAREES,
    base_price: 6800.00,
    compare_at_price: 8200.00,
    fabric: "Handwoven Maheshwari Silk Cotton",
    care_instructions: "Dry clean only. Store wrapped in soft muslin cloth.",
    craftsmanship: "Handloom woven on traditional pit looms with pure gold zari",
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    hsn_code: "5208",
    gst_rate: 5.00,
    blouse_included: true,
    saree_length_meters: 5.50,
  },
  {
    id: "c1111111-1111-4111-c111-000000000006",
    name: "Chanderi Floral Organza Saree",
    slug: "chanderi-floral-organza-saree",
    description: "Delicate pastel organza saree featuring hand-painted botanical rose motifs and scalloped hand-embroidered borders. Includes an unstitched raw silk blouse piece.",
    category_id: CAT_SAREES,
    base_price: 7450.00,
    compare_at_price: 8900.00,
    fabric: "Pure Tissue Organza Silk",
    care_instructions: "Professional dry clean only. Steam iron only on low heat.",
    craftsmanship: "Hand-painted floral art with scalloped zardozi cutwork border",
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    hsn_code: "5208",
    gst_rate: 5.00,
    blouse_included: true,
    saree_length_meters: 5.50,
  },
  {
    id: "c1111111-1111-4111-c111-000000000007",
    name: "Ready-to-Wear Georgette Pre-Draped Saree",
    slug: "ready-to-wear-georgette-pre-draped-saree",
    description: "Modern pre-stitched pleated saree crafted in cascading micro-georgette. Includes an elasticated waistband and tailored pallu brooch attachment for effortless 1-minute draping.",
    category_id: CAT_SAREES,
    base_price: 4950.00,
    compare_at_price: 5900.00,
    fabric: "Fluid Micro-Georgette with Satin Lining",
    care_instructions: "Dry clean or gentle hand wash in cold water.",
    craftsmanship: "Precision pre-stitched pleating with concealed side zipper",
    is_active: true,
    is_featured: false,
    stock_status: "in_stock",
    hsn_code: "5208",
    gst_rate: 5.00,
    blouse_included: true,
    saree_length_meters: 5.50,
  },

  // 3. Co-ord Sets
  {
    id: "c1111111-1111-4111-c111-000000000008",
    name: "Pure Linen Tunic & Palazzo Set",
    slug: "pure-linen-tunic-and-palazzo-set",
    description: "Relaxed resort-style two-piece set in pure European washed linen. Boat neck tunic with high-side slits paired with wide-leg elasticated palazzos with deep functional pockets.",
    category_id: CAT_COORDS,
    base_price: 4800.00,
    compare_at_price: 5600.00,
    fabric: "100% European Washed Linen",
    care_instructions: "Machine wash cold with like colors. Warm iron while slightly damp.",
    craftsmanship: "Tailored French seams with mother-of-pearl back closure",
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },
  {
    id: "c1111111-1111-4111-c111-000000000009",
    name: "Handloom Woven Cotton Notch Lapel Set",
    slug: "handloom-woven-cotton-notch-lapel-set",
    description: "Structured short blazer jacket paired with straight ankle-length trousers in breathable textured handloom cotton weave.",
    category_id: CAT_COORDS,
    base_price: 3950.00,
    compare_at_price: 4800.00,
    fabric: "Hand-spun Organic Textured Cotton",
    care_instructions: "Hand wash separately in cold water using mild detergent.",
    craftsmanship: "Hand-loomed textured weave with tailored notch collar",
    is_active: true,
    is_featured: false,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },
  {
    id: "c1111111-1111-4111-c111-000000000010",
    name: "Peplum Embroidered Festive Co-ord",
    slug: "peplum-embroidered-festive-coord",
    description: "Flared peplum top embellished with mirrorwork along the neckline and hem, paired with flared sharara trousers in lustrous viscose modal.",
    category_id: CAT_COORDS,
    base_price: 5200.00,
    compare_at_price: 6400.00,
    fabric: "Viscose Modal Satin",
    care_instructions: "Dry clean only to protect hand embroidery.",
    craftsmanship: "Artisan mirrorwork and thread embroidery detailing",
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },

  // 4. Dresses & Gowns
  {
    id: "c1111111-1111-4111-c111-000000000011",
    name: "Tiered Organic Cotton Midi Dress",
    slug: "tiered-organic-cotton-midi-dress",
    description: "A breezy three-tiered midi dress cut from soft slub cotton. Features flutter cap sleeves, a square neck, and a smocked back panel for an adaptive silhouette.",
    category_id: CAT_DRESSES,
    base_price: 3200.00,
    compare_at_price: 3900.00,
    fabric: "100% Slub Cotton",
    care_instructions: "Machine wash cold gentle. Line dry.",
    craftsmanship: "Hand-gathered tiered ruffles with smocked elastic back",
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },
  {
    id: "c1111111-1111-4111-c111-000000000012",
    name: "Relaxed Linen Belted Shirt Dress",
    slug: "relaxed-linen-belted-shirt-dress",
    description: "Collar shirt dress with roll-up cuffed sleeves, tonal fabric belt, and side slits crafted in premium softened linen.",
    category_id: CAT_DRESSES,
    base_price: 4400.00,
    compare_at_price: null,
    fabric: "Pure Washed Linen",
    care_instructions: "Gentle machine wash cold. Iron damp.",
    craftsmanship: "Point collar with tonal self-fabric belt and horn buttons",
    is_active: true,
    is_featured: false,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },
  {
    id: "c1111111-1111-4111-c111-000000000013",
    name: "Flared Angrakha Maxi Dress",
    slug: "flared-angrakha-maxi-dress",
    description: "Floor-length maxi dress inspired by traditional Rajasthani angrakha cross-body silhouettes, with tassel tie-ups and gold foil print motifs.",
    category_id: CAT_DRESSES,
    base_price: 4600.00,
    compare_at_price: 5400.00,
    fabric: "Fine Rayon Slub with Cotton Voile Lining",
    care_instructions: "Gentle hand wash inside out. Do not rub foil print directly.",
    craftsmanship: "Handmade fabric latkans (tassels) and traditional angrakha overlap",
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },

  // 5. Tops & Tunics
  {
    id: "c1111111-1111-4111-c111-000000000014",
    name: "Breezy Mandarin Collar Cotton Shirt",
    slug: "breezy-mandarin-collar-cotton-shirt",
    description: "Elevated casual boyfriend-fit shirt in lightweight organic poplin with curved hemline and subtle drop shoulders.",
    category_id: CAT_TOPS,
    base_price: 1950.00,
    compare_at_price: 2400.00,
    fabric: "100% Organic Cotton Poplin",
    care_instructions: "Machine wash warm. Tumble dry low or line dry.",
    craftsmanship: "Clean-finished felled seams and mandarin collar",
    is_active: true,
    is_featured: false,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },
  {
    id: "c1111111-1111-4111-c111-000000000015",
    name: "Delicate Pintuck Handloom Tunic",
    slug: "delicate-pintuck-handloom-tunic",
    description: "Relaxed tunic silhouette with micro-pleats across the yoke, subtle side slits, and soft mother-of-pearl buttons. Ideal paired with trousers or palazzos.",
    category_id: CAT_TOPS,
    base_price: 2200.00,
    compare_at_price: null,
    fabric: "Fine Handloom Cotton",
    care_instructions: "Gentle cycle in cold water. Iron on medium.",
    craftsmanship: "Hand-stitched yoke micro-pleating",
    is_active: true,
    is_featured: false,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },

  // 6. Bottoms & Palazzos
  {
    id: "c1111111-1111-4111-c111-000000000016",
    name: "High-Rise Wide Leg Cotton Trousers",
    slug: "high-rise-wide-leg-cotton-trousers",
    description: "Tailored front pleats, elasticated back comfort waistband, and clean wide silhouette in durable cotton twill with deep front slash pockets.",
    category_id: CAT_BOTTOMS,
    base_price: 2600.00,
    compare_at_price: 3200.00,
    fabric: "Structured Cotton Twill (98% Cotton, 2% Elastane)",
    care_instructions: "Machine wash cold. Wash dark colors separately.",
    craftsmanship: "Tailored trouser waistband with hidden elastic comfort insert",
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },
  {
    id: "c1111111-1111-4111-c111-000000000017",
    name: "Pleated Relaxed Linen Palazzos",
    slug: "pleated-relaxed-linen-palazzos",
    description: "Sweeping wide flared hemline crafted from natural washed linen. Features an adjustable drawstring waistband and deep side pockets.",
    category_id: CAT_BOTTOMS,
    base_price: 2850.00,
    compare_at_price: null,
    fabric: "100% Natural Washed European Linen",
    care_instructions: "Machine wash gentle. Line dry in shade.",
    craftsmanship: "Double-turned wide flare hem with French seams",
    is_active: true,
    is_featured: false,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },
  {
    id: "c1111111-1111-4111-c111-000000000018",
    name: "Draped Modal Dhoti Pants",
    slug: "draped-modal-dhoti-pants",
    description: "Modern draped ethnic bottom with pre-formed cowl pleats along the thighs. Silky soft modal fabric that falls effortlessly, pairing beautifully with short kurtis.",
    category_id: CAT_BOTTOMS,
    base_price: 2150.00,
    compare_at_price: 2700.00,
    fabric: "Heavy Modal Satin Blend",
    care_instructions: "Gentle hand wash or delicate machine cycle.",
    craftsmanship: "Precision engineered cowl draping with elastic waistband",
    is_active: true,
    is_featured: true,
    stock_status: "in_stock",
    hsn_code: "6204",
    gst_rate: 5.00,
    blouse_included: false,
    saree_length_meters: null,
  },
];

// Product Variants with valid hex UUIDs: d1111111-1111-4111-d111-...
const VARIANTS = [
  // Product 1: Chanderi Kurta Set
  { id: "d1111111-1111-4111-d111-000000000001", product_id: "c1111111-1111-4111-c111-000000000001", size: "XS", color: "Kora Ivory", color_hex: "#FDFBF7", sku: "VEL-KRT-01-XS-IVR", stock_quantity: 3, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000002", product_id: "c1111111-1111-4111-c111-000000000001", size: "S", color: "Kora Ivory", color_hex: "#FDFBF7", sku: "VEL-KRT-01-S-IVR", stock_quantity: 5, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000003", product_id: "c1111111-1111-4111-c111-000000000001", size: "M", color: "Kora Ivory", color_hex: "#FDFBF7", sku: "VEL-KRT-01-M-IVR", stock_quantity: 6, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000004", product_id: "c1111111-1111-4111-c111-000000000001", size: "L", color: "Kora Ivory", color_hex: "#FDFBF7", sku: "VEL-KRT-01-L-IVR", stock_quantity: 4, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000005", product_id: "c1111111-1111-4111-c111-000000000001", size: "XL", color: "Kora Ivory", color_hex: "#FDFBF7", sku: "VEL-KRT-01-XL-IVR", stock_quantity: 3, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000006", product_id: "c1111111-1111-4111-c111-000000000001", size: "M", color: "Sage Green", color_hex: "#8A9A86", sku: "VEL-KRT-01-M-SGE", stock_quantity: 5, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000007", product_id: "c1111111-1111-4111-c111-000000000001", size: "L", color: "Sage Green", color_hex: "#8A9A86", sku: "VEL-KRT-01-L-SGE", stock_quantity: 4, is_active: true },

  // Product 2: Pintuck Mulmul Kurta
  { id: "d1111111-1111-4111-d111-000000000010", product_id: "c1111111-1111-4111-c111-000000000002", size: "S", color: "Haldi Yellow", color_hex: "#E8A735", sku: "VEL-KRT-02-S-YEL", stock_quantity: 4, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000011", product_id: "c1111111-1111-4111-c111-000000000002", size: "M", color: "Haldi Yellow", color_hex: "#E8A735", sku: "VEL-KRT-02-M-YEL", stock_quantity: 6, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000012", product_id: "c1111111-1111-4111-c111-000000000002", size: "L", color: "Haldi Yellow", color_hex: "#E8A735", sku: "VEL-KRT-02-L-YEL", stock_quantity: 3, is_active: true },

  // Product 3: Anarkali Ensemble
  { id: "d1111111-1111-4111-d111-000000000020", product_id: "c1111111-1111-4111-c111-000000000003", size: "S", color: "Gulabi Pink", color_hex: "#D86D7F", sku: "VEL-KRT-03-S-PNK", stock_quantity: 3, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000021", product_id: "c1111111-1111-4111-c111-000000000003", size: "M", color: "Gulabi Pink", color_hex: "#D86D7F", sku: "VEL-KRT-03-M-PNK", stock_quantity: 5, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000022", product_id: "c1111111-1111-4111-c111-000000000003", size: "L", color: "Gulabi Pink", color_hex: "#D86D7F", sku: "VEL-KRT-03-L-PNK", stock_quantity: 4, is_active: true },

  // Product 4: Lucknowi Chikankari Kurta
  { id: "d1111111-1111-4111-d111-000000000030", product_id: "c1111111-1111-4111-c111-000000000004", size: "S", color: "Powder Blue", color_hex: "#B0E0E6", sku: "VEL-KRT-04-S-BLU", stock_quantity: 4, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000031", product_id: "c1111111-1111-4111-c111-000000000004", size: "M", color: "Powder Blue", color_hex: "#B0E0E6", sku: "VEL-KRT-04-M-BLU", stock_quantity: 6, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000032", product_id: "c1111111-1111-4111-c111-000000000004", size: "L", color: "Powder Blue", color_hex: "#B0E0E6", sku: "VEL-KRT-04-L-BLU", stock_quantity: 4, is_active: true },

  // Product 5: Maheshwari Saree (Free Size)
  { id: "d1111111-1111-4111-d111-000000000040", product_id: "c1111111-1111-4111-c111-000000000005", size: "Free Size", color: "Royal Indigo", color_hex: "#273C75", sku: "VEL-SAR-01-FS-IND", stock_quantity: 5, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000041", product_id: "c1111111-1111-4111-c111-000000000005", size: "Free Size", color: "Maroon Wine", color_hex: "#6E2639", sku: "VEL-SAR-01-FS-MAR", stock_quantity: 4, is_active: true },

  // Product 6: Organza Floral Saree (Free Size)
  { id: "d1111111-1111-4111-d111-000000000050", product_id: "c1111111-1111-4111-c111-000000000006", size: "Free Size", color: "Blush Peach", color_hex: "#FFDAB9", sku: "VEL-SAR-02-FS-PCH", stock_quantity: 4, is_active: true },

  // Product 7: Pre-Draped Saree
  { id: "d1111111-1111-4111-d111-000000000060", product_id: "c1111111-1111-4111-c111-000000000007", size: "S", color: "Emerald Green", color_hex: "#1B4D3E", sku: "VEL-SAR-03-S-EMR", stock_quantity: 3, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000061", product_id: "c1111111-1111-4111-c111-000000000007", size: "M", color: "Emerald Green", color_hex: "#1B4D3E", sku: "VEL-SAR-03-M-EMR", stock_quantity: 4, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000062", product_id: "c1111111-1111-4111-c111-000000000007", size: "L", color: "Emerald Green", color_hex: "#1B4D3E", sku: "VEL-SAR-03-L-EMR", stock_quantity: 3, is_active: true },

  // Product 8: Pure Linen Co-ord
  { id: "d1111111-1111-4111-d111-000000000070", product_id: "c1111111-1111-4111-c111-000000000008", size: "S", color: "Natural Oatmeal", color_hex: "#E5DEC9", sku: "VEL-CRD-01-S-OAT", stock_quantity: 4, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000071", product_id: "c1111111-1111-4111-c111-000000000008", size: "M", color: "Natural Oatmeal", color_hex: "#E5DEC9", sku: "VEL-CRD-01-M-OAT", stock_quantity: 6, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000072", product_id: "c1111111-1111-4111-c111-000000000008", size: "L", color: "Natural Oatmeal", color_hex: "#E5DEC9", sku: "VEL-CRD-01-L-OAT", stock_quantity: 5, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000073", product_id: "c1111111-1111-4111-c111-000000000008", size: "M", color: "Charcoal Slate", color_hex: "#36454F", sku: "VEL-CRD-01-M-CHR", stock_quantity: 3, is_active: true },

  // Product 9: Woven Cotton Notch Co-ord
  { id: "d1111111-1111-4111-d111-000000000080", product_id: "c1111111-1111-4111-c111-000000000009", size: "S", color: "Terracotta Rust", color_hex: "#C86D51", sku: "VEL-CRD-02-S-TER", stock_quantity: 3, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000081", product_id: "c1111111-1111-4111-c111-000000000009", size: "M", color: "Terracotta Rust", color_hex: "#C86D51", sku: "VEL-CRD-02-M-TER", stock_quantity: 5, is_active: true },

  // Product 10: Peplum Co-ord
  { id: "d1111111-1111-4111-d111-000000000090", product_id: "c1111111-1111-4111-c111-000000000010", size: "S", color: "Dusty Rose", color_hex: "#DCAE96", sku: "VEL-CRD-03-S-RSE", stock_quantity: 3, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000091", product_id: "c1111111-1111-4111-c111-000000000010", size: "M", color: "Dusty Rose", color_hex: "#DCAE96", sku: "VEL-CRD-03-M-RSE", stock_quantity: 4, is_active: true },

  // Product 11: Tiered Midi Dress
  { id: "d1111111-1111-4111-d111-000000000100", product_id: "c1111111-1111-4111-c111-000000000011", size: "S", color: "Terracotta Rust", color_hex: "#C86D51", sku: "VEL-DRS-01-S-TER", stock_quantity: 4, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000101", product_id: "c1111111-1111-4111-c111-000000000011", size: "M", color: "Terracotta Rust", color_hex: "#C86D51", sku: "VEL-DRS-01-M-TER", stock_quantity: 5, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000102", product_id: "c1111111-1111-4111-c111-000000000011", size: "L", color: "Terracotta Rust", color_hex: "#C86D51", sku: "VEL-DRS-01-L-TER", stock_quantity: 3, is_active: true },

  // Product 12: Belted Shirt Dress
  { id: "d1111111-1111-4111-d111-000000000110", product_id: "c1111111-1111-4111-c111-000000000012", size: "M", color: "Olive Green", color_hex: "#6B7D56", sku: "VEL-DRS-02-M-OLV", stock_quantity: 4, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000111", product_id: "c1111111-1111-4111-c111-000000000012", size: "L", color: "Olive Green", color_hex: "#6B7D56", sku: "VEL-DRS-02-L-OLV", stock_quantity: 3, is_active: true },

  // Product 13: Angrakha Maxi Dress
  { id: "d1111111-1111-4111-d111-000000000120", product_id: "c1111111-1111-4111-c111-000000000013", size: "S", color: "Peacock Teal", color_hex: "#005F73", sku: "VEL-DRS-03-S-TEA", stock_quantity: 3, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000121", product_id: "c1111111-1111-4111-c111-000000000013", size: "M", color: "Peacock Teal", color_hex: "#005F73", sku: "VEL-DRS-03-M-TEA", stock_quantity: 5, is_active: true },

  // Product 14: Mandarin Shirt
  { id: "d1111111-1111-4111-d111-000000000130", product_id: "c1111111-1111-4111-c111-000000000014", size: "S", color: "Kora Ivory", color_hex: "#FDFBF7", sku: "VEL-TOP-01-S-IVR", stock_quantity: 5, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000131", product_id: "c1111111-1111-4111-c111-000000000014", size: "M", color: "Kora Ivory", color_hex: "#FDFBF7", sku: "VEL-TOP-01-M-IVR", stock_quantity: 6, is_active: true },

  // Product 15: Handloom Tunic
  { id: "d1111111-1111-4111-d111-000000000140", product_id: "c1111111-1111-4111-c111-000000000015", size: "M", color: "Sage Green", color_hex: "#8A9A86", sku: "VEL-TOP-02-M-SGE", stock_quantity: 4, is_active: true },

  // Product 16: High Rise Trousers
  { id: "d1111111-1111-4111-d111-000000000150", product_id: "c1111111-1111-4111-c111-000000000016", size: "S", color: "Khaki Beige", color_hex: "#C3B091", sku: "VEL-BTM-01-S-KHK", stock_quantity: 4, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000151", product_id: "c1111111-1111-4111-c111-000000000016", size: "M", color: "Khaki Beige", color_hex: "#C3B091", sku: "VEL-BTM-01-M-KHK", stock_quantity: 6, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000152", product_id: "c1111111-1111-4111-c111-000000000016", size: "L", color: "Khaki Beige", color_hex: "#C3B091", sku: "VEL-BTM-01-L-KHK", stock_quantity: 4, is_active: true },

  // Product 17: Linen Palazzos
  { id: "d1111111-1111-4111-d111-000000000160", product_id: "c1111111-1111-4111-c111-000000000017", size: "S", color: "Natural Oatmeal", color_hex: "#E5DEC9", sku: "VEL-BTM-02-S-OAT", stock_quantity: 4, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000161", product_id: "c1111111-1111-4111-c111-000000000017", size: "M", color: "Natural Oatmeal", color_hex: "#E5DEC9", sku: "VEL-BTM-02-M-OAT", stock_quantity: 5, is_active: true },

  // Product 18: Dhoti Pants
  { id: "d1111111-1111-4111-d111-000000000170", product_id: "c1111111-1111-4111-c111-000000000018", size: "Free Size", color: "Classic Black", color_hex: "#1A1A1A", sku: "VEL-BTM-03-FS-BLK", stock_quantity: 5, is_active: true },
  { id: "d1111111-1111-4111-d111-000000000171", product_id: "c1111111-1111-4111-c111-000000000018", size: "Free Size", color: "Maroon Wine", color_hex: "#6E2639", sku: "VEL-BTM-03-FS-MAR", stock_quantity: 4, is_active: true },
];

// Product Images with valid hex UUIDs: e1111111-1111-4111-e111-...
const IMAGES = [
  // 1. Chanderi Kurta Set
  { id: "e1111111-1111-4111-e111-000000000001", product_id: "c1111111-1111-4111-c111-000000000001", image_url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80", alt_text: "Chanderi Embroidered Kurta Set Front View", display_order: 1, is_primary: true },
  { id: "e1111111-1111-4111-e111-000000000002", product_id: "c1111111-1111-4111-c111-000000000001", image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80", alt_text: "Chanderi Kurta Fabric Detail and Neck Embroidery", display_order: 2, is_primary: false },

  // 2. Pintuck Mulmul Kurta
  { id: "e1111111-1111-4111-e111-000000000010", product_id: "c1111111-1111-4111-c111-000000000002", image_url: "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80", alt_text: "Haldi Yellow Pintuck Mulmul Kurta", display_order: 1, is_primary: true },

  // 3. Anarkali Ensemble
  { id: "e1111111-1111-4111-e111-000000000020", product_id: "c1111111-1111-4111-c111-000000000003", image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80", alt_text: "Gulabi Pink Flared Anarkali Kurta Set", display_order: 1, is_primary: true },

  // 4. Lucknowi Chikankari Kurta
  { id: "e1111111-1111-4111-e111-000000000030", product_id: "c1111111-1111-4111-c111-000000000004", image_url: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=800&q=80", alt_text: "Lucknowi Hand Chikankari Straight Kurta", display_order: 1, is_primary: true },

  // 5. Maheshwari Saree
  { id: "e1111111-1111-4111-e111-000000000040", product_id: "c1111111-1111-4111-c111-000000000005", image_url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80", alt_text: "Royal Indigo Maheshwari Zari Border Saree", display_order: 1, is_primary: true },
  { id: "e1111111-1111-4111-e111-000000000041", product_id: "c1111111-1111-4111-c111-000000000005", image_url: "https://images.unsplash.com/photo-1610030469668-932b7245749c?auto=format&fit=crop&w=800&q=80", alt_text: "Maheshwari Saree Pallu Zari Detailing", display_order: 2, is_primary: false },

  // 6. Organza Saree
  { id: "e1111111-1111-4111-e111-000000000050", product_id: "c1111111-1111-4111-c111-000000000006", image_url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80", alt_text: "Blush Peach Organza Saree Drape", display_order: 1, is_primary: true },

  // 7. Pre-Draped Saree
  { id: "e1111111-1111-4111-e111-000000000060", product_id: "c1111111-1111-4111-c111-000000000007", image_url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80", alt_text: "Emerald Green Ready-to-Wear Georgette Saree", display_order: 1, is_primary: true },

  // 8. Pure Linen Co-ord
  { id: "e1111111-1111-4111-e111-000000000070", product_id: "c1111111-1111-4111-c111-000000000008", image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80", alt_text: "Pure Linen Tunic and Palazzo Co-ord Set", display_order: 1, is_primary: true },
  { id: "e1111111-1111-4111-e111-000000000071", product_id: "c1111111-1111-4111-c111-000000000008", image_url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80", alt_text: "Linen Co-ord Weave Detail", display_order: 2, is_primary: false },

  // 9. Woven Cotton Co-ord
  { id: "e1111111-1111-4111-e111-000000000080", product_id: "c1111111-1111-4111-c111-000000000009", image_url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80", alt_text: "Terracotta Notch-Lapel Co-ord Set", display_order: 1, is_primary: true },

  // 10. Peplum Co-ord
  { id: "e1111111-1111-4111-e111-000000000090", product_id: "c1111111-1111-4111-c111-000000000010", image_url: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80", alt_text: "Dusty Rose Peplum Embroidered Co-ord", display_order: 1, is_primary: true },

  // 11. Tiered Midi Dress
  { id: "e1111111-1111-4111-e111-000000000100", product_id: "c1111111-1111-4111-c111-000000000011", image_url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80", alt_text: "Tiered Organic Cotton Midi Dress in Terracotta", display_order: 1, is_primary: true },

  // 12. Belted Shirt Dress
  { id: "e1111111-1111-4111-e111-000000000110", product_id: "c1111111-1111-4111-c111-000000000012", image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80", alt_text: "Relaxed Olive Linen Belted Shirt Dress", display_order: 1, is_primary: true },

  // 13. Angrakha Maxi Dress
  { id: "e1111111-1111-4111-e111-000000000120", product_id: "c1111111-1111-4111-c111-000000000013", image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80", alt_text: "Flared Peacock Teal Angrakha Dress", display_order: 1, is_primary: true },

  // 14. Mandarin Cotton Shirt
  { id: "e1111111-1111-4111-e111-000000000130", product_id: "c1111111-1111-4111-c111-000000000014", image_url: "https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=800&q=80", alt_text: "Mandarin Collar Boyfriend Fit Poplin Shirt", display_order: 1, is_primary: true },

  // 15. Handloom Tunic
  { id: "e1111111-1111-4111-e111-000000000140", product_id: "c1111111-1111-4111-c111-000000000015", image_url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80", alt_text: "Fine Micro-Pintuck Handloom Tunic", display_order: 1, is_primary: true },

  // 16. High-Rise Trousers
  { id: "e1111111-1111-4111-e111-000000000150", product_id: "c1111111-1111-4111-c111-000000000016", image_url: "https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80", alt_text: "High-Rise Wide Leg Cotton Trousers Front View", display_order: 1, is_primary: true },
  { id: "e1111111-1111-4111-e111-000000000151", product_id: "c1111111-1111-4111-c111-000000000016", image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80", alt_text: "High-Rise Trousers Fit and Pockets", display_order: 2, is_primary: false },

  // 17. Linen Palazzos
  { id: "e1111111-1111-4111-e111-000000000160", product_id: "c1111111-1111-4111-c111-000000000017", image_url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80", alt_text: "Pleated Relaxed Linen Palazzos Flare", display_order: 1, is_primary: true },

  // 18. Dhoti Pants
  { id: "e1111111-1111-4111-e111-000000000170", product_id: "c1111111-1111-4111-c111-000000000018", image_url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80", alt_text: "Draped Cowl Modal Dhoti Pants", display_order: 1, is_primary: true },
];

// Product Reviews with valid hex UUIDs: f1111111-1111-4111-f111-...
const REVIEWS = [
  {
    id: "f1111111-1111-4111-f111-000000000001",
    product_id: "c1111111-1111-4111-c111-000000000001",
    customer_name: "Pooja Sharma",
    rating: 5,
    title: "Exquisite Craftsmanship & Breathable Fabric",
    comment: "Wore this for a family puja in Delhi heat. The Chanderi cotton feels so light and breathable! The inner mulmul lining prevents any sheer issues. Received so many compliments.",
    is_verified_purchase: true,
    is_approved: true,
  },
  {
    id: "f1111111-1111-4111-f111-000000000002",
    product_id: "c1111111-1111-4111-c111-000000000001",
    customer_name: "Ananya Iyer",
    rating: 5,
    title: "Worth every penny",
    comment: "The subtle zardozi work on the neckline is understated yet regal. Size M fit me true to measurement chart.",
    is_verified_purchase: true,
    is_approved: true,
  },
  {
    id: "f1111111-1111-4111-f111-000000000003",
    product_id: "c1111111-1111-4111-c111-000000000005",
    customer_name: "Kavita Reddy",
    rating: 5,
    title: "Stunning Handloom Saree",
    comment: "The Maheshwari zari border shines with authentic elegance. It drapes like a dream and doesn't balloon up at all. Delivery to Hyderabad was prompt in 3 days.",
    is_verified_purchase: true,
    is_approved: true,
  },
  {
    id: "f1111111-1111-4111-f111-000000000004",
    product_id: "c1111111-1111-4111-c111-000000000008",
    customer_name: "Sunita Nair",
    rating: 5,
    title: "Favorite Travel Co-ord Set",
    comment: "Pure linen comfort at its finest! The side pockets in both the tunic and pants are a lifesaver. Will definitely order the charcoal variant next.",
    is_verified_purchase: true,
    is_approved: true,
  },
  {
    id: "f1111111-1111-4111-f111-000000000005",
    product_id: "c1111111-1111-4111-c111-000000000011",
    customer_name: "Dr. Shalini Swaminathan",
    rating: 5,
    title: "Superb Slub Cotton Quality",
    comment: "Very well stitched midi dress. The flutter sleeves and three tiers create a wonderful breezy flare. Very happy with Velaash.",
    is_verified_purchase: true,
    is_approved: true,
  },
  {
    id: "f1111111-1111-4111-f111-000000000006",
    product_id: "c1111111-1111-4111-c111-000000000003",
    customer_name: "Radhika Kulkarni",
    rating: 5,
    title: "Royal 24-Kali Flare",
    comment: "The flare on this anarkali is magnificent! Authentic hand block print with zero bleeding in cold water. Beautiful Kota dupatta.",
    is_verified_purchase: true,
    is_approved: true,
  },
  {
    id: "f1111111-1111-4111-f111-000000000007",
    product_id: "c1111111-1111-4111-c111-000000000016",
    customer_name: "Sneha Banerjee",
    rating: 4,
    title: "Comfortable waistband and good fall",
    comment: "Structured yet comfortable for work. Size L gives a clean relaxed fit. Would love more pastel shades!",
    is_verified_purchase: true,
    is_approved: true,
  },
];

// Coupons
const COUPONS = [
  { id: "10000000-0000-4000-8000-000000000001", code: "WELCOME500", discount_type: "flat", discount_value: 500.00, min_order_value: 2500.00, max_discount_amount: null, usage_limit: 5000, usage_count: 24, valid_from: new Date(Date.now() - 5 * 86400000).toISOString(), valid_until: new Date(Date.now() + 180 * 86400000).toISOString(), is_active: true },
  { id: "10000000-0000-4000-8000-000000000002", code: "VELAASH10", discount_type: "percentage", discount_value: 10.00, min_order_value: 1500.00, max_discount_amount: 1000.00, usage_limit: 10000, usage_count: 89, valid_from: new Date(Date.now() - 10 * 86400000).toISOString(), valid_until: new Date(Date.now() + 180 * 86400000).toISOString(), is_active: true },
  { id: "10000000-0000-4000-8000-000000000003", code: "FESTIVE15", discount_type: "percentage", discount_value: 15.00, min_order_value: 4000.00, max_discount_amount: 1500.00, usage_limit: 2000, usage_count: 15, valid_from: new Date(Date.now() - 1 * 86400000).toISOString(), valid_until: new Date(Date.now() + 90 * 86400000).toISOString(), is_active: true },
  { id: "10000000-0000-4000-8000-000000000004", code: "FREESHIP", discount_type: "flat", discount_value: 99.00, min_order_value: 999.00, max_discount_amount: null, usage_limit: 5000, usage_count: 12, valid_from: new Date(Date.now() - 2 * 86400000).toISOString(), valid_until: new Date(Date.now() + 90 * 86400000).toISOString(), is_active: true },
];

// Sample Orders
const ORDERS = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    order_number: "VEL-2026-00001",
    status: "confirmed",
    payment_method: "cod",
    payment_status: "pending",
    subtotal: 4250.00,
    shipping_charge: 0.00,
    discount_amount: 0.00,
    total_amount: 4250.00,
    shipping_address: {
      fullName: "Pooja Sharma",
      phone: "+91 9820123456",
      email: "pooja.sharma@example.com",
      addressLine1: "Flat 402, Sea Breeze Heights, Worli Sea Face",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400030",
      addressType: "home",
    },
    billing_address: {
      fullName: "Pooja Sharma",
      phone: "+91 9820123456",
      email: "pooja.sharma@example.com",
      addressLine1: "Flat 402, Sea Breeze Heights, Worli Sea Face",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400030",
      addressType: "home",
    },
    coupon_code: null,
    notes: "Sample verified customer COD order",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    order_number: "VEL-2026-00002",
    status: "packed",
    payment_method: "razorpay",
    payment_status: "paid",
    subtotal: 6800.00,
    shipping_charge: 0.00,
    discount_amount: 500.00,
    total_amount: 6300.00,
    shipping_address: {
      fullName: "Ananya Iyer",
      phone: "+91 9880198765",
      email: "ananya.iyer@example.com",
      addressLine1: "Villa 14, Palm Meadows, Whitefield",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560066",
      addressType: "home",
    },
    billing_address: {
      fullName: "Ananya Iyer",
      phone: "+91 9880198765",
      email: "ananya.iyer@example.com",
      addressLine1: "Villa 14, Palm Meadows, Whitefield",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560066",
      addressType: "home",
    },
    coupon_code: "WELCOME500",
    notes: "Paid online via Razorpay (razorpay_order_id: order_mock_rzp_001)",
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    order_number: "VEL-2026-00003",
    status: "delivered",
    payment_method: "razorpay",
    payment_status: "paid",
    subtotal: 4800.00,
    shipping_charge: 0.00,
    discount_amount: 480.00,
    total_amount: 4320.00,
    shipping_address: {
      fullName: "Kavita Reddy",
      phone: "+91 9849012345",
      email: "kavita.reddy@example.com",
      addressLine1: "House 12, Road No 36, Jubilee Hills",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500033",
      addressType: "home",
    },
    billing_address: {
      fullName: "Kavita Reddy",
      phone: "+91 9849012345",
      email: "kavita.reddy@example.com",
      addressLine1: "House 12, Road No 36, Jubilee Hills",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500033",
      addressType: "home",
    },
    coupon_code: "VELAASH10",
    notes: "Delivered successfully with BlueDart Air",
  },
];

const ORDER_ITEMS = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    order_id: "20000000-0000-4000-8000-000000000001",
    product_id: "c1111111-1111-4111-c111-000000000001",
    variant_id: "d1111111-1111-4111-d111-000000000003",
    product_name_snapshot: "Chanderi Embroidered Kurta Set",
    variant_details_snapshot: { size: "M", color: "Kora Ivory", sku: "VEL-KRT-01-M-IVR" },
    unit_price: 4250.00,
    quantity: 1,
    subtotal: 4250.00,
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    order_id: "20000000-0000-4000-8000-000000000002",
    product_id: "c1111111-1111-4111-c111-000000000005",
    variant_id: "d1111111-1111-4111-d111-000000000040",
    product_name_snapshot: "Pure Maheshwari Zari Border Saree",
    variant_details_snapshot: { size: "Free Size", color: "Royal Indigo", sku: "VEL-SAR-01-FS-IND" },
    unit_price: 6800.00,
    quantity: 1,
    subtotal: 6800.00,
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    order_id: "20000000-0000-4000-8000-000000000003",
    product_id: "c1111111-1111-4111-c111-000000000008",
    variant_id: "d1111111-1111-4111-d111-000000000071",
    product_name_snapshot: "Pure Linen Tunic & Palazzo Set",
    variant_details_snapshot: { size: "M", color: "Natural Oatmeal", sku: "VEL-CRD-01-M-OAT" },
    unit_price: 4800.00,
    quantity: 1,
    subtotal: 4800.00,
  },
];

async function runSeed() {
  console.log("=== STARTING FULL CATALOG SEED ===");

  // 1. Categories
  console.log("1. Upserting Categories...");
  const { error: catErr } = await supabase.from("categories").upsert(ALL_CATEGORIES, { onConflict: "id" });
  if (catErr) throw new Error("Categories error: " + JSON.stringify(catErr));
  console.log(`✓ ${ALL_CATEGORIES.length} categories upserted.`);

  // 2. Products
  console.log("2. Upserting Products...");
  const { error: prodErr } = await supabase.from("products").upsert(PRODUCTS, { onConflict: "id" });
  if (prodErr) throw new Error("Products error: " + JSON.stringify(prodErr));
  console.log(`✓ ${PRODUCTS.length} products upserted.`);

  // 3. Product Variants
  console.log("3. Upserting Product Variants...");
  const { error: varErr } = await supabase.from("product_variants").upsert(VARIANTS, { onConflict: "id" });
  if (varErr) throw new Error("Variants error: " + JSON.stringify(varErr));
  console.log(`✓ ${VARIANTS.length} variants upserted.`);

  // 4. Product Images
  console.log("4. Upserting Product Images...");
  const { error: imgErr } = await supabase.from("product_images").upsert(IMAGES, { onConflict: "id" });
  if (imgErr) throw new Error("Images error: " + JSON.stringify(imgErr));
  console.log(`✓ ${IMAGES.length} images upserted.`);

  // 5. Reviews
  console.log("5. Upserting Reviews...");
  const { error: revErr } = await supabase.from("reviews").upsert(REVIEWS, { onConflict: "id" });
  if (revErr) throw new Error("Reviews error: " + JSON.stringify(revErr));
  console.log(`✓ ${REVIEWS.length} reviews upserted.`);

  // 6. Coupons
  console.log("6. Upserting Coupons...");
  const { error: coupErr } = await supabase.from("coupons").upsert(COUPONS, { onConflict: "code" });
  if (coupErr) throw new Error("Coupons error: " + JSON.stringify(coupErr));
  console.log(`✓ ${COUPONS.length} coupons upserted.`);

  // 7. Orders & Order Items
  console.log("7. Upserting Sample Orders...");
  const { error: ordErr } = await supabase.from("orders").upsert(ORDERS, { onConflict: "id" });
  if (ordErr) throw new Error("Orders error: " + JSON.stringify(ordErr));

  const { error: itemErr } = await supabase.from("order_items").upsert(ORDER_ITEMS, { onConflict: "id" });
  if (itemErr) throw new Error("Order items error: " + JSON.stringify(itemErr));
  console.log(`✓ ${ORDERS.length} orders and ${ORDER_ITEMS.length} items upserted.`);

  console.log("\n=== ALL SEED DATA SUCCESSFULLY PERSISTED TO SUPABASE! ===");
}

runSeed().catch((err) => {
  console.error("FATAL ERROR during seed:", err);
  process.exit(1);
});
