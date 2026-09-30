import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { getSiteSettings } from "@/features/settings/queries/get-site-settings";
import {
  ShieldAlert,
  Lock,
  CreditCard,
  Database,
  Mail,
  Cookie,
  UserCheck,
  AlertCircle,
  FileText,
  Clock,
  MapPin,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { CookiePreferencesButton } from "@/features/analytics";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const brandName = settings.storeProfile.name || "Velaash";
  const title = `Privacy Policy | ${brandName}`;
  const description =
    "Read our transparent privacy practices detailing personal data collection, Razorpay payment security, Supabase storage, and your rights.";

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

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  const { storeProfile, paymentSettings, taxSettings } = settings;

  const legalName = storeProfile.legal_name || "VELAASH TRADER'S";
  const storeName = storeProfile.name || "Velaash";
  const contactEmail = storeProfile.email || "bestrchandra@gmail.com";
  const contactPhone = storeProfile.whatsapp_number || storeProfile.phone || "+91 8508643832";
  const cleanPhone = contactPhone.replace(/[^0-9]/g, "");

  const gstEnabled = taxSettings.gst_enabled;
  const invoiceType = gstEnabled ? "tax invoices" : "invoices and bills of supply";

  // Check which analytics tools are actively configured via environment variables
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || "";
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() || "";

  const analyticsTools = [
    {
      id: "ga4",
      name: "Google Analytics 4 (GA4)",
      configured: Boolean(ga4Id),
      badgeText: ga4Id ? "Configured (Active Opt-In)" : "Not Configured in this Deployment",
      purpose: "Aggregated page views, traffic sources, and standard e-commerce interaction metrics.",
      details:
        "Measures page views, session duration, device types, and standard shopping journey events (viewing products, adding items to cart, proceeding to checkout, order purchases). Helps us optimize platform performance, monitor site reliability, and ensure popular apparel remains in stock.",
    },
    {
      id: "meta_pixel",
      name: "Meta Pixel",
      configured: Boolean(pixelId),
      badgeText: pixelId ? "Configured (Active Opt-In)" : "Not Configured in this Deployment",
      purpose: "Digital marketing campaign attribution and conversion measurement on Meta platforms.",
      details:
        "Evaluates the effectiveness of digital advertisements across Instagram and Facebook. Tracks conversion milestones so we can deliver tailored garment announcements to interested shoppers without transferring personal banking, cardholder, or address data to Meta.",
    },
    {
      id: "clarity",
      name: "Microsoft Clarity",
      configured: Boolean(clarityId),
      badgeText: clarityId ? "Configured (Active Opt-In)" : "Not Configured in this Deployment",
      purpose: "Visual heatmaps, scroll depth tracking, and anonymous session replays.",
      details:
        "Provides visual heatmaps and anonymized interaction replays to help our development team identify usability friction points, layout bugs, and navigation roadblocks. Sensitive text inputs (passwords, phone numbers, delivery addresses) are masked client-side and never recorded.",
    },
  ];

  const lastUpdated = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <main className="min-h-screen bg-brand-light/20 font-sans pb-24">
      {/* 1. Header Banner */}
      <section className="bg-brand-cream/40 border-b border-brand-border/60 py-14 sm:py-20">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
              Legal Transparency & Data Protection
            </span>
            <h1 className="font-heading text-3xl sm:text-5xl font-semibold text-brand-dark tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted flex items-center justify-center gap-1.5 pt-1">
              <Clock className="w-3.5 h-3.5 text-brand-gold" />
              <span>Last Updated: {lastUpdated}</span>
            </p>
          </div>
        </Container>
      </section>

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

      {/* 3. Main Policy Content */}
      <section className="py-12 sm:py-16">
        <Container size="xl">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Section 1: Introduction & Identity */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  1. Introduction & Operating Entity
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  Welcome to <strong>{storeName}</strong>, operated by <strong>{legalName}</strong> (&quot;Velaash&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a sole proprietorship registered in Tamil Nadu, India.
                </p>
                <p>
                  We respect your privacy and are committed to safeguarding your personal data in accordance with applicable Indian legal standards, including the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023 (DPDP Act) framework.
                </p>
                <p>
                  This Privacy Policy describes what personal information we collect through our website, why we collect it, how it is secured, and your rights regarding your data.
                </p>
              </div>
            </article>

            {/* Section 2: Information We Collect */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <Database className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  2. Information We Collect
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  We strictly collect only the personal information essential for fulfilling your orders, delivering customer service, and providing secure account access:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-1 text-brand-dark">
                  <li>
                    <strong>Customer Identity & Contact Information:</strong> Full name, email address, and mobile phone number provided when registering an account, requesting a passwordless sign-in OTP, placing an order, or submitting an inquiry via our contact form.
                  </li>
                  <li>
                    <strong>Delivery & Billing Addresses:</strong> Street address lines, city, state, postal PIN code, and recipient phone number entered during checkout or saved within your Account Addresses portal.
                  </li>
                  <li>
                    <strong>Order & Fulfillment History:</strong> Unique order numbers (e.g. ORD-2026-XXXX), line items purchased, garment sizes, prices, order dates, payment statuses, and courier tracking details.
                  </li>
                  <li>
                    <strong>Local Shopping Bag (Browser LocalStorage):</strong> Cart contents (selected product variant IDs, quantities, and chosen sizes) are stored directly on your personal device within your browser&apos;s <code className="text-[11px] bg-brand-light/60 px-1 py-0.5 rounded">localStorage</code>. Guest cart contents remain on your machine and are not recorded in a server-side profile until you proceed to checkout.
                  </li>
                </ul>
                <div className="p-3.5 rounded-xl bg-brand-light/30 border border-brand-border/60 text-xs">
                  <strong>What We Do NOT Collect:</strong> We do not collect biometric data, government identification numbers (Aadhaar/PAN for shoppers), cross-site behavioral telemetry, or social security details.
                </div>
              </div>
            </article>

            {/* Section 3: How We Use Your Information */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  3. How We Use Your Information
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>We process your personal information exclusively for lawful, legitimate purposes:</p>
                <ul className="list-disc list-inside space-y-1.5 pl-1">
                  <li><strong>Order Processing & Dispatch:</strong> Verifying order contents, printing domestic shipping labels, and handing packages over to courier partners for delivery across India.</li>
                  <li><strong>Essential Transactional Communications:</strong> Sending automated order confirmations, passwordless login access codes, tracking numbers, and payment status receipts via email.</li>
                  <li><strong>Customer Support Assistance:</strong> Answering sizing, exchange, or return inquiries initiated by you through email, WhatsApp, or our contact form.</li>
                  <li><strong>Statutory &amp; Financial Records:</strong> Retaining mandatory accounting records, {invoiceType}, and financial audit records as required under applicable Indian commercial, taxation, and auditing laws.</li>
                </ul>
              </div>
            </article>

            {/* Section 4: Payment Processing & Zero Card Storage */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  4. Payment Processing &amp; Zero Card Storage
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                {paymentSettings.razorpay_enabled && (
                  <p>
                    All online payments on {storeName} are securely processed through <strong>Razorpay</strong> (Razorpay Software Private Limited), an RBI-authorized payment aggregator supporting UPI, Credit and Debit Cards (Visa, Mastercard, RuPay), and Net Banking.
                  </p>
                )}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5">
                  <p className="font-semibold text-xs sm:text-sm text-emerald-900 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-700" />
                    Zero Storage of Sensitive Cardholder Data
                  </p>
                  <p className="text-xs">
                    Velaash does NOT capture, collect, or store your credit or debit card numbers, CVVs, expiry dates, netbanking passwords, or UPI PINs. All cardholder interactions take place exclusively within Razorpay&apos;s encrypted, PCI-DSS Level 1 compliant checkout modal.
                  </p>
                </div>
                <p>
                  Our database only receives and stores non-sensitive transaction tokens (such as <code className="text-[11px] bg-brand-light/60 px-1 py-0.5 rounded">razorpay_order_id</code>, <code className="text-[11px] bg-brand-light/60 px-1 py-0.5 rounded">razorpay_payment_id</code>, and payment status) for the sole purpose of reconciling your order.
                </p>
                {paymentSettings.cod_enabled && (
                  <p>
                    For eligible Cash on Delivery (COD) orders, payment is made in physical cash directly to the courier delivery executive upon doorstep parcel handover.
                  </p>
                )}
              </div>
            </article>

            {/* Section 5: Data Storage & Infrastructure Security */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <Lock className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  5. Data Storage & Infrastructure Security
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  Our operational database is hosted on <strong>Supabase</strong> (managed PostgreSQL cloud infrastructure). We employ appropriate administrative and technical safeguards to secure your personal data:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-1">
                  <li><strong>Encryption in Transit:</strong> All communication between your browser and our servers is secured using modern Transport Layer Security (TLS / HTTPS).</li>
                  <li><strong>Database Row-Level Security (RLS):</strong> Our database enforces fine-grained Row-Level Security policies ensuring that authenticated customers can only query and modify their own addresses and orders.</li>
                  <li><strong>Parameterized Ingestion:</strong> All database operations utilize parameterized queries through our Supabase client to protect against injection attacks.</li>
                </ul>
                <p className="text-xs text-brand-muted/80">
                  Note: While we maintain diligent safeguards, no method of transmission over the Internet or electronic storage is completely infallible. We encourage users to maintain security over their registered email accounts.
                </p>
              </div>
            </article>

            {/* Section 6: Third-Party Service Providers */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <Mail className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  6. Third-Party Service Providers
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  We share your data only with vetted third-party service providers essential for store operations:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-1">
                  <li><strong>Razorpay:</strong> Facilitates authorized online payment processing and payment refunds.</li>
                  <li><strong>Resend:</strong> Provides transactional email delivery infrastructure for sending order receipts, dispatch updates, and account OTP authentication codes.</li>
                  <li><strong>Domestic Logistics Partners:</strong> When your order is packed, recipient shipping details (name, delivery address, postal PIN code, contact phone) are shared with licensed domestic courier carriers for physical package transportation and doorstep delivery across India. Automated shipping partner integrations (e.g. Shiprocket) are planned for future logistics automation; courier consignments are currently managed directly with licensed domestic couriers.</li>
                </ul>
                <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border/60 text-xs font-medium text-brand-dark">
                  <strong>Zero Sale of Personal Data:</strong> We do NOT sell, rent, monetize, or trade your personal information to third-party data brokers, marketers, or advertisers.
                </div>
              </div>
            </article>

            {/* Section 7: Cookies & Tracking Technologies */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <Cookie className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  7. Cookies &amp; Tracking Technologies
                </h2>
              </div>
              <div className="space-y-4 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  At Velaash, we believe in transparent, consent-first technology. We classify client-side storage and cookies into two distinct tiers: essential functionality and optional web analytics.
                </p>

                {/* Sub-tier 1: Essential Cookies */}
                <div className="rounded-xl border border-brand-border/70 bg-brand-light/20 p-4 space-y-2">
                  <h3 className="font-semibold text-brand-dark text-xs sm:text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Essential Functional Storage (Always Active)
                  </h3>
                  <p className="text-xs text-brand-muted">
                    These storage items are strictly necessary for the core security and functionality of the store. They do not track you across other websites:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-brand-muted pl-1">
                    <li>
                      <strong>Authentication Session Cookies:</strong> Secure, HTTP-only tokens issued by Supabase Auth (<code className="text-[11px] bg-brand-light/60 px-1 py-0.5 rounded">sb-*-auth-token</code>) strictly to maintain your logged-in customer session.
                    </li>
                    <li>
                      <strong>Shopping Bag (LocalStorage):</strong> Preserves your chosen garment sizes, quantities, and active items in your browser so your bag does not vanish when browsing different pages.
                    </li>
                    <li>
                      <strong>Cookie Consent Choice:</strong> Stored in <code className="text-[11px] bg-brand-light/60 px-1 py-0.5 rounded">localStorage</code> under <code className="text-[11px] bg-brand-light/60 px-1 py-0.5 rounded">velaash_cookie_consent</code> to remember whether you selected &quot;Accept All&quot; or &quot;Essential Only&quot;.
                    </li>
                  </ul>
                </div>

                {/* Sub-tier 2: Optional Analytics & Attribution */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-brand-dark text-xs sm:text-sm flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-brand-accent shrink-0" />
                    Web Analytics &amp; Performance Tools (Strictly Consent-Gated)
                  </h3>
                  <p className="text-xs text-brand-muted">
                    We deploy web analytics, ad attribution, and diagnostic heatmaps only to improve site speed and tailor our collections. <strong>Zero tracking scripts are loaded on initial visit without your permission.</strong> If you select &quot;Essential Only&quot; or reject optional cookies, these scripts are completely omitted from your browser session.
                  </p>

                  <div className="grid grid-cols-1 gap-3 pt-1">
                    {analyticsTools.map((tool) => (
                      <div
                        key={tool.id}
                        className="rounded-xl border border-brand-border/60 bg-white p-4 space-y-1.5 shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-xs sm:text-sm text-brand-dark">
                            {tool.name}
                          </span>
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              tool.configured
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                            }`}
                          >
                            {tool.badgeText}
                          </span>
                        </div>
                        <p className="text-xs text-brand-dark/90 font-medium">
                          {tool.purpose}
                        </p>
                        <p className="text-[11px] sm:text-xs text-brand-muted leading-relaxed">
                          {tool.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-tier 3: Consent Management */}
                <div className="rounded-xl border border-brand-accent/20 bg-brand-light/30 p-4 space-y-2.5">
                  <h4 className="font-semibold text-brand-dark text-xs sm:text-sm">
                    How to Manage or Change Your Cookie Preferences
                  </h4>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    You have complete control over whether analytics tools run during your visits. You can revisit and change your consent choice at any time. Simply click the button below or the permanent <strong>Cookie Preferences</strong> link in the website footer on any page:
                  </p>
                  <div>
                    <CookiePreferencesButton
                      showIcon={true}
                      label="Manage Cookie & Analytics Preferences"
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-accent-deep focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  </div>
                </div>

                {/* Commitment */}
                <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-border/60 text-xs font-medium text-brand-dark">
                  <strong>Zero Sale of Personal Data:</strong> We never sell, rent, monetize, or trade your personal data, shopping interactions, or browsing behavior to third-party data brokers or marketing aggregators.
                </div>
              </div>
            </article>

            {/* Section 8: Your Rights & Choices */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  8. Your Rights & Data Choices
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>As a customer, you hold the following rights regarding your personal information:</p>
                <ul className="list-disc list-inside space-y-1.5 pl-1">
                  <li><strong>Access & Review:</strong> You can review your profile email, order history, and saved addresses anytime by logging into your account (<Link href="/account" className="text-brand-accent hover:underline font-medium">/account</Link>).</li>
                  <li><strong>Address Updates:</strong> You can add, edit, or delete delivery addresses at any time via your <Link href="/account/addresses" className="text-brand-accent hover:underline font-medium">Saved Addresses</Link> dashboard.</li>
                  <li><strong>Account &amp; Data Deletion Requests:</strong> While self-service account deletion is not currently built into the account portal, you may request deletion of your account and associated personal data by writing to our support team at <a href={`mailto:${contactEmail}`} className="text-brand-accent hover:underline font-medium">{contactEmail}</a>. Upon verification of identity, we will purge or anonymize your customer record, except where retaining transaction data is legally required by applicable Indian commercial and tax regulations (such as financial auditing and bookkeeping compliance).</li>
                </ul>
              </div>
            </article>

            {/* Section 9: Children's Privacy */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  9. Children&apos;s Privacy
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  Velaash offers contemporary adult apparel and is not intended for use by individuals under the age of 18 without parental or guardian oversight. We do not knowingly collect personal information from minors. If you believe a minor has created an account without parental consent, please contact us immediately to have the information removed.
                </p>
              </div>
            </article>

            {/* Section 10: Policy Updates */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <Clock className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  10. Changes to This Privacy Policy
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  We may periodically revise this Privacy Policy to reflect updates in our technical features, operational practices, or applicable statutory laws. Any modifications will be posted directly to this page with an updated &quot;Last Updated&quot; date at the top.
                </p>
              </div>
            </article>

            {/* Section 11: Grievance Officer & Contact Details */}
            <article className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-brand-border/50">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-accent">
                  <MapPin className="w-4 h-4" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
                  11. Grievance Officer & Contact Us
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-brand-muted leading-relaxed">
                <p>
                  Pursuant to the Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020, if you have any questions, feedback, or grievances regarding our privacy practices or personal data processing, please contact our designated grievance channel:
                </p>
                <div className="p-4 rounded-xl bg-brand-light/30 border border-brand-border/60 space-y-2 text-xs text-brand-dark">
                  <p><strong>Operating Entity:</strong> {legalName}</p>
                  <p><strong>Store Name:</strong> {storeName}</p>
                  <p><strong>Grievance & Privacy Email:</strong> <a href={`mailto:${contactEmail}`} className="text-brand-accent hover:underline font-medium">{contactEmail}</a></p>
                  <p><strong>WhatsApp Support:</strong> <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline font-medium">{contactPhone}</a></p>
                  <p><strong>Jurisdiction & Registration:</strong> Tamil Nadu, Republic of India</p>
                </div>
              </div>
            </article>

            {/* Navigation back to other store policies */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-brand-muted border-t border-brand-border/60">
              <Link href="/terms-conditions" className="hover:text-brand-accent underline">
                &larr; View Terms &amp; Conditions
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
