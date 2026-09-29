import * as React from "react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Container,
  Section,
  SectionHeader,
  SectionTitle,
  SectionDescription,
} from "@/components/ui";
import { BRAND } from "@/lib/constants";
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Palette,
  Type,
  Code2,
  Mail,
  Search,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const colorTokens = [
    {
      name: "Primary Gold",
      hex: "#F2A900",
      token: "brand.gold",
      bgClass: "bg-brand-gold",
      textClass: "text-brand-dark",
      usage: "Primary actions, accents, active highlights",
    },
    {
      name: "Deep Accent Gold",
      hex: "#CC6F00",
      token: "brand.accent",
      bgClass: "bg-brand-accent",
      textClass: "text-brand-cream",
      usage: "Secondary buttons, premium badges, hover states",
    },
    {
      name: "Dark Brand Brown",
      hex: "#4D2A00",
      token: "brand.dark",
      bgClass: "bg-brand-dark",
      textClass: "text-brand-cream",
      usage: "Headings, body typography, dark sections & footer",
    },
    {
      name: "Light Gold Background",
      hex: "#F9E6A8",
      token: "brand.light",
      bgClass: "bg-brand-light",
      textClass: "text-brand-dark",
      usage: "Subtle backgrounds, notification chips, badge subtle",
    },
    {
      name: "Near-White Cream",
      hex: "#FFFBF0",
      token: "brand.cream",
      bgClass: "bg-brand-cream",
      textClass: "text-brand-dark",
      usage: "Default page background for calming luxury ambiance",
    },
    {
      name: "Card Off-White",
      hex: "#FFFFFF",
      token: "brand.card",
      bgClass: "bg-brand-card",
      textClass: "text-brand-dark",
      usage: "Product cards, elevated surfaces, modal dialogs",
    },
  ];

  const featureDomains = [
    {
      name: "Products",
      path: "features/products",
      description: "Catalog, variants (size/color/sku), inventory filters, and luxury gallery",
    },
    {
      name: "Cart",
      path: "features/cart",
      description: "Slide-over bag, subtotal calculation, promo discounts, tax handling",
    },
    {
      name: "Orders",
      path: "features/orders",
      description: "Razorpay checkout, Indian shipping address schema, delivery tracking",
    },
    {
      name: "Auth",
      path: "features/auth",
      description: "Supabase SSR authentication, customer profiles, session refresh",
    },
    {
      name: "Admin",
      path: "features/admin",
      description: "Revenue metrics, inventory alerts, order status management",
    },
    {
      name: "Reviews",
      path: "features/reviews",
      description: "Verified boutique buyer reviews, ratings breakdown, photo testimonials",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Welcome / System Foundation Header */}
      <Section spacing="lg" background="cream">
        <Container size="xl">
          <div className="border-brand-border from-brand-cream via-brand-light/30 to-brand-cream shadow-luxury relative overflow-hidden rounded-2xl border bg-gradient-to-br p-8 sm:p-14">
            <div className="max-w-3xl space-y-5">
              <div className="border-brand-gold/50 bg-brand-light/40 text-brand-dark inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="text-brand-accent h-3.5 w-3.5" />
                Production Foundation & Design System Ready
              </div>

              <h1 className="font-heading text-brand-dark text-4xl leading-[1.1] font-normal tracking-tight sm:text-6xl">
                Welcome to <span className="text-brand-accent font-semibold">{BRAND.name}</span>
              </h1>

              <p className="font-heading text-brand-accent text-xl font-normal italic sm:text-2xl">
                &ldquo;{BRAND.tagline}&rdquo;
              </p>

              <p className="text-brand-dark/80 max-w-2xl font-sans text-sm leading-relaxed sm:text-base">
                This environment confirms the core architecture: Next.js 16 App Router, TypeScript
                strict mode, Tailwind CSS design system tokens, Supabase SSR clients (browser,
                server, middleware), and reusable UI primitives.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Explore Design Tokens
                </Button>
                <Button variant="outline" size="lg">
                  Verify Architecture
                </Button>
              </div>

              <div className="text-brand-dark/70 border-brand-border/60 flex flex-wrap gap-4 border-t pt-4 font-sans text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="text-brand-accent h-4 w-4" /> Legal Entity:{" "}
                  {BRAND.legalName}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" /> App Router + TypeScript
                  Strict
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" /> Supabase SSR Configured
                </span>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Section 1: Color Palette Tokens */}
      <Section spacing="md">
        <Container size="xl">
          <SectionHeader align="left">
            <div className="text-brand-accent inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <Palette className="h-4 w-4" /> Design System Tokens
            </div>
            <SectionTitle>Boutique Color Tokens</SectionTitle>
            <SectionDescription>
              Carefully calibrated luxury palette defined as semantic Tailwind tokens without
              hardcoded inline values.
            </SectionDescription>
          </SectionHeader>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {colorTokens.map((item) => (
              <Card key={item.name} hoverEffect>
                <div
                  className={`h-28 w-full rounded-t-xl ${item.bgClass} border-brand-border/50 flex items-end border-b p-4`}
                >
                  <span
                    className={`rounded bg-black/15 px-2 py-1 font-mono text-xs font-bold backdrop-blur-sm ${
                      item.name === "Dark Brand Brown" ? "text-white" : "text-brand-dark"
                    }`}
                  >
                    {item.hex}
                  </span>
                </div>
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription className="text-brand-accent font-mono text-[11px]">
                    token: {item.token}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-brand-dark/70 p-5 pt-1 text-xs">
                  {item.usage}
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Section 2: Typography System */}
      <Section spacing="md" background="light">
        <Container size="xl">
          <SectionHeader align="left">
            <div className="text-brand-accent inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <Type className="h-4 w-4" /> Typography Pairing
            </div>
            <SectionTitle>Serif Display & Modern Sans</SectionTitle>
            <SectionDescription>
              Cormorant Garamond captures regal Indian boutique tradition, balanced by Plus Jakarta
              Sans for legible e-commerce interactions.
            </SectionDescription>
          </SectionHeader>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Card className="space-y-6 p-6 sm:p-8">
              <div className="border-brand-border/60 border-b pb-3">
                <span className="text-brand-accent font-mono text-xs tracking-wider uppercase">
                  Display / Heading: Cormorant Garamond
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-brand-dark/50 text-xs">H1 Display (48px - 60px)</span>
                  <h1 className="font-heading text-brand-dark text-4xl font-semibold sm:text-5xl">
                    Embroidered Co-ord Sets
                  </h1>
                </div>
                <div>
                  <span className="text-brand-dark/50 text-xs">
                    H2 Section Heading (32px - 36px)
                  </span>
                  <h2 className="font-heading text-brand-dark text-2xl font-medium sm:text-3xl">
                    Handcrafted Cotton & Linen Dresses
                  </h2>
                </div>
                <div>
                  <span className="text-brand-dark/50 text-xs">H3 Sub-heading (24px)</span>
                  <h3 className="font-heading text-brand-dark text-xl font-normal sm:text-2xl">
                    Artisanal Kurtas & Relaxed Silhouettes
                  </h3>
                </div>
              </div>
            </Card>

            <Card className="space-y-6 p-6 sm:p-8">
              <div className="border-brand-border/60 border-b pb-3">
                <span className="text-brand-accent font-mono text-xs tracking-wider uppercase">
                  Body / UI: Plus Jakarta Sans
                </span>
              </div>
              <div className="text-brand-dark space-y-4">
                <div>
                  <span className="text-brand-dark/50 text-xs">Lead Paragraph (16px)</span>
                  <p className="text-brand-dark/90 text-base leading-relaxed">
                    Every Velaash silhouette represents months of painstaking artisanal craft, woven
                    with genuine metallic zari threads by master weavers.
                  </p>
                </div>
                <div>
                  <span className="text-brand-dark/50 text-xs">Standard UI Body (14px)</span>
                  <p className="text-brand-dark/80 text-sm leading-normal">
                    Complimentary custom sizing, personalized blouse stitching, and secure insured
                    courier delivery across India and worldwide.
                  </p>
                </div>
                <div>
                  <span className="text-brand-dark/50 text-xs">
                    Micro-copy / Badges / Nav (11px Uppercase)
                  </span>
                  <p className="text-brand-accent text-xs font-semibold tracking-widest uppercase">
                    EXPLORE BESPOKE BRIDAL APPOINTMENTS • READY TO DISPATCH
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Section 3: Reusable UI Primitives */}
      <Section spacing="lg">
        <Container size="xl">
          <SectionHeader align="left">
            <div className="text-brand-accent inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <Layers className="h-4 w-4" /> Primitive Component Library
            </div>
            <SectionTitle>Accessible UI Primitives</SectionTitle>
            <SectionDescription>
              Pre-built reusable components located in <code>@/components/ui</code> with keyboard
              focus states, ARIA attributes, and variant tokens.
            </SectionDescription>
          </SectionHeader>

          {/* Button Variants */}
          <div className="space-y-10">
            <Card className="p-6 sm:p-8">
              <CardTitle className="mb-2 text-xl">Button Primitives & States</CardTitle>
              <CardDescription className="mb-6">
                All button variants with full hover, active, focus-visible rings, and loading
                states.
              </CardDescription>

              <div className="space-y-6">
                <div>
                  <p className="text-brand-dark/60 mb-3 text-xs font-semibold tracking-wider uppercase">
                    Style Variants
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary">Primary Gold</Button>
                    <Button variant="secondary">Secondary Accent</Button>
                    <Button variant="dark">Dark Brown</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link Style</Button>
                  </div>
                </div>

                <div>
                  <p className="text-brand-dark/60 mb-3 text-xs font-semibold tracking-wider uppercase">
                    Sizes & Icon Slots
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm" variant="primary">
                      Small (sm)
                    </Button>
                    <Button size="md" variant="primary">
                      Medium (md)
                    </Button>
                    <Button size="lg" variant="primary">
                      Large (lg)
                    </Button>
                    <Button variant="primary" leftIcon={<ShoppingBag className="h-4 w-4" />}>
                      With Left Icon
                    </Button>
                    <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
                      With Right Icon
                    </Button>
                    <Button variant="dark" isLoading>
                      Processing
                    </Button>
                    <Button variant="primary" disabled>
                      Disabled
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Inputs & Badges */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Inputs */}
              <Card className="space-y-5 p-6 sm:p-8">
                <CardTitle className="text-xl">Accessible Input Fields</CardTitle>
                <CardDescription>
                  Inputs with floating labels, left/right icons, helper notes, and ARIA error
                  states.
                </CardDescription>

                <div className="space-y-4">
                  <Input
                    label="Customer Full Name"
                    placeholder="e.g. Radhika Sharma"
                    helperText="As it should appear on custom tailor records"
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="client@velaash.com"
                    leftIcon={<Mail className="h-4 w-4" />}
                  />

                  <Input
                    label="Search Vault"
                    placeholder="Search kurtas, dresses, co-ords, tops..."
                    leftIcon={<Search className="h-4 w-4" />}
                  />

                  <Input
                    label="Account Password"
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4" />}
                    error="Password must be at least 8 characters"
                  />
                </div>
              </Card>

              {/* Badges & Boutique Card Preview */}
              <Card className="space-y-6 p-6 sm:p-8">
                <CardTitle className="text-xl">Boutique Badges & Tags</CardTitle>
                <CardDescription>
                  Pill badges for product categorization, stock status, and boutique highlights.
                </CardDescription>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Gold Default</Badge>
                    <Badge variant="accent">Accent Deep</Badge>
                    <Badge variant="subtle">Subtle Light</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="dark">Dark Brown</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="default" size="sm" icon={<Sparkles className="h-3 w-3" />}>
                      Pure Linen
                    </Badge>
                    <Badge variant="accent" size="sm">
                      Relaxed Fit
                    </Badge>
                    <Badge variant="subtle" size="sm">
                      Mulberry Silk
                    </Badge>
                    <Badge variant="dark" size="sm">
                      Only 2 Left
                    </Badge>
                  </div>
                </div>

                <div className="border-brand-border/60 border-t pt-4">
                  <p className="text-brand-dark/70 mb-3 text-xs font-semibold tracking-wider uppercase">
                    Sample Boutique Preview Card
                  </p>
                  <Card hoverEffect className="border-brand-border/80 overflow-hidden">
                    <div className="from-brand-accent/20 via-brand-light/40 to-brand-cream flex h-40 items-center justify-center bg-gradient-to-tr p-4">
                      <div className="space-y-1 text-center">
                        <span className="font-heading text-brand-dark text-2xl font-semibold">
                          Chanderi Embroidered Kurta Set
                        </span>
                        <p className="text-brand-dark/70 text-xs">
                          Crafted with breathable cotton silk
                        </p>
                      </div>
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="accent" size="sm">
                          New Arrival
                        </Badge>
                        <span className="text-brand-dark text-base font-semibold">₹3,850</span>
                      </div>
                    </CardHeader>
                    <CardContent className="text-brand-dark/70 p-4 pt-1 text-xs">
                      Featuring refined neck embroidery, coordinating palazzo, and soft dupatta.
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        leftIcon={<ShoppingBag className="h-3.5 w-3.5" />}
                      >
                        Bespoke Inquiry
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      {/* Section 4: Architecture & Domain Layout */}
      <Section spacing="lg" background="cream">
        <Container size="xl">
          <SectionHeader align="left">
            <div className="text-brand-accent inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              <Code2 className="h-4 w-4" /> Feature-Based Project Structure
            </div>
            <SectionTitle>Clean Domain Boundaries</SectionTitle>
            <SectionDescription>
              Each domain is encapsulated inside its own feature folder containing dedicated
              components, server actions, Zod schemas, and queries.
            </SectionDescription>
          </SectionHeader>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureDomains.map((feature) => (
              <Card key={feature.name} hoverEffect className="space-y-3 p-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading text-brand-dark text-xl font-semibold">
                    {feature.name} Domain
                  </h4>
                  <Badge variant="subtle" size="sm">
                    Ready
                  </Badge>
                </div>
                <p className="text-brand-accent font-mono text-xs">/{feature.path}</p>
                <p className="text-brand-dark/70 font-sans text-xs leading-relaxed">
                  {feature.description}
                </p>
                <div className="text-brand-dark/50 border-brand-border/40 border-t pt-2 font-mono text-[11px]">
                  actions/ • components/ • queries/ • types/
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  );
}
