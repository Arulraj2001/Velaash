"use client";

import * as React from "react";
import {
  ChevronDown,
  ShoppingBag,
  Truck,
  RotateCcw,
  Ruler,
  UserCheck,
  Search,
} from "lucide-react";
import type { SiteSettings } from "@/features/settings/types";
import { getStoreContact } from "@/features/settings/utils/store-contact";

interface FaqAccordionProps {
  settings: SiteSettings;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  items: FaqItem[];
}

export function FaqAccordion({ settings }: FaqAccordionProps) {
  const { shippingPolicy, returnsPolicy, paymentSettings, storeProfile } = settings;

  const freeThresholdStr = `₹${shippingPolicy.free_shipping_threshold.toLocaleString("en-IN")}`;
  const standardFeeStr = `₹${shippingPolicy.standard_shipping_fee.toLocaleString("en-IN")}`;
  const returnDays = returnsPolicy.return_window_days;
  const { whatsappNumber: whatsappNum, email: contactEmail } = getStoreContact(storeProfile);

  const codAnswer = paymentSettings.cod_enabled
    ? `Yes, Cash on Delivery is available across serviceable PIN codes in India for orders up to ₹${paymentSettings.cod_max_order_value.toLocaleString(
        "en-IN"
      )}${
        paymentSettings.cod_handling_fee > 0
          ? ` (a standard COD handling fee of ₹${paymentSettings.cod_handling_fee} applies)`
          : ""
      }.`
    : "Cash on Delivery is currently paused. All orders can be placed securely via our online payment gateway.";

  const categories: FaqCategory[] = [
    {
      id: "orders-payment",
      name: "Orders & Payment",
      icon: ShoppingBag,
      items: [
        {
          id: "op-1",
          question: "What payment methods do you accept?",
          answer:
            "We accept all major online payment options including UPI (Google Pay, PhonePe, Paytm), Credit and Debit Cards (Visa, Mastercard, RuPay), and Net Banking via Razorpay. We also offer Cash on Delivery (COD) for eligible domestic orders.",
        },
        {
          id: "op-2",
          question: "Is Cash on Delivery (COD) available?",
          answer: codAnswer,
        },
        {
          id: "op-3",
          question: "How do I know my order is confirmed?",
          answer:
            "Immediately after your order is placed, you will receive an automated confirmation email with your unique Order Reference (e.g., ORD-2026-XXXX) and full line-item details.",
        },
        {
          id: "op-4",
          question: "Can I cancel or modify my order after placing it?",
          answer:
            "Orders can be cancelled directly from your Account Orders page while their status is 'Confirmed' (prior to warehouse processing and courier dispatch). Once dispatched, cancellations are no longer possible, but you may initiate a return upon delivery.",
        },
      ],
    },
    {
      id: "shipping-delivery",
      name: "Shipping & Delivery",
      icon: Truck,
      items: [
        {
          id: "sd-1",
          question: "Where does Velaash deliver?",
          answer:
            "We currently deliver to all serviceable domestic PIN codes across India. International shipping is not offered at this time.",
        },
        {
          id: "sd-2",
          question: "How much does shipping cost, and what is the free shipping threshold?",
          answer: `Orders of ${freeThresholdStr} or more qualify for complimentary standard shipping across India. For orders below this threshold, a flat delivery fee of ${standardFeeStr} is added at checkout.`,
        },
        {
          id: "sd-3",
          question: "How long does delivery take?",
          answer:
            "Orders are typically processed and dispatched within 1 to 2 business days. Domestic delivery timelines range between 3 to 7 business days depending on your destination PIN code.",
        },
        {
          id: "sd-4",
          question: "How do I track my order?",
          answer:
            "Once your package is dispatched, we send you an email with your courier partner and tracking number. You can also view live tracking updates on your Account Orders page.",
        },
      ],
    },
    {
      id: "returns-exchanges",
      name: "Returns & Exchanges",
      icon: RotateCcw,
      items: [
        {
          id: "re-1",
          question: "What is your return policy and time window?",
          answer: `We offer a ${returnDays}-day return window from the date of delivery for unworn, unwashed items in their original condition with all tags attached.`,
        },
        {
          id: "re-2",
          question: "How do I initiate a return or exchange?",
          answer: `To initiate a return or exchange, please reach out to our Customer Care team on WhatsApp at ${whatsappNum} or via email at ${contactEmail} quoting your Order Number. Since there is currently no self-service return portal, our team will personally assist you with return pickup and verification.`,
        },
        {
          id: "re-3",
          question: "When will I receive my refund?",
          answer:
            "Refunds are processed within 5 to 7 business days following the physical receipt and quality inspection of the returned garment at our facility.",
        },
      ],
    },
    {
      id: "sizing",
      name: "Sizing & Fit",
      icon: Ruler,
      items: [
        {
          id: "sz-1",
          question: "How do I choose the correct size?",
          answer:
            "Every product page features an accurate Size Guide showing specific garment measurements (Bust, Waist, Hip, Length) in inches and centimeters. We recommend measuring a well-fitting similar garment from your wardrobe for comparison.",
        },
        {
          id: "sz-2",
          question: "Can I receive personalized sizing guidance?",
          answer: `Yes! If you are uncertain about sizing, tap the WhatsApp chat button or contact us at ${whatsappNum} with your body measurements, and our styling team will help you pick the best size.`,
        },
      ],
    },
    {
      id: "account",
      name: "Account & Security",
      icon: UserCheck,
      items: [
        {
          id: "acc-1",
          question: "Do I need an account to place an order?",
          answer:
            "No, you can check out as a guest. However, creating an account lets you save delivery addresses, track shipments in real time, and download invoices.",
        },
        {
          id: "acc-2",
          question: "How do I log in to my account?",
          answer:
            "We use secure passwordless login. Simply enter your registered email address, and we will send you a one-time 6-digit access code directly to your inbox — no password needed.",
        },
      ],
    },
  ];

  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({
    "op-1": true,
    "sd-2": true,
    "re-1": true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter items based on active category and search
  const filteredCategories = categories
    .map((cat) => {
      if (activeCategory !== "all" && cat.id !== activeCategory) {
        return null;
      }
      const matchedItems = cat.items.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q)
        );
      });
      if (matchedItems.length === 0) return null;
      return { ...cat, items: matchedItems };
    })
    .filter(Boolean) as FaqCategory[];

  return (
    <div className="space-y-8 font-sans">
      {/* Search Input */}
      <div className="relative max-w-xl mx-auto">
        <Search className="w-4 h-4 text-brand-muted absolute left-4 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search questions (e.g. shipping, COD, return, sizing)..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-brand-border bg-white text-sm text-brand-dark placeholder:text-brand-muted/70 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-3.5 text-xs text-brand-muted hover:text-brand-dark"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeCategory === "all"
              ? "bg-brand-dark text-brand-cream shadow-xs"
              : "bg-white border border-brand-border text-brand-muted hover:text-brand-dark"
          }`}
        >
          All Topics
        </button>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                isActive
                  ? "bg-brand-dark text-brand-cream shadow-xs"
                  : "bg-white border border-brand-border text-brand-muted hover:text-brand-dark"
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-brand-gold" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Categories Accordions List */}
      <div className="space-y-8 max-w-3xl mx-auto pt-4">
        {filteredCategories.length === 0 ? (
          <div className="p-10 rounded-2xl border border-brand-border bg-white text-center space-y-2">
            <p className="text-sm font-semibold text-brand-dark">No matching questions found</p>
            <p className="text-xs text-brand-muted">
              Try searching with different terms, or reach out to us directly on WhatsApp.
            </p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2.5 pb-2 border-b border-brand-border/40">
                <cat.icon className="w-5 h-5 text-brand-gold" />
                <h3 className="font-heading text-lg sm:text-xl font-semibold text-brand-dark">
                  {cat.name}
                </h3>
              </div>

              <div className="divide-y divide-brand-border/50">
                {cat.items.map((item) => {
                  const isOpen = Boolean(openItems[item.id]);
                  return (
                    <div key={item.id} className="py-4 first:pt-2 last:pb-1">
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        aria-expanded={isOpen}
                        className="flex w-full items-start justify-between gap-4 text-left group focus:outline-none"
                      >
                        <span className="font-heading text-base font-semibold text-brand-dark group-hover:text-brand-accent transition-colors">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-brand-muted shrink-0 mt-1 transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-brand-gold" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="pt-3 pr-6 text-xs sm:text-sm text-brand-muted leading-relaxed animate-in fade-in duration-150">
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Direct Contact Callout */}
      <div className="max-w-3xl mx-auto rounded-2xl border border-brand-border/60 bg-brand-light/30 p-6 sm:p-8 text-center space-y-3">
        <h4 className="font-heading text-lg font-semibold text-brand-dark">
          Still Have Questions?
        </h4>
        <p className="text-xs text-brand-muted max-w-md mx-auto leading-relaxed">
          Can&apos;t find what you are looking for? Our customer support team is available on WhatsApp and email to assist you with order inquiries and sizing advice.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <a
            href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider hover:bg-emerald-800 transition-colors shadow-xs"
          >
            Chat on WhatsApp
          </a>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-brand-dark/20 text-brand-dark text-xs font-semibold uppercase tracking-wider hover:bg-brand-cream/60 transition-colors"
          >
            Contact Form
          </a>
        </div>
      </div>
    </div>
  );
}
