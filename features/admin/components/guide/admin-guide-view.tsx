"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Package,
  Sparkles,
  TicketPercent,
  ShoppingBag,
  Megaphone,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Flame,
  Layers,
} from "lucide-react";
import type { AdminRole } from "@/types/database.types";

interface AdminGuideViewProps {
  role: AdminRole;
  adminName: string;
}

type GuideCategory =
  | "all"
  | "products"
  | "festive"
  | "popup"
  | "coupons"
  | "orders"
  | "storefront"
  | "roles";

interface GuideTopic {
  id: string;
  category: GuideCategory;
  title: string;
  subtitle: string;
  targetRole: "all" | "owner";
  actionHref?: string;
  actionText?: string;
  badge: string;
  badgeColor: string;
  steps: {
    number: number;
    title: string;
    details: string;
    substeps?: string[];
  }[];
  templates?: {
    label: string;
    text: string;
  }[];
  proTips: string[];
}

const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: "add-products",
    category: "products",
    title: "1. Listing Garments & Simple Items (Pooja, Lamps)",
    subtitle: "Complete walkthrough for publishing products, variants, specifications & photos.",
    targetRole: "owner",
    actionHref: "/admin/products",
    actionText: "Open Products Manager",
    badge: "Catalog",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    steps: [
      {
        number: 1,
        title: "Start a New Product",
        details: "Go to Admin → Products and click the '+ Add Product' button in the top-right corner.",
      },
      {
        number: 2,
        title: "Basic Details & Category",
        details: "Enter Product Name and assign the parent category or subcategory. The URL slug is auto-generated.",
        substeps: [
          "Garment title example: Pure Kanchipuram Soft Silk Saree with Zari Border",
          "Brass item title example: Handcrafted Brass Annapakshi Kuthu Vilakku (Pair)",
        ],
      },
      {
        number: 3,
        title: "Choose Product Type (Variants vs Simple)",
        details: "Determine whether the product has different sizes/colors or is a single fixed item:",
        substeps: [
          "Garments (Kurtas, Sarees, Dresses): Keep 'Has Variants' checked. Add sizes (XS, S, M, L, XL, Free Size) and colors with individual stock quantities.",
          "Simple Items (Pooja Items, Lamps, Accessories): Uncheck 'Has Variants'. Set a single Base Price and direct Stock Quantity.",
        ],
      },
      {
        number: 4,
        title: "Pricing & Compare-at MRP",
        details: "Set Base Price (what the customer pays). Add Compare-at Price (original MRP) if you want the website to automatically display a '% OFF' discount badge.",
      },
      {
        number: 5,
        title: "Add Product Specifications",
        details: "Click '+ Add Specification' to build custom attribute rows shown cleanly on the product page:",
        substeps: [
          "Brass/Pooja items: Material: Pure Brass | Finish: Antique Gold | Height: 10 Inches | Weight: 1.5 kg",
          "Garments: Fabric: Pure Chanderi Silk | Weave: Handloom | Care: Dry Clean Only",
        ],
      },
      {
        number: 6,
        title: "High-Resolution Photography",
        details: "Upload images in vertical 4:5 portrait ratio (recommended 800x1000px). Star one photo as Primary (catalog cover photo).",
      },
      {
        number: 7,
        title: "Publish or Save as Draft",
        details: "Turn 'Active' toggle ON to make it immediately purchasable, or leave OFF to save as an internal draft.",
      },
    ],
    proTips: [
      "Always preview the live product link on both mobile and desktop after publishing.",
      "Check 'Featured' to show the item in the curated spotlight row on the homepage.",
    ],
  },
  {
    id: "festive-offers",
    category: "festive",
    title: "2. Running Festive Free Shipping Campaigns (Pongal / Festivals)",
    subtitle: "Schedule automatic zero-shipping delivery for specific products or via promo code.",
    targetRole: "owner",
    actionHref: "/admin/settings",
    actionText: "Configure Shipping Campaign",
    badge: "Festive Engine",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    steps: [
      {
        number: 1,
        title: "Access Shipping Policy in Settings",
        details: "Go to Admin → Settings and locate the 'Shipping & Delivery' section.",
      },
      {
        number: 2,
        title: "Turn ON Festive Campaign Toggle",
        details: "Toggle 'Campaign Active' ON inside the 'Festive Free Shipping Campaign' card.",
      },
      {
        number: 3,
        title: "Set Campaign Name & Customer Badge",
        details: "Set Title (e.g., 'Pongal Festival Special') and Customer Badge Text (e.g., '🌾 Pongal Special: Free Delivery').",
        substeps: [
          "This badge automatically displays on catalog cards, product pages, cart drawer, and checkout summary.",
        ],
      },
      {
        number: 4,
        title: "Set Automatic Start & End Dates",
        details: "Enter Start Date (activates at 00:00) and End Date (auto-shuts off at 23:59:59). You never need to stay up until midnight to turn offers off manually.",
      },
      {
        number: 5,
        title: "Choose Eligible Scope (All Products vs Specific)",
        details: "Select how the festival offer applies:",
        substeps: [
          "Storewide: Check 'Apply free shipping to ALL products storewide' for festival weekends.",
          "Specific Items: Leave unchecked and enter comma-separated product slugs or IDs (e.g., brass-diya-pooja-set, chanderi-silk-saree).",
        ],
      },
      {
        number: 6,
        title: "Add Festive Free-Shipping Promo Code (Optional)",
        details: "Enter a code like PONGALFREE. Customers typing this coupon at checkout receive ₹0 delivery instantly, even for non-festive items.",
      },
    ],
    templates: [
      {
        label: "Pongal Special Badge",
        text: "🌾 Pongal Special: Free Delivery",
      },
      {
        label: "Diwali Special Badge",
        text: "🪔 Diwali Dhamaka: Free Delivery",
      },
      {
        label: "Festive Promo Code",
        text: "PONGALFREE",
      },
    ],
    proTips: [
      "The system has zero-conflict protection: normal discount codes (e.g. 10% off) still apply harmoniously with festive free delivery.",
      "Cash on Delivery handling fees remain separate and protected.",
    ],
  },
  {
    id: "popup-ad",
    category: "popup",
    title: "3. Creating & Managing the Promotional Pop-up Modal Ad",
    subtitle: "Display attention-grabbing welcome offers and festive announcements to store visitors.",
    targetRole: "owner",
    actionHref: "/admin/settings",
    actionText: "Manage Pop-up Ad",
    badge: "Marketing",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    steps: [
      {
        number: 1,
        title: "Open Promotional Pop-up Settings",
        details: "Go to Admin → Settings and click the 'Promotional Pop-up' tab.",
      },
      {
        number: 2,
        title: "Enable the Modal",
        details: "Switch 'Enable Pop-up' to ON so visitors can see it.",
      },
      {
        number: 3,
        title: "Write Engaging Festive Copy",
        details: "Set Headline (e.g. 'Celebrate Pongal in Traditional Elegance') and Subtitle (e.g. 'Flat 10% Off on Heritage Sarees + Free Delivery').",
      },
      {
        number: 4,
        title: "Add Coupon Code & 1-Click Copy",
        details: "Enter your active promo code (e.g. PONGAL10). A 1-click 'Copy Code' button appears inside the pop-up modal for visitors.",
      },
      {
        number: 5,
        title: "Set Destination Button",
        details: "Set Button Text (e.g. 'Shop Festive Collection') and Destination Link (e.g. /categories/pooja-and-brass or /products/chanderi-silk-saree).",
      },
      {
        number: 6,
        title: "Upload Vertical Ad Banner",
        details: "Upload an eye-catching vertical graphic (600x800px) showcasing your best festival attire or brass collection.",
      },
      {
        number: 7,
        title: "Adjust Timing Delay",
        details: "Set delay to 3-5 seconds after page load for the highest visitor engagement without being intrusive.",
      },
    ],
    templates: [
      {
        label: "Festive Headline",
        text: "🌾 Celebrate Pongal with Velaash",
      },
      {
        label: "Festive Subtitle",
        text: "Enjoy complimentary standard delivery and festive savings on traditional weaves.",
      },
    ],
    proTips: [
      "Keep text brief and punchy so mobile users can read it in 3 seconds.",
      "Ensure the coupon code specified in the popup is also active in the Coupons section.",
    ],
  },
  {
    id: "coupons",
    category: "coupons",
    title: "4. Creating Discount Coupons & Promo Vouchers",
    subtitle: "Create percentage discounts, flat cash discounts, or usage-capped coupons.",
    targetRole: "owner",
    actionHref: "/admin/coupons",
    actionText: "Open Coupons Manager",
    badge: "Promotions",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    steps: [
      {
        number: 1,
        title: "Create New Coupon",
        details: "Go to Admin → Coupons and click '+ Create Coupon'.",
      },
      {
        number: 2,
        title: "Enter Code",
        details: "Type an uppercase alphanumeric code without spaces (e.g., VELAASH10, FESTIVE500).",
      },
      {
        number: 3,
        title: "Select Discount Type",
        details: "Choose how the discount applies:",
        substeps: [
          "Percentage (%): e.g., 10 for 10% off. You can set a Maximum Discount Cap (e.g. ₹500 cap).",
          "Flat Amount (₹): e.g., 200 for flat ₹200 off the order.",
        ],
      },
      {
        number: 4,
        title: "Minimum Order Value",
        details: "Specify the required cart subtotal to use the voucher (e.g., ₹999 or ₹1,999).",
      },
      {
        number: 5,
        title: "Usage Limits & Expiry",
        details: "Optionally cap total redemptions (e.g., first 100 orders) and define valid start and end dates.",
      },
    ],
    templates: [
      {
        label: "Welcome Code (10% Off)",
        text: "WELCOME10",
      },
      {
        label: "Festival Flat Code",
        text: "FESTIVE250",
      },
    ],
    proTips: [
      "Expired coupons automatically reject customer checkout attempts with a polite message.",
      "All coupon codes are automatically capitalized and trimmed for seamless checkout.",
    ],
  },
  {
    id: "orders-fulfillment",
    category: "orders",
    title: "5. Processing Orders, Shiprocket & Courier Tracking",
    subtitle: "Daily operational flow for verifying payments, packing, and dispatching parcels.",
    targetRole: "all",
    actionHref: "/admin/orders",
    actionText: "View Customer Orders",
    badge: "Operations",
    badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    steps: [
      {
        number: 1,
        title: "Daily Morning Review",
        details: "Go to Admin → Orders. Filter by 'Confirmed' to see orders paid online or verified for Cash on Delivery.",
      },
      {
        number: 2,
        title: "Inspect Order Details",
        details: "Click any order row to review customer name, complete shipping address, pincode, contact phone, and ordered items/sizes.",
      },
      {
        number: 3,
        title: "Packing the Parcel",
        details: "Pick items from physical inventory, inspect craftsmanship, and pack into branded Velaash packaging with tamper-evident tape.",
      },
      {
        number: 4,
        title: "Courier Dispatch via Shiprocket",
        details: "Click 'Push to Shiprocket' to automatically book shipment with courier partners (Bluedart, Delhivery, DTDC) and generate the shipping label / AWB.",
      },
      {
        number: 5,
        title: "Manual Courier (Alternative)",
        details: "If using a local courier (e.g. Professional Couriers), enter Courier Name and Tracking Number manually, then mark status as 'Shipped'.",
      },
      {
        number: 6,
        title: "Automatic Customer Tracking",
        details: "Marking as Shipped triggers automated notifications to the customer with their live tracking link.",
      },
    ],
    proTips: [
      "Never mark an unpaid online order as 'Shipped'. Razorpay confirmed orders will always show 'Payment: Paid'.",
      "For COD orders above ₹5,000, place a quick phone call to verify before dispatch.",
    ],
  },
  {
    id: "announcement-bar",
    category: "storefront",
    title: "6. Updating the Top Header Announcement Bar & Policies",
    subtitle: "Broadcast active offers, festival greetings, and shipping policies across every page.",
    targetRole: "owner",
    actionHref: "/admin/settings",
    actionText: "Update Announcement Bar",
    badge: "Storefront",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    steps: [
      {
        number: 1,
        title: "Navigate to Announcement Bar Tab",
        details: "Go to Admin → Settings and click 'Announcement Bar'.",
      },
      {
        number: 2,
        title: "Update Announcement Ticker",
        details: "Ensure 'Enable Announcement Bar' is checked. Enter your text and optional link.",
      },
      {
        number: 3,
        title: "Configure Customer Checkout Policy",
        details: "Under Settings → Checkout Policy, toggle whether guest checkout is permitted or if customer account sign-in is required.",
      },
      {
        number: 4,
        title: "COD Settings & Maximum Order Value",
        details: "Under Settings → Payment Policy, adjust COD availability, handling fee, and maximum allowable COD cart value.",
      },
    ],
    templates: [
      {
        label: "Pongal Announcement",
        text: "🌾 Happy Pongal! Enjoy Free Shipping on Festive Collections. Code: PONGALFREE",
      },
      {
        label: "Standard Free Delivery Announcement",
        text: "✨ Free Domestic Shipping on Orders Above ₹999 | Handcrafted in India",
      },
    ],
    proTips: [
      "Keep announcement text under 80 characters for optimal single-line display on mobile screens.",
    ],
  },
  {
    id: "roles-security",
    category: "roles",
    title: "7. Staff Permissions & Security Guidelines",
    subtitle: "Understanding Owner vs Staff privileges and administrative safety.",
    targetRole: "all",
    actionHref: "/admin/staff",
    actionText: "Manage Staff Users",
    badge: "Security",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    steps: [
      {
        number: 1,
        title: "Owner Authority (Full Control)",
        details: "Owners have unrestricted authority: revenue analytics, coupon creation, site settings, homepage design, staff user invites, and product creation/deletions.",
      },
      {
        number: 2,
        title: "Staff Authority (Daily Fulfillment)",
        details: "Staff can view dashboard operational counts, process orders, update shipping statuses, view products, and perform quick inventory adjustments.",
        substeps: [
          "Staff CANNOT see store revenue or financial statements.",
          "Staff CANNOT modify site settings, delete products, or create coupons.",
        ],
      },
      {
        number: 3,
        title: "Password & Account Hygiene",
        details: "Never share individual admin login credentials. Create a separate staff user account for each team member under Admin → Staff.",
      },
    ],
    proTips: [
      "When staff members leave the company, immediately deactivate their account from Admin → Staff.",
      "The service-role key is protected server-side and never exposed to browser sessions.",
    ],
  },
];

export function AdminGuideView({ role, adminName }: AdminGuideViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({
    "add-products": true,
    "festive-offers": true,
  });
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const toggleTopic = (id: string) => {
    setExpandedTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(text);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  // Filter topics
  const filteredTopics = GUIDE_TOPICS.filter((topic) => {
    const matchesCategory = selectedCategory === "all" || topic.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      topic.title.toLowerCase().includes(q) ||
      topic.subtitle.toLowerCase().includes(q) ||
      topic.steps.some(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.details.toLowerCase().includes(q) ||
          s.substeps?.some((sub) => sub.toLowerCase().includes(q))
      );

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <BookOpen className="w-5 h-5" />
              </span>
              <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
                Operations Handbook
              </span>
              <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full capitalize font-medium text-slate-300">
                {role} Mode
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-white">
              Velaash Store Operations &amp; Training Guide
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Welcome back, <strong className="text-white">{adminName}</strong>. Step-by-step
              instructions for listing products, launching festive campaigns, setting up popup ads,
              managing coupons, and processing customer orders.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Link
              href="/admin/products"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>Go to Products</span>
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors border border-white/10"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Go to Orders</span>
            </Link>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="mt-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search instructions (e.g. 'pongal', 'popup ad', 'add saree', 'shiprocket', 'coupon')..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans backdrop-blur-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "all", label: "All Guides", icon: Layers },
          { id: "products", label: "Products & Stock", icon: Package },
          { id: "festive", label: "Festive Offers (Pongal)", icon: Flame },
          { id: "popup", label: "Pop-up Modal Ad", icon: Megaphone },
          { id: "coupons", label: "Discount Coupons", icon: TicketPercent },
          { id: "orders", label: "Order Fulfillment", icon: ShoppingBag },
          { id: "storefront", label: "Announcement & Home", icon: Sliders },
          { id: "roles", label: "Staff & Security", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id as GuideCategory)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Routine Summary Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Daily Morning Routine</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            1. Check <strong>Orders → Confirmed</strong>.<br />
            2. Pack parcels with tamper tape.<br />
            3. Push to Shiprocket for courier labels.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Before Every Festival</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            1. Set dates in <strong>Settings → Festive Shipping</strong>.<br />
            2. Enable <strong>Promotional Pop-up</strong> ad.<br />
            3. Update <strong>Top Announcement</strong> banner.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Stock Safety Rule</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Update stock counts immediately when retail/offline sales happen to prevent customer
            over-orders on the website.
          </p>
        </div>
      </div>

      {/* Topics Accordion List */}
      <div className="space-y-4">
        {filteredTopics.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <p className="text-sm font-medium">No guides matched your search query.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-2 text-xs font-semibold text-amber-600 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredTopics.map((topic) => {
            const isExpanded = Boolean(expandedTopics[topic.id]);
            return (
              <div
                key={topic.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-shadow hover:shadow-md"
              >
                {/* Header */}
                <div
                  onClick={() => toggleTopic(topic.id)}
                  className="p-5 sm:p-6 cursor-pointer select-none flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${topic.badgeColor}`}
                      >
                        {topic.badge}
                      </span>
                      {topic.targetRole === "owner" ? (
                        <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                          Owner Authority
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Staff &amp; Owner
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-heading font-semibold text-slate-900">
                      {topic.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">{topic.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-1">
                    {topic.actionHref && (
                      <Link
                        href={topic.actionHref}
                        onClick={(e) => e.stopPropagation()}
                        className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-black bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span>{topic.actionText}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    <button
                      type="button"
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Body Details */}
                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 space-y-6 animate-in fade-in duration-200">
                    {/* Steps */}
                    <div className="space-y-4">
                      {topic.steps.map((step) => (
                        <div key={step.number} className="flex items-start gap-3.5">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold shrink-0 mt-0.5">
                            {step.number}
                          </span>
                          <div className="space-y-1 flex-1">
                            <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                              {step.title}
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">{step.details}</p>
                            {step.substeps && (
                              <ul className="mt-1.5 space-y-1 pl-4 list-disc text-xs text-slate-500">
                                {step.substeps.map((sub, idx) => (
                                  <li key={idx}>{sub}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Copyable Templates */}
                    {topic.templates && topic.templates.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Ready-to-Use Copy Templates (Click to Copy)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {topic.templates.map((tpl, i) => (
                            <div
                              key={i}
                              onClick={() => handleCopy(tpl.text)}
                              className="group p-2.5 rounded-lg border border-slate-200 bg-white hover:border-amber-400 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                            >
                              <div className="overflow-hidden">
                                <span className="text-[10px] font-semibold text-slate-400 block">
                                  {tpl.label}
                                </span>
                                <span className="text-xs font-mono font-medium text-slate-800 truncate block">
                                  {tpl.text}
                                </span>
                              </div>
                              <span className="text-slate-400 group-hover:text-amber-600 shrink-0">
                                {copiedTemplate === tpl.text ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pro Tips */}
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1 text-xs text-amber-950">
                      <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Best Practice Recommendations:</span>
                      </div>
                      <ul className="pl-4 list-disc space-y-0.5 text-amber-900/90 text-[11px]">
                        {topic.proTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
