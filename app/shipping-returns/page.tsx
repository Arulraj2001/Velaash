import { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeaderBanner } from "@/components/ui";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import { getStoreContact } from "@/features/settings";
import {
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  ShieldAlert,
  ArrowRight,
  Video,
  FileCheck2,
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
  const { whatsappNumber: whatsappNum, whatsappUrl, email: contactEmail } =
    getStoreContact(storeProfile);
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

            {/* PART B: RETURNS, REPLACEMENT & REFUND POLICY */}
            <div className="rounded-2xl border border-brand-border/80 bg-white p-8 sm:p-10 shadow-xs space-y-8">
              <div className="flex items-center gap-3 pb-3 border-b border-brand-border/60">
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-brand-dark">
                    Returns, Replacement &amp; Refund Policy
                  </h2>
                  <p className="text-xs text-brand-muted">
                    Strict 7-day return window, mandatory video requirement, and quality inspection guidelines
                  </p>
                </div>
              </div>

              <div className="space-y-7 text-sm text-brand-muted leading-relaxed">
                {/* 1. Return Window */}
                <div>
                  <h3 className="font-heading text-base font-semibold text-brand-dark mb-1.5 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-gold" />
                    <span>1. 7-Day Return Window</span>
                  </h3>
                  <p>
                    All return, exchange, or replacement requests must be initiated within strictly <strong>7 calendar days</strong> from the official date and timestamp of delivery confirmed by our courier partner. Requests raised after this 7-day period will not be eligible for return or refund.
                  </p>
                </div>

                {/* 2. Mandatory Unboxing Video Callout */}
                <div className="p-6 rounded-xl bg-amber-50/70 border border-amber-300/80 space-y-3.5 shadow-2xs">
                  <div className="flex items-center gap-2.5 text-amber-950 font-heading font-semibold text-base">
                    <Video className="w-5 h-5 text-amber-700 shrink-0" />
                    <span>2. Mandatory Unboxing &amp; Product Video Requirement</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-950/90 leading-relaxed">
                    To ensure complete authenticity and fair evaluation for both customers and our team, a <strong>clear, uncut, continuous video recording</strong> of the parcel opening and product inspection is <strong>strictly mandatory</strong> for all return, replacement, defect, or damage claims.
                  </p>
                  <div className="bg-white/90 rounded-lg p-4 border border-amber-200/80 space-y-2 text-xs text-amber-950">
                    <p className="font-semibold text-amber-900">Your video must clearly show:</p>
                    <ul className="list-disc list-inside space-y-1.5 pl-1">
                      <li>The <strong>unopened outer shipping package</strong> from all angles, with the courier shipping label and tracking number clearly visible and readable.</li>
                      <li>The <strong>entire unboxing process</strong> in one single, continuous, unedited take (videos that are paused, cut, edited, or recorded after opening the parcel will not be accepted).</li>
                      <li>The <strong>product being taken out</strong>, showing all brand tags, barcode labels, and packaging intact.</li>
                      <li>A clear, close-up view of the <strong>exact damage, defect, or incorrect item</strong> being reported.</li>
                    </ul>
                  </div>
                  <p className="text-[11px] text-amber-900/80 italic">
                    ⚠️ Note: Requests submitted without a valid, uncut unboxing video cannot be approved for return, replacement, or refund.
                  </p>
                </div>

                {/* 3. Product Condition & Eligibility */}
                <div>
                  <h3 className="font-heading text-base font-semibold text-brand-dark mb-2.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>3. Product Condition Criteria</span>
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Unworn &amp; Unwashed:</strong> The product must be completely unused, unwashed, unaltered, and free from any signs of wear.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Tags &amp; Labels Intact:</strong> Original brand tags, security tags, barcode labels, and woven tags must remain securely attached in their original condition.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Original Packaging:</strong> The merchandise must be returned inside its original protective polybag, box, and brand packaging.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span><strong>Disqualification:</strong> Products with perfume or deodorant scents, makeup stains, body odor, pet hair, wash marks, or detached tags fail inspection and will be returned to the customer without a refund.</span>
                    </div>
                  </div>
                </div>

                {/* 4. Decision: Refund vs. Replacement */}
                <div className="p-5 rounded-xl bg-brand-light/30 border border-brand-border/70 space-y-3">
                  <h3 className="font-heading text-base font-semibold text-brand-dark flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-brand-gold" />
                    <span>4. Dual Inspection &amp; Final Resolution Decision (Refund or Replacement)</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                    Once your return request is logged and the physical package reaches our fulfillment facility, our Quality Assurance team conducts a thorough <strong>two-step verification</strong>:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-brand-dark font-medium pl-1">
                    <li>Verification of the initial unboxing video submitted by the customer.</li>
                    <li>Physical hands-on inspection of the received product condition at our warehouse.</li>
                  </ol>
                  <p className="text-xs sm:text-sm text-brand-muted leading-relaxed pt-1">
                    <strong>Upon satisfactory evaluation of both the video and the received product condition, Velaash will decide whether to provide a replacement or a refund:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-brand-dark pl-2">
                    <li>
                      <strong>Replacement:</strong> If the product is defective, damaged in transit, or the wrong item was sent, a fresh replacement piece will be dispatched promptly at no additional shipping fee (subject to stock availability).
                    </li>
                    <li>
                      <strong>Refund:</strong> If an identical replacement is unavailable or if the customer prefers a refund following a verified valid claim, a refund will be issued to the original payment source (Credit/Debit Card, UPI, NetBanking via Razorpay) or direct NEFT/UPI bank transfer for Cash on Delivery (COD) orders within <strong>5 to 7 business days</strong> of physical inspection approval.
                    </li>
                    <li>
                      <strong>Rejection:</strong> If the physically received product does not match the unboxing video, shows signs of usage, or fails our condition criteria, the claim will be rejected and the product returned to the customer.
                    </li>
                  </ul>
                </div>

                {/* 5. How to Initiate a Return */}
                <div className="p-5 rounded-xl bg-brand-cream/60 border border-brand-border/80 space-y-3">
                  <h3 className="font-heading text-base font-semibold text-brand-dark flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-700" />
                    <span>5. How to Initiate Your Request</span>
                  </h3>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Please follow these simple steps within <strong>7 days of delivery</strong>:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-brand-dark font-medium pl-1">
                    <li>
                      Contact our support team on WhatsApp at <strong>{whatsappNum}</strong> or email <strong>{contactEmail}</strong>.
                    </li>
                    <li>
                      Provide your <strong>Order Number</strong> (e.g., ORD-2026-XXXX) and your registered contact details.
                    </li>
                    <li>
                      Attach your <strong>clear unboxing video</strong> along with photos showing the issue and intact tags.
                    </li>
                    <li>
                      Our team will evaluate the video within 24 hours and arrange a convenient doorstep reverse-pickup via our courier partner.
                    </li>
                  </ol>
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
                  href={whatsappUrl}
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
