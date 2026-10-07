import { Metadata } from "next";
import { Container, PageHeaderBanner } from "@/components/ui";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import { FaqAccordion } from "@/features/faq/components/faq-accordion";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `Frequently Asked Questions | ${settings.storeProfile.name || "Velaash"}`;
  const description =
    "Find answers to common questions about orders, payments, domestic shipping rates, doorstep replacement policy, and sizing at Velaash.";

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
  const faqBanner = settings.pageBanners?.faq;

  return (
    <main className="min-h-screen bg-brand-cream/40 font-sans pb-24">
      {/* 1. Universal Page Header Banner (Minimal by default; letterbox hero if image configured) */}
      <PageHeaderBanner
        badge="Help & Resources"
        title={faqBanner?.headline?.trim() || "Frequently Asked Questions"}
        description={
          faqBanner?.subtitle?.trim() ||
          `Clear, reliable answers regarding ordering, payments, domestic shipping, garment care, and our ${settings.returnsPolicy.return_window_days}-day doorstep replacement policy.`
        }
        imageUrl={faqBanner?.image_url}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "FAQs" },
        ]}
      />

      {/* 2. Accordion Body */}
      <section className="py-12 sm:py-16">
        <Container size="xl">
          <FaqAccordion settings={settings} />
        </Container>
      </section>
    </main>
  );
}
