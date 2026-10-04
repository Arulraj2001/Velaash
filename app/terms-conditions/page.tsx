import { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeaderBanner } from "@/components/ui";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import { getStoreContact } from "@/features/settings";
import {
  AlertCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  Truck,
  RotateCcw,
  Scale,
  FileText,
  UserCheck,
  PackageCheck,
  HelpCircle,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const brandName = settings.storeProfile.name || "Velaash";
  const title = `Terms & Conditions | ${brandName}`;
  const description =
    "Read our official Terms and Conditions governing website usage, product ordering, Razorpay and COD payment terms, and legal jurisdiction.";

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

export default async function TermsConditionsPage() {
  const settings = await getSiteSettings();
  const { storeProfile, shippingPolicy, returnsPolicy, paymentSettings, taxSettings } = settings;

  const legalName = storeProfile.legal_name || "VELAASH TRADER'S";
  const storeName = storeProfile.name || "Velaash";
  const { email: contactEmail, whatsappNumber: contactPhone, whatsappUrl } =
    getStoreContact(storeProfile);

  const freeShippingThreshold = `₹${shippingPolicy.free_shipping_threshold.toLocaleString("en-IN")}`;
  const returnWindowDays = returnsPolicy.return_window_days;
  const razorpayEnabled = paymentSettings.razorpay_enabled;
  const codEnabled = paymentSettings.cod_enabled;
  const codMaxVal = `₹${paymentSettings.cod_max_order_value.toLocaleString("en-IN")}`;
  const codFee = `₹${paymentSettings.cod_handling_fee.toLocaleString("en-IN")}`;

  const gstEnabled = taxSettings.gst_enabled;
  const gstin = taxSettings.gstin;
  const gstStatement = gstEnabled
    ? `All prices are in Indian Rupees (INR), inclusive of applicable GST.${gstin ? ` GSTIN: ${gstin}` : ""}`
    : "All prices are in Indian Rupees (INR). GST is not currently applicable to purchases from Velaash.";

  const lastUpdated = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="min-h-screen bg-brand-cream/40 font-sans pb-24">
      {/* 1. Universal Page Header Banner */}
      <PageHeaderBanner
        badge="Store Agreements & Terms of Service"
        title="Terms & Conditions"
        description="Official commercial terms, user responsibilities, purchase guidelines, and domestic transaction agreements for shopping with Velaash."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Terms & Conditions" },
        ]}
        extraMeta={
          <p className="text-xs text-brand-muted flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-gold" />
            <span>Last Updated: {lastUpdated}</span>
          </p>
        }
      />

      {/* 2. Prominent Legal Review Notice Box */}
      <section className="py-6 border-b border-amber-200/80 bg-amber-50/60">
        <Container size="xl">
          <div className="max-w-3xl mx-auto rounded-xl border border-amber-300 bg-amber-50 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-950 leading-relaxed space-y-1">
              <p className="font-semibold text-amber-900">
                Notice: Draft Template for Legal Review
              </p>
              <p>
                This policy is a general template and should be reviewed by a qualified legal
                professional to ensure compliance with applicable Indian e-commerce and data
                protection regulations before relying on it as a final legal document.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. Main Terms Content */}
      <section className="py-12 sm:py-16">
        <Container size="xl">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Section 1: Acceptance of Terms */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  1. Acceptance of Terms
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;Customer&quot;, &quot;User&quot;, &quot;you&quot;) and <strong>{legalName}</strong> (&quot;Velaash&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a sole proprietorship registered in Tamil Nadu, India, governing your access to and use of the <strong>{storeName}</strong> website and services.
                </p>
                <p>
                  By accessing, browsing, registering an account, or placing an order on our platform, you confirm that you have read, understood, and agreed to be bound by these Terms, as well as our <Link href="/privacy-policy" className="text-brand-accent hover:underline font-medium">Privacy Policy</Link> and <Link href="/shipping-returns" className="text-brand-accent hover:underline font-medium">Shipping &amp; Returns Policy</Link>. If you do not agree with any part of these Terms, you must discontinue use of the platform immediately.
                </p>
              </div>
            </article>

            {/* Section 2: Eligibility & Account Registration */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  2. Eligibility &amp; Account Registration
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  <strong>Age Requirements:</strong> You must be at least 18 years of age, or possess legal parental or guardian authorization, to transact on this site under the Indian Contract Act, 1872.
                </p>
                <p>
                  <strong>Passwordless Authentication:</strong> To simplify security, customer account access is passwordless. When logging in, we dispatch a secure 6-digit One-Time Password (OTP) to your registered email address. You are solely responsible for safeguarding access to your email inbox and for all activities carried out under your authenticated account.
                </p>
                <p>
                  <strong>Accurate Information:</strong> You agree to provide true, accurate, and current information during registration and checkout. Impersonation of another person or use of false identities is strictly prohibited.
                </p>
              </div>
            </article>

            {/* Section 3: Product Descriptions, Pricing & Availability */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  3. Product Descriptions, Pricing &amp; Availability
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  <strong>Garment Imagery &amp; Sizing:</strong> We endeavor to display garment silhouettes, embroidery, fabric textures, and colors as accurately as possible. However, actual fabric hues may exhibit slight variations based on monitor calibration and ambient lighting. We encourage checking our comprehensive size charts on each product detail page before selecting a size.
                </p>
                <p>
                  <strong>Currency &amp; Taxes:</strong> {gstStatement}
                </p>
                <p>
                  <strong>Price Revisions &amp; Stock Availability:</strong> Product prices, promotions, and inventory availability are subject to change without prior notice. An order is finalized only upon our generation of an official Order Confirmation email with a designated Order Reference (e.g. ORD-2026-XXXX). In the rare event that an item becomes unavailable following order placement, we will promptly notify you and process a full refund.
                </p>
              </div>
            </article>

            {/* Section 4: Orders & Payment Terms */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  4. Orders &amp; Payment Methods
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  We offer secure payment channels through RBI-authorized payment infrastructure:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-1">
                  <li>
                    <strong>Online Payment (Razorpay):</strong>{" "}
                    {razorpayEnabled ? (
                      <>We accept UPI (Google Pay, PhonePe, Paytm), Credit and Debit Cards (Visa, Mastercard, RuPay), and Net Banking via Razorpay. Your payment is authorized upon order checkout.</>
                    ) : (
                      <>Online payment via Razorpay is currently inactive in store settings.</>
                    )}
                  </li>
                  <li>
                    <strong>Cash on Delivery (COD):</strong>{" "}
                    {codEnabled ? (
                      <>
                        COD is available for eligible domestic orders up to a maximum order value of <strong>{codMaxVal}</strong>. A nominal handling fee of <strong>{codFee}</strong> applies to COD orders at checkout. Payment must be rendered in full cash to the delivery carrier upon parcel handover.
                      </>
                    ) : (
                      <>Cash on Delivery is currently disabled in our store settings.</>
                    )}
                  </li>
                </ul>
                <p>
                  <strong>Order Verification &amp; Cancellation by Store:</strong> Velaash reserves the right to decline or cancel any order in instances of suspected fraudulent transactions, unauthorized payment attempts, incorrect pricing displays caused by technical errors, or non-serviceable destination PIN codes.
                </p>
              </div>
            </article>

            {/* Section 5: Shipping & Delivery Policy */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <Truck className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  5. Shipping &amp; Delivery Terms
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  <strong>Pan-India Domestic Delivery:</strong> We currently fulfill orders exclusively across serviceable postal PIN codes within the Republic of India. International shipping is not offered at this time.
                </p>
                <p>
                  <strong>Complimentary Shipping:</strong> Domestic orders meeting or exceeding <strong>{freeShippingThreshold}</strong> qualify for complimentary standard shipping. Orders below this threshold incur our standard flat shipping fee, clearly itemized prior to payment.
                </p>
                <p>
                  <strong>Policy Incorporation:</strong> Full shipping timelines, processing windows (1 to 2 business days), and courier tracking terms are governed by our canonical <Link href="/shipping-returns" className="text-brand-accent hover:underline font-medium">Shipping &amp; Returns Policy</Link>, which is incorporated by reference herein.
                </p>
              </div>
            </article>

            {/* Section 6: Cancellations, Returns & Refunds */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  6. Cancellations, Returns &amp; Refunds
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  <strong>Order Cancellation:</strong> You may cancel an order directly from your <Link href="/account/orders" className="text-brand-accent hover:underline font-medium">Account Orders</Link> dashboard as long as its status remains &quot;Confirmed&quot;. Once an order transitions to warehouse dispatch or courier transit, cancellations cannot be accepted mid-route; you may instead request a return following delivery.
                </p>
                <p>
                  <strong>Strict 7-Day Return Window:</strong> All return, exchange, or replacement requests must be registered within strictly <strong>7 calendar days</strong> from the official courier delivery confirmation date. Requests received beyond this 7-day window cannot be processed.
                </p>
                <p>
                  <strong>Mandatory Unboxing Video:</strong> To qualify for return, exchange, replacement, or damage claims, customers must provide a <strong>clear, continuous, and uncut video recording</strong> of the parcel opening. The video must start prior to opening the box/courier bag, showing the sealed packaging, intact shipping label with tracking details, brand tags attached, and the condition or defect being reported. Claims submitted without an uncut unboxing video cannot be approved.
                </p>
                <p>
                  <strong>Decision (Replacement vs. Refund):</strong> Following verification of the customer&apos;s unboxing video and subsequent physical quality inspection of the received product at our fulfillment facility (confirming it is unworn, unwashed, and retaining original tags and packaging), Velaash reserves the right to determine whether an approved claim is fulfilled via <strong>replacement</strong> (dispatching an identical replacement item) or <strong>refund</strong> (credited to the original payment source or via bank transfer for COD within 5 to 7 business days).
                </p>
                <p>
                  Please review our canonical <Link href="/shipping-returns" className="text-brand-accent hover:underline font-medium">Shipping &amp; Returns Policy</Link> for detailed inspection criteria and initiation steps.
                </p>
              </div>
            </article>

            {/* Section 7: Intellectual Property */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  7. Intellectual Property Rights
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  All content published on this website—including but not limited to the Velaash brand name, trademarks, garment designs, product photography, editorial text, logos, graphics, and code—is the proprietary property of <strong>{legalName}</strong> and protected under Indian copyright, trademark, and intellectual property statutes.
                </p>
                <p>
                  You are granted a limited, non-exclusive license to browse the site and place personal retail orders. You may not copy, scrape, reproduce, republish, distribute, reverse engineer, or commercially exploit any material from this website without explicit prior written authorization from {legalName}.
                </p>
              </div>
            </article>

            {/* Section 8: Limitation of Liability */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <Scale className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  8. Limitation of Liability &amp; Disclaimers
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  This website and all products and services offered are provided on an &quot;as is&quot; and &quot;as available&quot; basis. Velaash disclaims all warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, or non-infringement.
                </p>
                <p>
                  To the maximum extent permitted by applicable Indian law, {legalName} and its affiliates shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from the use or inability to use the platform, server interruptions, or courier transit delays caused by force majeure events (strikes, weather disruptions, natural disasters, or statutory transport restrictions). In all events, our total aggregate liability shall not exceed the net purchase amount paid by you for the specific order giving rise to the claim.
                </p>
              </div>
            </article>

            {/* Section 9: Governing Law & Jurisdiction */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <Scale className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  9. Governing Law &amp; Jurisdiction
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  These Terms and Conditions shall be governed by, interpreted, and construed strictly in accordance with the laws of the Republic of India, without regard to its conflict of law principles.
                </p>
                <p>
                  Any legal dispute, controversy, or claim arising out of or relating to your use of this site, purchases made on Velaash, or these Terms shall be subject to the exclusive jurisdiction of the competent civil courts located in <strong>Tamil Nadu, India</strong>.
                </p>
              </div>
            </article>

            {/* Section 10: Amendments to Terms */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <Clock className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  10. Modifications to Terms
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  We reserve the right to revise or modify these Terms at any time. Any changes will become effective immediately upon being published on this page. Your continued use of the website following the posting of amended Terms constitutes your constructive acceptance of the revisions.
                </p>
              </div>
            </article>

            {/* Section 11: Contact & Grievance Information */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  11. Contact &amp; Grievance Redressal
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  If you have any questions, clarifications, or complaints regarding these Terms, please reach out to our Customer Service and Grievance Desk:
                </p>
                <div className="p-4 rounded-xl bg-brand-light/30 border border-brand-border/60 space-y-2 text-xs text-brand-dark">
                  <p><strong>Operating Business Entity:</strong> {legalName}</p>
                  <p><strong>Store Name:</strong> {storeName}</p>
                  <p><strong>Customer Service Email:</strong> <a href={`mailto:${contactEmail}`} className="text-brand-accent hover:underline font-medium">{contactEmail}</a></p>
                  <p><strong>WhatsApp Support:</strong> <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline font-medium">{contactPhone}</a></p>
                  <p><strong>Registered Jurisdiction:</strong> Tamil Nadu, Republic of India</p>
                </div>
              </div>
            </article>

            {/* Navigation back to other store policies */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-brand-muted border-t border-brand-border/60">
              <Link href="/privacy-policy" className="hover:text-brand-accent underline">
                &larr; View Privacy Policy
              </Link>
              <Link href="/shipping-returns" className="hover:text-brand-accent underline">
                View Shipping &amp; Returns Policy &rarr;
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
