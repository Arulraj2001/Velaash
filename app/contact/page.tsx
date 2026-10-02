import { Metadata } from "next";
import { Container, PageHeaderBanner } from "@/components/ui";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import { ContactForm } from "@/features/contact/components/contact-form";
import { ContactDetails } from "@/features/contact/components/contact-details";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const brandName = settings.storeProfile.name || "Velaash";
  const title = `Contact Us | ${brandName}`;
  const description =
    "Get in touch with customer care at Velaash. Contact us via WhatsApp, email, or our online inquiry form for product guidance and order assistance.";

  return {
    title,
    description,
    keywords: [
      `Contact ${brandName}`,
      brandName,
      "Customer Care",
      "Everyday essentials",
      "ஆடை",
      "கடை",
    ],
    openGraph: {
      title,
      description,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const contactBanner = settings.pageBanners?.contact;

  return (
    <main className="min-h-screen bg-brand-cream/40 font-sans pb-24">
      {/* 1. Universal Page Header Banner (Minimal by default; letterbox hero if image configured) */}
      <PageHeaderBanner
        badge="Customer Support & Inquiries"
        title={contactBanner?.headline?.trim() || "Contact Us"}
        description={
          contactBanner?.subtitle?.trim() ||
          "We are here to assist with order questions, delivery timelines, domestic returns, and product inquiries. Reach out to our customer care team directly."
        }
        imageUrl={contactBanner?.image_url}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Contact Us" },
        ]}
      />

      {/* 2. Form & Contact Details Grid */}
      <section className="py-12 sm:py-16">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-6xl mx-auto">
            {/* Left Column: Interactive Contact Form (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-brand-gold uppercase tracking-widest block mb-1">
                  Send a Message
                </span>
                <h2 className="font-heading text-2xl font-semibold text-brand-dark">
                  Online Inquiry Form
                </h2>
                <p className="text-xs text-brand-muted mt-1">
                  Fill in your details below and our team will get back to your email within 24 hours.
                </p>
              </div>

              <ContactForm />
            </div>

            {/* Right Column: Direct Business Contact Information (5 cols) */}
            <div className="lg:col-span-5">
              <ContactDetails settings={settings} />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
