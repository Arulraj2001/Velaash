import { Metadata } from "next";
import { Container } from "@/components/ui";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import { FaqAccordion } from "@/features/faq/components/faq-accordion";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `Frequently Asked Questions | ${settings.storeProfile.name || "Velaash"}`;
  const description =
    "Find answers to common questions about orders, payments, domestic shipping rates, return policy, and sizing at Velaash.";

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

export default async function FaqPage() {
  const settings = await getSiteSettings();

  return (
    <main className="min-h-screen bg-brand-light/20 font-sans pb-24">
      {/* 1. Page Header */}
      <section className="bg-brand-cream/40 border-b border-brand-border/60 py-14 sm:py-20">
        <Container size="xl">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
              Help & Resources
            </span>
            <h1 className="font-heading text-3xl sm:text-5xl font-semibold text-brand-dark tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              Clear answers regarding ordering, payments, domestic shipping, sizing, and our {settings.returnsPolicy.return_window_days}-day return policy.
            </p>
          </div>
        </Container>
      </section>

      {/* 2. Accordion Body */}
      <section className="py-12 sm:py-16">
        <Container size="xl">
          <FaqAccordion settings={settings} />
        </Container>
      </section>
    </main>
  );
}
