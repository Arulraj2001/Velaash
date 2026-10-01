import React from "react";
import type { Metadata } from "next";
import { Package, MessageCircle, Clock } from "lucide-react";
import { PageHeaderBanner } from "@/components/ui";
import { getSiteSettings } from "@/features/settings";
import { GuestTrackingForm } from "@/features/orders/components/guest-tracking-form";

export const metadata: Metadata = {
  title: "Track Your Order | Velaash",
  description:
    "Track the live delivery progress, courier status, and fulfillment journey of your Velaash apparel order without logging in.",
};

export default async function TrackOrderPage() {
  const settings = await getSiteSettings();
  const trackBanner = settings.pageBanners?.track_order;

  const whatsappNumber = "918508643832";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hi Velaash, I have a question regarding order tracking and delivery status."
  )}`;

  return (
    <main className="min-h-screen bg-brand-cream/40 font-sans pb-24">
      {/* 1. Universal Page Header Banner (Minimal by default; letterbox hero if image configured) */}
      <PageHeaderBanner
        badge="Fulfillment & Delivery Tracking"
        title={trackBanner?.headline?.trim() || "Track Your Order"}
        description={
          trackBanner?.subtitle?.trim() ||
          "Check the real-time status of your handcrafted garments from initial tailoring to courier dispatch and final doorstep delivery."
        }
        imageUrl={trackBanner?.image_url}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Track Order" },
        ]}
      />

      <div className="mx-auto max-w-4xl space-y-10 px-4 sm:px-6 lg:px-8 py-10 sm:py-16">


        {/* Guest Tracking Form & Results Display */}
        <GuestTrackingForm />

        {/* Tracking Support & FAQ Strip */}
        <section
          aria-labelledby="tracking-faq-heading"
          className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-sm space-y-6"
        >
          <h2
            id="tracking-faq-heading"
            className="font-heading text-lg font-semibold text-brand-dark"
          >
            Frequently Asked Tracking Questions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-brand-muted">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-brand-dark font-semibold">
                <Package className="h-4 w-4 text-brand-accent" />
                <span>Where is my Order ID?</span>
              </div>
              <p className="leading-relaxed">
                Your order reference (e.g. <span className="font-mono text-[11px] font-bold text-brand-dark">VEL-2026-XXXXX</span>) was sent to your email and SMS confirmation immediately after checkout.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-brand-dark font-semibold">
                <Clock className="h-4 w-4 text-brand-accent" />
                <span>When will it ship?</span>
              </div>
              <p className="leading-relaxed">
                Standard orders are tailored and dispatched within 2 to 3 business days. Tracking consignment numbers activate once scanned by our courier partner.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-brand-dark font-semibold">
                <MessageCircle className="h-4 w-4 text-brand-accent" />
                <span>Need extra help?</span>
              </div>
              <p className="leading-relaxed">
                Can&apos;t locate your order reference?{" "}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
                >
                  Message us on WhatsApp
                </a>{" "}
                with your name and we will assist promptly.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
