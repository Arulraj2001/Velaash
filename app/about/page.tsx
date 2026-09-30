import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import { Truck, RotateCcw, ShieldCheck, Headphones, MessageCircle, Mail, ArrowRight } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `About Us | ${settings.storeProfile.name || "Velaash"}`;
  const description =
    settings.seoDefaults.meta_description ||
    "Velaash offers contemporary clothing designed for everyday elegance with refined silhouettes.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const { storeProfile } = settings;

  const whatsappNum = storeProfile.whatsapp_number || storeProfile.phone || "+91 8508643832";
  const cleanPhone = whatsappNum.replace(/[^0-9]/g, "");
  const contactEmail = storeProfile.email || "bestrchandra@gmail.com";
  const legalName = storeProfile.legal_name || "VELAASH TRADER'S";

  const trustValues = [
    {
      icon: Truck,
      title: "Pan-India Delivery",
      description: "Carefully packaged shipments dispatched to all serviceable PIN codes across India.",
    },
    {
      icon: RotateCcw,
      title: "Hassle-Free Returns",
      description: `${settings.returnsPolicy.return_window_days}-day return window for unworn items in original packaging.`,
    },
    {
      icon: ShieldCheck,
      title: "Curated Craftsmanship",
      description: "Thoughtfully selected fabrics tailored with attention to finish, fit, and comfort.",
    },
    {
      icon: Headphones,
      title: "Personalized Support",
      description: "Direct WhatsApp and email assistance for sizing recommendations and order inquiries.",
    },
  ];

  return (
    <main className="min-h-screen bg-brand-light/20 font-sans pb-20">
      {/* 1. Hero Header Section */}
      <section className="bg-brand-cream/40 border-b border-brand-border/60 py-16 sm:py-24">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
              Welcome to Velaash
            </span>
            <h1 className="font-heading text-3xl sm:text-5xl font-semibold text-brand-dark tracking-tight">
              Contemporary Clothing for Everyday Elegance
            </h1>
            <p className="text-sm sm:text-base text-brand-muted leading-relaxed max-w-2xl mx-auto">
              Velaash offers contemporary clothing designed for everyday elegance. Thoughtfully tailored
              silhouettes crafted for modern living.
            </p>
          </div>
        </Container>
      </section>

      {/* 2. Core Ethos Section (Generic, Honest Placeholder) */}
      {/* 
        ========================================================================
        TODO: Replace with real brand story once provided by the client.
        Note: In accordance with project instructions, no fabricated narrative,
        history, or founder details have been invented.
        ========================================================================
      */}
      <section className="py-16 sm:py-20">
        <Container size="xl">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 items-center">
            <div className="space-y-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
                Our Approach
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-brand-dark leading-snug">
                Simplicity, Comfort, and Modern Grace
              </h2>
              {/* TODO: Replace with real brand story once provided by the client */}
              <div className="space-y-4 text-sm text-brand-muted leading-relaxed">
                <p>
                  Velaash offers contemporary clothing designed for everyday elegance. We focus on
                  effortless silhouettes and wearable styles that seamlessly fit into your everyday and
                  occasion wardrobe.
                </p>
                <p>
                  Every collection is developed with an emphasis on breathable comfort, flattering cuts,
                  and dependable construction. Whether you are dressing for work, family gatherings, or
                  quiet weekends, our garments are crafted to make you feel poised and at ease.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-brand-dark uppercase tracking-widest hover:text-brand-accent transition-colors group"
                >
                  <span>Explore the Collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border/80 bg-white p-8 sm:p-10 shadow-xs space-y-6">
              <h3 className="font-heading text-xl font-semibold text-brand-dark">
                Store Information
              </h3>
              <div className="space-y-4 text-xs text-brand-muted">
                <div className="flex flex-col gap-1 pb-3 border-b border-brand-border/40">
                  <span className="font-semibold text-brand-dark uppercase tracking-wider text-[11px]">
                    Operating Entity
                  </span>
                  <span className="text-sm text-brand-dark font-medium">{legalName}</span>
                </div>

                <div className="flex flex-col gap-1 pb-3 border-b border-brand-border/40">
                  <span className="font-semibold text-brand-dark uppercase tracking-wider text-[11px]">
                    Customer Inquiries
                  </span>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-sm text-brand-accent hover:underline"
                  >
                    {contactEmail}
                  </a>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-brand-dark uppercase tracking-wider text-[11px]">
                    Direct WhatsApp Care
                  </span>
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-700 hover:underline font-medium"
                  >
                    {whatsappNum}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Reusable Values Strip */}
      <section className="py-12 sm:py-16 bg-white border-y border-brand-border/60">
        <Container size="xl">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
              What We Stand For
            </span>
            <h2 className="font-heading text-2xl font-semibold text-brand-dark">
              Our Commitments to You
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {trustValues.map((val, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3.5 p-5 rounded-2xl border border-brand-border/50 bg-brand-light/10 hover:bg-brand-cream/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-brand-light/60 border border-brand-gold/30 flex items-center justify-center text-brand-dark shrink-0">
                  <val.icon className="w-5 h-5 text-brand-accent" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-heading text-base font-semibold text-brand-dark">
                    {val.title}
                  </h4>
                  <p className="text-brand-muted text-xs leading-relaxed">
                    {val.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. Connect With Us Banner */}
      <section className="py-16 sm:py-20">
        <Container size="xl">
          <div className="max-w-3xl mx-auto rounded-3xl border border-brand-border bg-white p-8 sm:p-12 text-center space-y-6 shadow-xs">
            <h3 className="font-heading text-2xl sm:text-3xl font-semibold text-brand-dark">
              We&apos;re Here to Help
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted max-w-md mx-auto leading-relaxed">
              Have questions about sizing, fabric care, or domestic delivery? Our team is always happy to
              assist you directly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-brand-dark/20 text-brand-dark text-xs font-semibold uppercase tracking-wider hover:bg-brand-cream/60 transition-colors"
              >
                <Mail className="w-4 h-4 text-brand-gold" />
                <span>Contact Page</span>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
