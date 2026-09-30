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

async function main() {
  const { createAdminClient } = await import("../lib/supabase/admin");
  const admin = createAdminClient();

  const rows = [
    {
      id: "40000000-0000-4000-8000-000000000001",
      section_type: "hero_banner" as const,
      title: "Hero Banner",
      display_order: 1,
      is_active: true,
      content: {
        headline: "Modern Everyday Luxury",
        subtitle: "Effortless silhouettes and contemporary styles designed for everyday grace.",
        cta_text: "Explore Collection",
        cta_link: "/shop",
        secondary_cta_text: "Kurtas & Sets",
        secondary_cta_link: "/collections/kurtas-sets",
        bg_image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1600&auto=format&fit=crop"
      }
    },
    {
      id: "40000000-0000-4000-8000-000000000002",
      section_type: "category_grid" as const,
      title: "Curated Collections",
      display_order: 2,
      is_active: true,
      content: {
        title: "Explore by Category",
        subtitle: "Thoughtfully tailored pieces across modern silhouettes."
      }
    },
    {
      id: "40000000-0000-4000-8000-000000000003",
      section_type: "featured_products" as const,
      title: "Featured Arrivals",
      display_order: 3,
      is_active: true,
      content: {
        title: "Featured Arrivals",
        subtitle: "Handpicked styles from our latest seasonal drop.",
        mode: "auto",
        limit: 8
      }
    },
    {
      id: "40000000-0000-4000-8000-000000000004",
      section_type: "value_strip" as const,
      title: "The Velaash Promise",
      display_order: 4,
      is_active: true,
      content: {
        title: "Our Commitments",
        items: [
          { icon: "Truck", title: "Pan-India Delivery", description: "Reliable domestic shipping across all serviceable PIN codes." },
          { icon: "RotateCcw", title: "Hassle-Free Returns", description: "7-day doorstep return and exchange on eligible items." },
          { icon: "ShieldCheck", title: "100% Authentic Quality", description: "Directly sourced artisanal fabrics with rigorous craft inspection." },
          { icon: "Headphones", title: "Dedicated Support", description: "Direct WhatsApp and email assistance for sizing and inquiries." }
        ]
      }
    },
    {
      id: "40000000-0000-4000-8000-000000000005",
      section_type: "custom_html" as const,
      title: "Join the Velaash Circle",
      display_order: 5,
      is_active: true,
      content: {
        section_kind: "newsletter",
        headline: "Join the Velaash Circle",
        subtext: "Subscribe for early access to limited artisanal drops, private sales, and styling guides."
      }
    }
  ];

  const { error } = await admin.from("homepage_sections").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error("Error seeding homepage sections:", error);
  } else {
    console.log("Successfully seeded canonical 5 homepage sections!");
  }
}

main().catch(console.error);
