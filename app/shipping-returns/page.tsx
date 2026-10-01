import { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeaderBanner } from "@/components/ui";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import {
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `Shipping & Returns Policy | ${settings.storeProfile.name || "Velaash"}`;
  const description = `Read our comprehensive domestic shipping terms and ${settings.returnsPolicy.return_window_days}-day return guidelines across India.`;

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

export default async function ShippingReturnsPage() {
  const settings = await getSiteSettings();
  const { shippingPolicy, returnsPolicy, storeProfile } = settings;

  const freeThresholdStr = `₹${shippingPolicy.free_shipping_threshold.toLocaleString("en-IN")}`;
  const standardFeeStr = `₹${shippingPolicy.standard_shipping_fee.toLocaleString("en-IN")}`;
  const returnDays = returnsPolicy.return_window_days;
  const whatsappNum = storeProfile.whatsapp_number || storeProfile.phone || "+91 8508643832";
  const cleanPhone = whatsappNum.replace(/[^0-9]/g, "");
  const contactEmail = storeProfile.email || "bestrchandra@gmail.com";
  const shippingBanner = settings.pageBanners?.shipping_returns;

  return (
    <main className="min-h-screen bg-brand-cream/40 font-sans pb-24">
      {/* 1. Universal Page Header Banner (Minimal by default; letterbox hero if image configured) */}
      <PageHeaderBanner
        badge="Store Policies & Guidelines"
        title={shippingBanner?.headline?.trim() || "Shipping & Returns Policy"}
        description={
          shippingBanner?.subtitle?.trim() ||
          `Complete, authoritative details regarding order dispatch, domestic delivery across India, and our ${returnDays}-day return policy.`
        }
        imageUrl={shippingBanner?.image_url}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Shipping & Returns" },
        ]}
      />

      {/* 2. Key Terms Summary Strip */}
      <section className="py-8 bg-white border-b border-brand-border/60">
        <Container size="xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-4xl mx-auto">
            <div className="p-3 space-y-1">
              <span className="text-[11px] font-bold text-brand-gold uppercase tracking-wider block">
                Free Shipping
              </span>
              <p className="font-heading text-lg sm:text-xl font-semibold text-brand-dark">
                {`Orders ≥ ${freeThresholdStr}`}
              </p>
              <p className="text-[11px] text-brand-muted">Complimentary delivery</p>
            </div>

            <div className="p-3 space-y-1 border-l border-brand-border/50">
              <span className="text-[11px] font-bold text-brand-gold uppercase tracking-wider block">
                Standard Shipping Fee
              </span>
              <p className="font-heading text-lg sm:text-xl font-semibold text-brand-dark">
                {standardFeeStr}
              </p>
              <p className="text-[11px] text-brand-muted">{`For orders under ${freeThresholdStr}`}</p>
            </div>

            <div className="p-3 space-y-1 border-t md:border-t-0 md:border-l border-brand-border/50">
              <span className="text-[11px] font-bold text-brand-gold uppercase tracking-wider block">
                Return Window
              </span>
              <p className="font-heading text-lg sm:text-xl font-semibold text-brand-dark">
                {`${returnDays} Days`}
              </p>
              <p className="text-[11px] text-brand-muted">From delivery date</p>
            </div>

            <div className="p-3 space-y-1 border-t md:border-t-0 border-l border-brand-border/50">
              <span className="text-[11px] font-bold text-brand-gold uppercase tracking-wider block">
                Coverage
              </span>
              <p className="font-heading text-lg sm:text-xl font-semibold text-brand-dark">
                Pan-India
              </p>
              <p className="text-[11px] text-brand-muted">Domestic delivery only</p>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Detailed Policy Content */}
      <section className="py-14 sm:py-18">
        <Container size="xl">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* PART A: SHIPPING & DELIVERY */}
            <div className="rounded-2xl border border-brand-border/80 bg-white p-8 sm:p-10 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-brand-border/60">
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-brand-dark">
                    Shipping & Delivery Terms
                  </h2>
                  <p className="text-xs text-brand-muted">
                    Domestic logistics, delivery charges, and dispatch timelines
                  </p>
                </div>
              </div>

              <div className="space-y-5 text-sm text-brand-muted leading-relaxed">
                <div>
                  <h3 className="font-heading text-base font-semibold text-brand-dark mb-1.5">
                    1. Serviceable Areas & Coverage
                  </h3>
                  <p>
                    Velaash currently services domestic delivery across all serviceable PIN codes within the Republic of India. We partner with reputable national couriers (including Blue Dart, Delhivery, DTDC, and India Post) to ensure dependable transit. <em>Please note: International shipping is not supported at this time.</em>
                  </p>
                </div>

                <div>
                  <h3 className="font-heading text-base font-semibold text-brand-dark mb-1.5">
                    2. Delivery Charges & Free Shipping Threshold
                  </h3>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li>
                      <strong>Free Shipping:</strong> All prepaid and eligible orders with a subtotal of <strong>{freeThresholdStr} or higher</strong> receive 100% complimentary standard domestic shipping.
                    </li>
                    <li>
                      <strong>Standard Shipping Fee:</strong> Orders below {freeThresholdStr} incur a flat delivery charge of <strong>{standardFeeStr}</strong>, clearly itemized at checkout.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-heading text-base font-semibold text-brand-dark mb-1.5">
                    3. Processing & Transit Timelines
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-4 rounded-xl bg-brand-light/30 border border-brand-border/60 space-y-1">
                      <div className="flex items-center gap-2 text-brand-dark font-semibold text-xs uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-brand-gold" />
                        <span>Order Processing</span>
                      </div>
                      <p className="text-xs text-brand-muted">
                        1 to 2 business days (orders placed on Sundays or national holidays are packed on the following business morning).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-brand-light/30 border border-brand-border/60 space-y-1">
                      <div className="flex items-center gap-2 text-brand-dark font-semibold text-xs uppercase tracking-wider">
                        <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                        <span>Transit Time</span>
                      </div>
                      <p className="text-xs text-brand-muted">
                        Metro cities: 3 to 5 business days. Non-metro and regional areas: 4 to 7 business days.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-heading text-base font-semibold text-brand-dark mb-1.5">
                    4. Shipment Tracking
                  </h3>
                  <p>
                    Once your order is handed over to our delivery partner, an automated dispatch notification is sent to your registered email containing the courier partner name and unique tracking consignment number. You can also view live tracking updates on your Account Orders page.
                  </p>
                </div>
              </div>
            </div>

            {/* PART B: RETURNS & EXCHANGES */}
            <div className="rounded-2xl border border-brand-border/80 bg-white p-8 sm:p-10 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-brand-border/60">
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-brand-dark">
                    Returns & Exchange Policy
                  </h2>
                  <p className="text-xs text-brand-muted">
                    Eligibility, condition criteria, and customer initiation process
                  </p>
                </div>
              </div>

              <div className="space-y-6 text-sm text-brand-muted leading-relaxed">
                <div>
                  <h3 className="font-heading text-base font-semibold text-brand-dark mb-1.5">
                    1. Return Window
                  </h3>
                  <p>
                    We want you to be completely delighted with your purchase. You may request a return or exchange within <strong>{`${returnDays} calendar days`}</strong> from the official courier delivery confirmation date.
                  </p>
                </div>

                <div>
                  <h3 className="font-heading text-base font-semibold text-brand-dark mb-2">
                    2. Garment Eligibility Criteria
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Item must be completely unworn, unwashed, and unaltered.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>All original designer tags, barcodes, and woven labels must remain intact and securely attached.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>The item must be returned in its original protective packaging.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>Items showing makeup stains, perfume scent, pet hair, or signs of wear cannot be accepted and will be returned to the customer.</span>
                    </div>
                  </div>
                </div>

                {/* Return Initiation Process (No self-service portal yet) */}
                <div className="p-5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3">
                  <h3 className="font-heading text-base font-semibold text-amber-900">
                    3. How to Initiate a Return (Current Process)
                  </h3>
                  <p className="text-xs text-amber-900/90 leading-relaxed">
                    Velaash currently operates assisted customer support for all returns (there is no automated self-service return portal at this time). Please follow these steps to initiate your request:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-amber-950 font-medium pl-1">
                    <li>Contact our support team on WhatsApp at <strong>{whatsappNum}</strong> or email <strong>{contactEmail}</strong>.</li>
                    <li>Quote your <strong>Order Number</strong> (e.g. ORD-2026-XXXX) and mention whether you require a size exchange or return.</li>
                    <li>Attach a clear photo of the garment showing attached brand tags.</li>
                    <li>Our team will arrange a doorstep reverse-pickup via our courier partner or provide a return consignment label.</li>
                  </ol>
                </div>

                {/* Client Policy Description (from site_settings) */}
                {returnsPolicy.policy_description && (
                  <div className="p-4 rounded-xl bg-brand-light/30 border border-brand-border/60 space-y-1.5">
                    <span className="text-[11px] font-bold text-brand-dark uppercase tracking-wider block">
                      Specific Policy Note
                    </span>
                    <p className="text-xs text-brand-muted leading-relaxed whitespace-pre-line">
                      {returnsPolicy.policy_description}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-heading text-base font-semibold text-brand-dark mb-1.5">
                    4. Inspection & Refund Timeline
                  </h3>
                  <p>
                    Once the returned garment is received at our facility and passes physical inspection (typically within 2 business days of arrival), your refund is approved. Refunds are credited back to your original payment method (or direct NEFT / UPI bank transfer for COD orders) within <strong>5 to 7 business days</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Need Assistance Banner */}
            <div className="rounded-2xl border border-brand-border/60 bg-brand-cream/30 p-8 text-center space-y-4">
              <h3 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                Questions About Your Shipment or Return?
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted max-w-md mx-auto leading-relaxed">
                Our customer care team is available to assist via WhatsApp or email, typically responding within 24 hours.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Care ({whatsappNum})</span>
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-brand-dark/20 text-brand-dark text-xs font-semibold uppercase tracking-wider hover:bg-brand-cream/60 transition-colors"
                >
                  <span>Submit an Inquiry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
