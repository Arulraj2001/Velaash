import { Metadata } from "next";
import { Container } from "@/components/ui";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import { ContactForm } from "@/features/contact/components/contact-form";
import { ContactDetails } from "@/features/contact/components/contact-details";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `Contact Us | ${settings.storeProfile.name || "Velaash"}`;
  const description =
    "Get in touch with customer care at Velaash. Contact us via WhatsApp, email, or our online inquiry form for sizing guidance and order assistance.";

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

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <main className="min-h-screen bg-brand-light/20 font-sans pb-24">
      {/* 1. Page Header */}
      <section className="bg-brand-cream/40 border-b border-brand-border/60 py-14 sm:py-20">
        <Container size="xl">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
              Customer Support & Inquiries
            </span>
            <h1 className="font-heading text-3xl sm:text-5xl font-semibold text-brand-dark tracking-tight">
              Contact Us
            </h1>
            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              We are here to assist with garment sizing, existing order tracking, domestic returns, and general inquiries.
            </p>
          </div>
        </Container>
      </section>

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
