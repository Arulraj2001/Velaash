"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Store,
  Share2,
  Truck,
  RotateCcw,
  CreditCard,
  Receipt,
  Megaphone,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  Loader2,
  ExternalLink,
  PackageCheck,
  Info,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { AdminModal } from "../admin-modal";
import { PromoPopupCard } from "@/components/ui/promo-popup-card";
import type { SiteSettingsData, CheckoutPolicySetting } from "@/features/settings";
import type { ActiveCouponOption } from "../../queries/get-active-coupons";
import {
  updateStoreProfileSettingsAction,
  updateSocialLinksSettingsAction,
  updateShippingSettingsAction,
  updateReturnsSettingsAction,
  updatePaymentSettingsAction,
  updateTaxSettingsAction,
  updateAnnouncementSettingsAction,
  updateSeoSettingsAction,
  updateShiprocketSettingsAction,
  updatePageBannersAction,
  updatePromoPopupSettingsAction,
  updateCheckoutPolicySettingsAction,
  uploadBrandAssetAction,
} from "../../actions/settings-actions";

type SettingsTab =
  | "store_profile"
  | "checkout"
  | "page_banners"
  | "promo_popup"
  | "social_links"
  | "shipping"
  | "logistics"
  | "returns"
  | "payments"
  | "tax"
  | "announcement"
  | "seo";

const TABS: { id: SettingsTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: "store_profile", label: "Store Profile", icon: Store, description: "Brand name, legal entity, contact info & logos" },
  { id: "checkout", label: "Checkout & Accounts", icon: UserCheck, description: "Customer account requirements & guest checkout policy" },
  { id: "promo_popup", label: "Promo Popup", icon: Sparkles, description: "Site-wide promotional offer popup tied to an active coupon" },
  { id: "page_banners", label: "Page Banners", icon: ImageIcon, description: "Configure & upload header banner images for customer pages" },
  { id: "social_links", label: "Social Links", icon: Share2, description: "Instagram, Facebook, WhatsApp & Pinterest URLs" },
  { id: "shipping", label: "Shipping & Rates", icon: Truck, description: "Free shipping threshold & standard shipping fees" },
  { id: "logistics", label: "Logistics & Shiprocket", icon: PackageCheck, description: "Warehouse pickup pincode & dispatch location" },
  { id: "returns", label: "Returns Policy", icon: RotateCcw, description: "Return window in days & terms copy" },
  { id: "payments", label: "Payments & COD", icon: CreditCard, description: "COD fees, order limits & Razorpay gateway toggle" },
  { id: "tax", label: "Tax & GST", icon: Receipt, description: "Indian GST toggle & GSTIN for invoice generation" },
  { id: "announcement", label: "Announcement Bar", icon: Megaphone, description: "Top header alert text & promotional destination link" },
  { id: "seo", label: "SEO Defaults", icon: Globe, description: "Site-wide fallback meta title & meta description" },
];

export function SiteSettingsView({
  initialSettings,
  activeCoupons = [],
  featuredProduct = null,
}: {
  initialSettings: SiteSettingsData;
  activeCoupons?: ActiveCouponOption[];
  featuredProduct?: { imageUrl: string; name?: string } | null;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("store_profile");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    router.refresh();
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-900 text-white rounded-xl shadow-xl animate-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
          Site Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure store policies, legal entity details, taxes, payment gateways, and social profiles.
        </p>
      </div>

      {/* Settings Container: Tabbed Sidebar + Active Section Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar Tabs */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-2 shadow-xs space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs sm:text-sm font-bold truncate">
                    {tab.label}
                  </span>
                  <span
                    className={`block text-[11px] truncate mt-0.5 ${
                      isActive ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {tab.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Section Form Card */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          {activeTab === "store_profile" && (
            <StoreProfileForm
              initial={initialSettings.storeProfile}
              onSaved={() => showToast("Store profile saved successfully.")}
            />
          )}

          {activeTab === "checkout" && (
            <CheckoutPolicyForm
              initial={initialSettings.checkoutPolicy}
              onSaved={() => showToast("Checkout policy saved successfully.")}
            />
          )}

          {activeTab === "page_banners" && (
            <PageBannersForm
              initial={initialSettings.pageBanners}
              onSaved={() => showToast("Page header banners saved successfully.")}
            />
          )}

          {activeTab === "promo_popup" && (
            <PromoPopupSettingsForm
              initial={initialSettings.promoPopup}
              activeCoupons={activeCoupons}
              featuredProduct={featuredProduct}
              onSaved={() => showToast("Promo popup settings saved successfully.")}
            />
          )}

          {activeTab === "social_links" && (
            <SocialLinksForm
              initial={initialSettings.socialLinks}
              onSaved={() => showToast("Social media handles saved successfully.")}
            />
          )}

          {activeTab === "shipping" && (
            <ShippingSettingsForm
              initial={initialSettings.shippingPolicy}
              onSaved={() => showToast("Shipping rates & free threshold saved successfully.")}
            />
          )}

          {activeTab === "logistics" && (
            <LogisticsSettingsForm
              initial={initialSettings.shiprocketSettings}
              onSaved={() => showToast("Logistics and Shiprocket settings saved successfully.")}
            />
          )}

          {activeTab === "returns" && (
            <ReturnsSettingsForm
              initial={initialSettings.returnsPolicy}
              onSaved={() => showToast("Returns policy saved successfully.")}
            />
          )}

          {activeTab === "payments" && (
            <PaymentSettingsForm
              initial={initialSettings.paymentSettings}
              onSaved={() => showToast("Payment gateway settings saved successfully.")}
            />
          )}

          {activeTab === "tax" && (
            <TaxSettingsForm
              initial={initialSettings.taxSettings}
              onSaved={() => showToast("Tax & GST configuration saved successfully.")}
            />
          )}

          {activeTab === "announcement" && (
            <AnnouncementSettingsForm
              initial={initialSettings.announcement}
              onSaved={() => showToast("Announcement banner saved successfully.")}
            />
          )}

          {activeTab === "seo" && (
            <SeoDefaultsForm
              initial={initialSettings.seoDefaults}
              onSaved={() => showToast("SEO defaults saved successfully.")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 1. STORE PROFILE FORM
// ============================================================================
function StoreProfileForm({
  initial,
  onSaved,
}: {
  initial: SiteSettingsData["storeProfile"];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial.name || "Velaash",
    legal_name: initial.legal_name || "VELAASH TRADER'S",
    tagline: initial.tagline || "Contemporary Elegance, Handcrafted in India",
    email: initial.email || "",
    phone: initial.phone || "",
    whatsapp_number: initial.whatsapp_number || "",
    logo_url: initial.logo_url && initial.logo_url !== "/brand/logo.svg" ? initial.logo_url : "/logo.png",
    favicon_url: initial.favicon_url || "/favicon.ico",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "favicon") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (type === "logo") setUploadingLogo(true);
      else setUploadingFavicon(true);
      setErrorMsg(null);

      const fd = new FormData();
      fd.append("file", file);

      const res = await uploadBrandAssetAction(fd, type);
      if (res.success && res.url) {
        setForm((prev) => ({
          ...prev,
          [type === "logo" ? "logo_url" : "favicon_url"]: res.url,
        }));
      } else {
        setErrorMsg(res.error || `Failed to upload ${type}.`);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : `Failed to upload ${type}.`);
    } finally {
      if (type === "logo") setUploadingLogo(false);
      else setUploadingFavicon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await updateStoreProfileSettingsAction(form);
      if (res.success) {
        onSaved();
      } else {
        setErrorMsg(res.error || "Failed to save store profile.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-heading font-semibold text-slate-900">Store Profile</h2>
        <p className="text-xs text-slate-500">
          Core brand identity and verified legal information. Pre-filled with client legal registration.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Store Display Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Legal Business Name <span className="text-amber-600 font-normal">(Invoices &amp; Copyright)</span>
          </label>
          <input
            type="text"
            required
            value={form.legal_name}
            onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
            placeholder="VELAASH TRADER'S"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Tagline</label>
        <input
          type="text"
          value={form.tagline}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Support Phone</label>
          <input
            type="text"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Store phone number"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Support Number</label>
          <input
            type="text"
            required
            value={form.whatsapp_number}
            onChange={(e) => {
              setForm({ ...form, whatsapp_number: e.target.value });
            }}
            placeholder="WhatsApp number"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Brand Assets Upload: Logo & Favicon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <label className="block text-xs font-semibold text-slate-700">Store Logo</label>
          {form.logo_url && (
            <div className="flex items-center gap-3 p-2.5 bg-slate-900 rounded-xl inline-flex">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-brand-gold/40 bg-white/20 shrink-0">
                <Image
                  src={form.logo_url}
                  alt="Store Logo"
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <span className="text-brand-gold font-heading text-lg font-bold pr-2">
                {form.name || "Velaash"}
              </span>
            </div>
          )}
          <div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white transition-colors">
              {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>Upload New Logo</span>
              <input
                type="file"
                accept="image/png,image/svg+xml,image/jpeg"
                onChange={(e) => handleUpload(e, "logo")}
                disabled={uploadingLogo}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              className="w-full mt-2 px-2.5 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">Browser Favicon</label>
            {form.favicon_url === "/favicon.ico" ? (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full">
                Multi-Device Brand Suite Active
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-full">
                Custom Upload Active
              </span>
            )}
          </div>

          {/* Browser Tab Simulation Preview */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-500">Live Tab Simulation:</span>
            <div className="flex flex-wrap items-center gap-3">
              {/* Light Theme Tab Preview */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-xs max-w-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.favicon_url || "/favicon.ico"}
                  alt="Favicon light preview"
                  className="w-4 h-4 rounded-xs object-contain"
                />
                <span className="text-[11px] font-medium text-slate-700 truncate max-w-[130px]">
                  {form.name || "Velaash"} — Online
                </span>
                <span className="text-[10px] text-slate-400 ml-auto">Light</span>
              </div>

              {/* Dark Theme Tab Preview */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xs max-w-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.favicon_url || "/favicon.ico"}
                  alt="Favicon dark preview"
                  className="w-4 h-4 rounded-xs object-contain"
                />
                <span className="text-[11px] font-medium text-zinc-200 truncate max-w-[130px]">
                  {form.name || "Velaash"} — Online
                </span>
                <span className="text-[10px] text-zinc-500 ml-auto">Dark</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white transition-colors shadow-xs">
                {uploadingFavicon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>Upload Custom Favicon</span>
                <input
                  type="file"
                  accept="image/x-icon,image/png,image/svg+xml"
                  onChange={(e) => handleUpload(e, "favicon")}
                  disabled={uploadingFavicon}
                  className="hidden"
                />
              </label>

              {form.favicon_url !== "/favicon.ico" && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, favicon_url: "/favicon.ico" })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium shadow-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset to Brand Suite</span>
                </button>
              )}
            </div>

            <div className="space-y-1 pt-1">
              <input
                type="text"
                value={form.favicon_url}
                onChange={(e) => setForm({ ...form, favicon_url: e.target.value })}
                placeholder="/favicon.ico or https://..."
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
              />
              <p className="text-[10px] text-slate-500 leading-tight">
                Built-in suite delivers multi-device assets: SVG (vector), ICO (16/32/48px), Apple Touch (180px), and Android PWA (192/512px). If uploading custom, use a 512×512 square PNG or SVG.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Store Profile</span>
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// 2. SOCIAL LINKS FORM
// ============================================================================
function SocialLinksForm({
  initial,
  onSaved,
}: {
  initial: SiteSettingsData["socialLinks"];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    instagram: initial.instagram || "",
    facebook: initial.facebook || "",
    pinterest: initial.pinterest || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await updateSocialLinksSettingsAction(form);
      if (res.success) {
        onSaved();
      } else {
        setErrorMsg(res.error || "Failed to save social links.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-heading font-semibold text-slate-900">Social Media Links</h2>
        <p className="text-xs text-slate-500">
          Official social handles replacing earlier placeholders across the site footer and customer support channels.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Instagram URL</label>
          <input
            type="url"
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            placeholder="https://instagram.com/velaash"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Facebook URL</label>
          <input
            type="url"
            value={form.facebook}
            onChange={(e) => setForm({ ...form, facebook: e.target.value })}
            placeholder="https://facebook.com/velaash"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Pinterest URL (Optional)</label>
          <input
            type="url"
            value={form.pinterest}
            onChange={(e) => setForm({ ...form, pinterest: e.target.value })}
            placeholder="https://pinterest.com/velaash"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Social Links</span>
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// 3. SHIPPING & DELIVERY FORM
// ============================================================================
function ShippingSettingsForm({
  initial,
  onSaved,
}: {
  initial: SiteSettingsData["shippingPolicy"];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    free_shipping_threshold: initial.free_shipping_threshold ?? 999,
    standard_shipping_fee: initial.standard_shipping_fee ?? 100,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await updateShippingSettingsAction(form);
      if (res.success) {
        onSaved();
      } else {
        setErrorMsg(res.error || "Failed to save shipping settings.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-heading font-semibold text-slate-900">Shipping &amp; Delivery</h2>
        <p className="text-xs text-slate-500">
          Single source of truth controlling the free shipping progress bar in the cart, PDP badges, and checkout rates.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs leading-relaxed">
        <strong>Single Source of Truth:</strong> Updating these numbers immediately updates the cart progress bar,
        product accordion (&quot;Free shipping over ₹X&quot;), and checkout calculations.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Free Shipping Threshold (₹ INR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-semibold">₹</span>
            <input
              type="number"
              min={0}
              required
              value={form.free_shipping_threshold}
              onChange={(e) => setForm({ ...form, free_shipping_threshold: Number(e.target.value) })}
              className="w-full pl-8 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Orders equal to or above this subtotal qualify for ₹0 shipping.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Standard Domestic Shipping Fee (₹ INR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-semibold">₹</span>
            <input
              type="number"
              min={0}
              required
              value={form.standard_shipping_fee}
              onChange={(e) => setForm({ ...form, standard_shipping_fee: Number(e.target.value) })}
              className="w-full pl-8 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Applied to orders below the free shipping threshold.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Shipping Rates</span>
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// 4. RETURNS POLICY FORM
// ============================================================================
function ReturnsSettingsForm({
  initial,
  onSaved,
}: {
  initial: SiteSettingsData["returnsPolicy"];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    return_window_days: initial.return_window_days ?? 7,
    policy_description: initial.policy_description || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await updateReturnsSettingsAction(form);
      if (res.success) {
        onSaved();
      } else {
        setErrorMsg(res.error || "Failed to save returns policy.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-heading font-semibold text-slate-900">Returns &amp; Exchange Policy</h2>
        <p className="text-xs text-slate-500">
          Single source of truth controlling the return period badges on product pages and policy terms.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Return Window Period (Calendar Days)
        </label>
        <div className="w-full sm:w-48">
          <input
            type="number"
            min={0}
            max={180}
            required
            value={form.return_window_days}
            onChange={(e) => setForm({ ...form, return_window_days: Number(e.target.value) })}
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          e.g. 7 days. Displayed across the product detail page accordion and cart trust badges.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Policy Terms Description
        </label>
        <textarea
          rows={4}
          required
          value={form.policy_description}
          onChange={(e) => setForm({ ...form, policy_description: e.target.value })}
          className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Returns Policy</span>
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// 5. PAYMENT SETTINGS FORM (COD & RAZORPAY)
// ============================================================================
function PaymentSettingsForm({
  initial,
  onSaved,
}: {
  initial: SiteSettingsData["paymentSettings"];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    cod_enabled: initial.cod_enabled ?? true,
    cod_max_order_value: initial.cod_max_order_value ?? 20000,
    cod_handling_fee: initial.cod_handling_fee ?? 99,
    cod_disabled_display_mode: (initial.cod_disabled_display_mode ?? "hidden") as "hidden" | "blurred",
    razorpay_enabled: initial.razorpay_enabled ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await updatePaymentSettingsAction(form);
      if (res.success) {
        onSaved();
      } else {
        setErrorMsg(res.error || "Failed to save payment settings.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-heading font-semibold text-slate-900">Payment Gateways &amp; COD</h2>
        <p className="text-xs text-slate-500">
          Control Cash on Delivery eligibility, maximum transaction limits, and pause online payments if needed.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Online Payments (Razorpay) Toggle */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
        <div>
          <span className="block text-sm font-bold text-slate-900">Online Payments (Razorpay)</span>
          <span className="block text-xs text-slate-500 mt-0.5">
            Accept UPI, Credit/Debit cards, and Net Banking. Toggle off if your gateway is undergoing maintenance.
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={form.razorpay_enabled}
            onChange={(e) => setForm({ ...form, razorpay_enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {/* Cash on Delivery (COD) Controls */}
      <div className="p-4 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="block text-sm font-bold text-slate-900">Cash on Delivery (COD)</span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Allow customers to pay in cash upon doorstep delivery.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={form.cod_enabled}
              onChange={(e) => setForm({ ...form, cod_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {form.cod_enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                COD Max Order Value (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-semibold">₹</span>
                <input
                  type="number"
                  min={0}
                  required
                  value={form.cod_max_order_value}
                  onChange={(e) => setForm({ ...form, cod_max_order_value: Number(e.target.value) })}
                  className="w-full pl-8 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Orders above this subtotal cannot use COD.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                COD Handling Surcharge (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-slate-400 font-semibold">₹</span>
                <input
                  type="number"
                  min={0}
                  required
                  value={form.cod_handling_fee}
                  onChange={(e) => setForm({ ...form, cod_handling_fee: Number(e.target.value) })}
                  className="w-full pl-8 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Flat convenience fee added to COD orders at checkout.</p>
            </div>
          </div>
        )}

        {/* When COD is Disabled Display Behavior */}
        <div className="pt-3 border-t border-slate-100">
          <span className="block text-xs font-semibold text-slate-800 mb-0.5">
            When COD is Disabled or Unavailable:
          </span>
          <p className="text-[11px] text-slate-500 mb-3">
            Choose how the payment section renders on checkout when Cash on Delivery is turned off.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                form.cod_disabled_display_mode === "hidden"
                  ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500"
                  : "border-slate-200 bg-white hover:bg-slate-50/80"
              }`}
            >
              <input
                type="radio"
                name="cod_disabled_display_mode"
                value="hidden"
                checked={form.cod_disabled_display_mode === "hidden"}
                onChange={() => setForm({ ...form, cod_disabled_display_mode: "hidden" })}
                className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  Hide Completely
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Recommended
                  </span>
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Removes the COD option entirely from checkout. Customers only see online payment options.
                </span>
              </div>
            </label>

            <label
              className={`relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                form.cod_disabled_display_mode === "blurred"
                  ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500"
                  : "border-slate-200 bg-white hover:bg-slate-50/80"
              }`}
            >
              <input
                type="radio"
                name="cod_disabled_display_mode"
                value="blurred"
                checked={form.cod_disabled_display_mode === "blurred"}
                onChange={() => setForm({ ...form, cod_disabled_display_mode: "blurred" })}
                className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div>
                <span className="block text-xs font-bold text-slate-900">
                  Show Grayed Out (&quot;Blurred&quot;)
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Keeps the COD card visible but disabled with an explanatory badge that COD is currently unavailable.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Payment Settings</span>
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// 6. TAX / GST FORM
// ============================================================================
function TaxSettingsForm({
  initial,
  onSaved,
}: {
  initial: SiteSettingsData["taxSettings"];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    gst_enabled: initial.gst_enabled ?? true,
    gstin: initial.gstin || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await updateTaxSettingsAction(form);
      if (res.success) {
        onSaved();
      } else {
        setErrorMsg(res.error || "Failed to save tax settings.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-heading font-semibold text-slate-900">Tax &amp; Indian GST</h2>
        <p className="text-xs text-slate-500">
          Feeds invoice PDF generation. Enabling GST generates a Tax Invoice with CGST/SGST breakdown; disabling outputs a Bill of Supply.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* GST Enabled Switch */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
        <div>
          <span className="block text-sm font-bold text-slate-900">Enable GST Invoicing</span>
          <span className="block text-xs text-slate-500 mt-0.5">
            When enabled, all customer invoices show Tax Invoice heading and GST breakdown.
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={form.gst_enabled}
            onChange={(e) => setForm({ ...form, gst_enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {/* GSTIN Field (Only shown/required if GST is enabled) */}
      {form.gst_enabled && (
        <div className="space-y-2 p-4 rounded-xl border border-amber-200 bg-amber-50/40 animate-in fade-in duration-200">
          <label className="block text-xs font-semibold text-slate-700">
            GSTIN (Goods and Services Tax Identification Number) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required={form.gst_enabled}
            value={form.gstin}
            onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase().trim() })}
            placeholder="e.g. 33ABCDE1234F1Z5"
            maxLength={15}
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase tracking-wider"
          />
          <p className="text-[11px] text-slate-500">
            Enter your 15-character registered GSTIN for VELAASH TRADER&apos;S.
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Tax &amp; GST</span>
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// 7. ANNOUNCEMENT BAR FORM
// ============================================================================
function AnnouncementSettingsForm({
  initial,
  onSaved,
}: {
  initial: SiteSettingsData["announcement"];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    is_enabled: initial.is_enabled ?? true,
    text: initial.text || "Welcome to Velaash — New Arrivals Every Week",
    link: initial.link || "/shop",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await updateAnnouncementSettingsAction(form);
      if (res.success) {
        onSaved();
      } else {
        setErrorMsg(res.error || "Failed to save announcement banner.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-heading font-semibold text-slate-900">Announcement Bar</h2>
        <p className="text-xs text-slate-500">
          The top notification strip on every storefront page. Configure promotional text and destination link.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Enabled Toggle */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
        <div>
          <span className="block text-sm font-bold text-slate-900">Show Announcement Bar</span>
          <span className="block text-xs text-slate-500 mt-0.5">
            Display banner above the main navigation header across the site.
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={form.is_enabled}
            onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Banner Text <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          placeholder="e.g. Complimentary Shipping on Prepaid Orders Above ₹1,999"
          className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Destination Link URL
        </label>
        <input
          type="text"
          required
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
          placeholder="/shop"
          className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Live Preview of Announcement Bar */}
      {form.is_enabled && (
        <div className="space-y-1.5 pt-2">
          <span className="text-xs font-semibold text-slate-500">Live Header Preview</span>
          <div className="w-full bg-brand-dark py-2 px-4 rounded-xl text-center text-xs font-medium text-brand-gold flex items-center justify-center gap-2">
            <span>{form.text}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Announcement</span>
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// 8. SEO DEFAULTS FORM
// ============================================================================
function SeoDefaultsForm({
  initial,
  onSaved,
}: {
  initial: SiteSettingsData["seoDefaults"];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    meta_title: initial.meta_title || "",
    meta_description: initial.meta_description || "",
    keywords: initial.keywords || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await updateSeoSettingsAction(form);
      if (res.success) {
        onSaved();
      } else {
        setErrorMsg(res.error || "Failed to save SEO defaults.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-heading font-semibold text-slate-900">Site-Wide SEO Defaults</h2>
        <p className="text-xs text-slate-500">
          Default meta tags wired into the root HTML layout and search engine preview snippets whenever a page lacks custom metadata.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Default Meta Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.meta_title}
          onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
          placeholder="Velaash — Everyday essentials for every home"
          className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
        />
        <p className="text-[11px] text-slate-500 mt-1">Recommended length: 50–60 characters.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Default Meta Description <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={3}
          required
          value={form.meta_description}
          onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
          placeholder="Shop clothing for men and women, plus traditional pooja and brass essentials, at Velaash."
          className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <p className="text-[11px] text-slate-500 mt-1">Recommended length: 150–160 characters.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Site-Wide Meta Keywords (English &amp; Tamil)
        </label>
        <input
          type="text"
          value={form.keywords}
          onChange={(e) => setForm({ ...form, keywords: e.target.value })}
          placeholder="Velaash, Everyday essentials, Clothing, Pooja essentials, Brass, ஆடை, கடை"
          className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <p className="text-[11px] text-slate-500 mt-1">
          Comma-separated keywords. You can include Tamil search terms (e.g. ஆடை, கடை) alongside English keywords.
        </p>
      </div>

      {/* Google Search Snippet Simulation */}
      <div className="space-y-1.5 pt-2">
        <span className="text-xs font-semibold text-slate-500">Search Result Preview</span>
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
          <span className="text-xs text-slate-500 block truncate">
            {process.env.NEXT_PUBLIC_APP_URL || "https://velaash.in"}
          </span>
          <span className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer block truncate">
            {form.meta_title || "Velaash"}
          </span>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {form.meta_description || "Shop clothing for men and women, plus traditional pooja and brass essentials..."}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save SEO Defaults</span>
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// 9. LOGISTICS SETTINGS FORM (Mode Toggle + Lightbox Guide)
// ============================================================================
function LogisticsSettingsForm({
  initial,
  onSaved,
}: {
  initial: SiteSettingsData["shiprocketSettings"];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    logistics_mode: (initial.logistics_mode ?? "manual") as "manual" | "shiprocket",
    pickup_postcode: initial.pickup_postcode || "600001",
    pickup_location_name: initial.pickup_location_name || "Primary",
    default_weight_kg: initial.default_weight_kg ?? 0.5,
    auto_push_on_pack: initial.auto_push_on_pack ?? false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await updateShiprocketSettingsAction(form);
      if (res.success) {
        onSaved();
      } else {
        setErrorMsg(res.error || "Failed to save logistics settings.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isManual = form.logistics_mode === "manual";

  return (
    <>
      {/* ── HOW-IT-WORKS LIGHTBOX ── */}
      <AdminModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        maxWidth="lg"
        icon={<PackageCheck className="w-5 h-5 text-slate-700" />}
        title="Logistics Mode — How It Works"
        description="Comparison between Manual Self-Ship and Automated Shiprocket API."
        footer={
          <button
            type="button"
            onClick={() => setShowGuide(false)}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-black transition-colors shadow-sm"
          >
            Got it, close
          </button>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Manual Mode Section */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base">✦</span>
              <h3 className="text-sm font-bold text-emerald-800">Manual / Self-Ship</h3>
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                Recommended for Startups
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-emerald-900">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 shrink-0">①</span>
                <span>Customer places order → you receive it in the Admin Orders panel</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 shrink-0">②</span>
                <span>Confirm the order → Pack it → Click <strong>&quot;Mark as Shipped&quot;</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 shrink-0">③</span>
                <span>Enter courier name (e.g. DTDC, Delhivery) and tracking number manually</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 shrink-0">④</span>
                <span>Customer can track via their account dashboard using the tracking number</span>
              </li>
            </ul>
            <div className="pt-1 border-t border-emerald-100 text-[11px] text-emerald-700 font-medium">
              ✅ No API key needed · Free · Full control
            </div>
          </div>

          {/* Shiprocket Mode Section */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🚀</span>
              <h3 className="text-sm font-bold text-indigo-800">Shiprocket API Mode</h3>
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                For Scale (10+ orders/day)
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-indigo-900">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5 shrink-0">①</span>
                <span>Requires a paid Shiprocket account + API credentials in your environment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5 shrink-0">②</span>
                <span>Pack the order → Click <strong>&quot;Push to Shiprocket&quot;</strong> in the order detail view</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5 shrink-0">③</span>
                <span>Shiprocket automatically assigns the best courier and generates AWB number</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5 shrink-0">④</span>
                <span>Pickup is scheduled from your warehouse address configured below</span>
              </li>
            </ul>
            <div className="pt-1 border-t border-indigo-100 text-[11px] text-indigo-700 font-medium">
              ⚡ Faster at scale · Auto-courier selection · COD remittance management
            </div>
          </div>

          {/* Switching Note */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900">
            <strong>💡 Switching modes is instant.</strong> You can toggle anytime from this Settings panel — no data is lost.
            Active mode is read on every order page so it always reflects your current setting.
            <br /><br />
            <strong>Upgrade tip:</strong> Move to Shiprocket when you are consistently shipping more than 10 orders per day and want automated label printing and courier negotiation.
          </div>
        </div>
      </AdminModal>

      {/* ── MAIN FORM ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header + Guide Button */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-heading font-semibold text-slate-900">Logistics & Fulfilment</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose how you ship orders. Switch freely between manual self-ship and Shiprocket API at any time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Info className="w-3.5 h-3.5" />
            How it works?
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── MODE TOGGLE PILL ── */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Active Logistics Provider</label>
          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 gap-1">
            {/* Manual Option */}
            <button
              type="button"
              onClick={() => setForm({ ...form, logistics_mode: "manual" })}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isManual
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white"
              }`}
            >
              <span className={isManual ? "text-white" : "text-slate-400"}>✦</span>
              Manual / Self-Ship
            </button>

            {/* Shiprocket Option */}
            <button
              type="button"
              onClick={() => setForm({ ...form, logistics_mode: "shiprocket" })}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                !isManual
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white"
              }`}
            >
              <span className={!isManual ? "text-white" : "text-slate-400"}>🚀</span>
              Shiprocket API
            </button>
          </div>

          {/* Live Status Banner */}
          {isManual ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Manual mode active.</strong> Orders are fulfilled by entering courier name and tracking number manually. No API calls are made.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2.5 text-xs text-indigo-800 animate-in fade-in duration-200">
              <ExternalLink className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Shiprocket API active.</strong> Packed orders can be dispatched with one click. Ensure your Shiprocket API credentials are set in environment variables.
              </span>
            </div>
          )}
        </div>

        {/* ── SHIPROCKET CONFIG (only shown in Shiprocket mode) ── */}
        {!isManual && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <strong>Dispatch Hub:</strong> The pickup pincode is used as the origin when querying courier rates. The pickup location name must exactly match a registered address in your Shiprocket dashboard (Settings → Pickup Addresses).
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warehouse Pickup Pincode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required={!isManual}
                  maxLength={6}
                  value={form.pickup_postcode}
                  onChange={(e) => setForm({ ...form, pickup_postcode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  placeholder="600001"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">6-digit PIN code of your dispatch warehouse.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shiprocket Pickup Location Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required={!isManual}
                  value={form.pickup_location_name}
                  onChange={(e) => setForm({ ...form, pickup_location_name: e.target.value })}
                  placeholder="Primary"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">Exact nickname from Shiprocket → Pickup Addresses.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Package Weight (kg) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="50"
                    required={!isManual}
                    value={form.default_weight_kg}
                    onChange={(e) => setForm({ ...form, default_weight_kg: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
                  />
                  <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">kg</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Fallback parcel weight for courier rate calculation.</p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Logistics Settings</span>
          </button>
        </div>
      </form>
    </>
  );
}

// ============================================================================
// 10. PAGE BANNERS FORM
// ============================================================================
type BannerPageKey = "shop" | "about" | "contact" | "faq" | "shipping_returns" | "track_order";

interface BannerPageConfig {
  key: BannerPageKey;
  label: string;
  route: string;
  defaultTitle: string;
  defaultSubtitle: string;
}

const BANNER_PAGES: BannerPageConfig[] = [
  {
    key: "shop",
    label: "Shop / All Collections",
    route: "/shop",
    defaultTitle: "The Collection",
    defaultSubtitle: "Explore our signature collection of handcrafted sarees and kurtas.",
  },
  {
    key: "about",
    label: "About Us",
    route: "/about",
    defaultTitle: "Our Heritage & Craft",
    defaultSubtitle: "Woven with passion, rooted in timeless South Indian heritage.",
  },
  {
    key: "contact",
    label: "Contact Us",
    route: "/contact",
    defaultTitle: "Connect With Us",
    defaultSubtitle: "We are here to assist with personalized styling and order inquiries.",
  },
  {
    key: "faq",
    label: "FAQ & Help",
    route: "/faq",
    defaultTitle: "Frequently Asked Questions",
    defaultSubtitle: "Clear answers to your queries on sizing, shipping, care, and payments.",
  },
  {
    key: "shipping_returns",
    label: "Shipping & Returns",
    route: "/shipping-returns",
    defaultTitle: "Delivery & Returns",
    defaultSubtitle: "Seamless, insured doorstep delivery across India and transparent returns.",
  },
  {
    key: "track_order",
    label: "Track Order",
    route: "/track-order",
    defaultTitle: "Order Tracking",
    defaultSubtitle: "Real-time courier tracking and updates for your order.",
  },
];

function PageBannersForm({
  initial,
  onSaved,
}: {
  initial: SiteSettingsData["pageBanners"];
  onSaved: () => void;
}) {
  const [form, setForm] = useState<SiteSettingsData["pageBanners"]>({
    shop: { image_url: initial?.shop?.image_url || "", headline: initial?.shop?.headline || "", subtitle: initial?.shop?.subtitle || "" },
    about: { image_url: initial?.about?.image_url || "", headline: initial?.about?.headline || "", subtitle: initial?.about?.subtitle || "" },
    contact: { image_url: initial?.contact?.image_url || "", headline: initial?.contact?.headline || "", subtitle: initial?.contact?.subtitle || "" },
    faq: { image_url: initial?.faq?.image_url || "", headline: initial?.faq?.headline || "", subtitle: initial?.faq?.subtitle || "" },
    shipping_returns: { image_url: initial?.shipping_returns?.image_url || "", headline: initial?.shipping_returns?.headline || "", subtitle: initial?.shipping_returns?.subtitle || "" },
    track_order: { image_url: initial?.track_order?.image_url || "", headline: initial?.track_order?.headline || "", subtitle: initial?.track_order?.subtitle || "" },
  });
  const [uploadingKey, setUploadingKey] = useState<BannerPageKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: BannerPageKey) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingKey(key);
      setErrorMsg(null);

      const fd = new FormData();
      fd.append("file", file);

      const res = await uploadBrandAssetAction(fd, "banner");
      if (res.success && res.url) {
        setForm((prev) => ({
          ...prev,
          [key]: {
            ...prev?.[key],
            image_url: res.url,
          },
        }));
      } else {
        setErrorMsg(res.error || "Failed to upload banner image.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to upload banner.");
    } finally {
      setUploadingKey(null);
    }
  };

  const updateField = (key: BannerPageKey, field: "image_url" | "headline" | "subtitle", value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...prev?.[key],
        [field]: value,
      },
    }));
  };

  const handleClearImage = (key: BannerPageKey) => {
    updateField(key, "image_url", "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await updatePageBannersAction(form);
    setIsSubmitting(false);

    if (res.success) {
      onSaved();
    } else {
      setErrorMsg(res.error || "Failed to save page banners.");
    }
  };

  return (
    <>
      <div className="border-b border-slate-100 pb-5 mb-6">
        <h3 className="text-base font-bold text-slate-900">Page Header Banners</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure hero banner images and custom headings for customer-facing pages. When an image is set, a sleek letterbox banner is rendered. When empty, pages use an ultra-sleek, compact (~90px) minimal bar.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Informational Guidance Callout */}
      <div className="mb-6 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1.5">
        <div className="flex items-center gap-2 font-semibold">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Banner Design Best Practices</span>
        </div>
        <p className="text-amber-800">
          • <strong>Recommended Dimensions:</strong> 1920 × 400 px (or min. 1400 × 350 px) landscape letterbox.
        </p>
        <p className="text-amber-800">
          • <strong>Minimal by Default:</strong> Leaving the image URL blank keeps the page header ultra-minimal and high-converting, displaying products immediately above the fold.
        </p>
        <p className="text-amber-800">
          • <strong>Category Pages (<code className="font-mono text-[11px]">/category/[slug]</code>):</strong> Category banners automatically display the category image configured in <strong>Admin → Categories</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {BANNER_PAGES.map((page) => {
          const item = form?.[page.key] || { image_url: "", headline: "", subtitle: "" };
          const imageUrl = item.image_url || "";
          const hasImage = Boolean(imageUrl.trim());
          const isUploading = uploadingKey === page.key;
          const displayHeadline = item.headline || page.defaultTitle;
          const displaySubtitle = item.subtitle || page.defaultSubtitle;

          return (
            <div
              key={page.key}
              className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-4 transition-all"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                    {page.route}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{page.label}</h4>
                </div>
                <div>
                  {hasImage ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-100/70 border border-amber-300/80 px-2.5 py-0.5 rounded-full">
                      <ImageIcon className="w-3 h-3 text-amber-700" />
                      Image Banner Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-300/80 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      Minimal Header Active
                    </span>
                  )}
                </div>
              </div>

              {/* Banner Image Preview / Actions */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Banner Image
                </label>

                {hasImage ? (
                  <div className="space-y-3">
                    {/* Live Letterbox Preview */}
                    <div className="relative h-28 w-full rounded-lg overflow-hidden border border-slate-300 shadow-inner bg-zinc-900 group">
                      <Image
                        src={imageUrl}
                        alt={page.label}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 768px) 100vw, 700px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/30" />
                      <div className="absolute inset-0 p-4 flex flex-col justify-end">
                        <span className="text-white text-base sm:text-lg font-serif font-semibold drop-shadow-md">
                          {displayHeadline}
                        </span>
                        <span className="text-white/80 text-[11px] line-clamp-1 drop-shadow-sm">
                          {displaySubtitle}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer shadow-xs transition-colors">
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{isUploading ? "Uploading..." : "Replace Image"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploading}
                          onChange={(e) => handleUpload(e, page.key)}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleClearImage(page.key)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium shadow-xs transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Remove (Revert to Minimal)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer shadow-xs transition-colors">
                      {isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{isUploading ? "Uploading..." : "Upload Banner Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => handleUpload(e, page.key)}
                        className="hidden"
                      />
                    </label>

                    <span className="text-[11px] text-slate-400 text-center sm:text-left">or enter image URL directly:</span>

                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => updateField(page.key, "image_url", e.target.value)}
                      placeholder="https://... or /banners/shop.jpg"
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Optional Custom Heading & Subtitle Overrides */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Custom Headline (Optional)
                  </label>
                  <input
                    type="text"
                    value={item.headline || ""}
                    onChange={(e) => updateField(page.key, "headline", e.target.value)}
                    placeholder={page.defaultTitle}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Leave blank to use default &ldquo;{page.defaultTitle}&rdquo;</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Custom Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    value={item.subtitle || ""}
                    onChange={(e) => updateField(page.key, "subtitle", e.target.value)}
                    placeholder={page.defaultSubtitle}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Leave blank to use default subtitle</p>
                </div>
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Page Banners</span>
          </button>
        </div>
      </form>
    </>
  );
}

// ============================================================================
// 11. PROMO POPUP SETTINGS FORM
// ============================================================================
function PromoPopupSettingsForm({
  initial,
  activeCoupons = [],
  featuredProduct = null,
  onSaved,
}: {
  initial?: SiteSettingsData["promoPopup"];
  activeCoupons?: ActiveCouponOption[];
  featuredProduct?: { imageUrl: string; name?: string } | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    is_enabled: initial?.is_enabled ?? false,
    featured_coupon_id: initial?.featured_coupon_id || "",
    popup_title: initial?.popup_title || "Special Offer",
    popup_description:
      initial?.popup_description ||
      "Use this code at checkout to enjoy an exclusive discount on your order.",
    delay_seconds: initial?.delay_seconds ?? 9,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedCoupon = activeCoupons.find((c) => c.id === form.featured_coupon_id);
  const isSelectedCouponMissing =
    Boolean(form.featured_coupon_id) && !selectedCoupon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await updatePromoPopupSettingsAction({
        is_enabled: form.is_enabled,
        featured_coupon_id: form.featured_coupon_id ? form.featured_coupon_id : null,
        popup_title: form.popup_title,
        popup_description: form.popup_description,
        delay_seconds: Number(form.delay_seconds) || 9,
      });

      if (res.success) {
        onSaved();
      } else {
        setErrorMsg(res.error || "Failed to save promo popup settings.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div>
          <span className="block text-sm font-semibold text-slate-900">
            Enable Promotional Popup
          </span>
          <span className="block text-xs text-slate-500 mt-0.5">
            Display a floating luxury offer modal to new visitors site-wide (excluding cart, checkout, account, and admin).
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={form.is_enabled}
            onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {/* Linked Active Coupon Dropdown */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Featured Active Coupon <span className="text-rose-500">*</span>
        </label>
        <select
          value={form.featured_coupon_id}
          onChange={(e) => setForm({ ...form, featured_coupon_id: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-medium"
        >
          <option value="">-- Select an active coupon --</option>
          {activeCoupons.map((coupon) => {
            const discountLabel =
              coupon.discountType === "percentage"
                ? `${coupon.discountValue}% OFF`
                : `₹${coupon.discountValue} OFF`;
            const minOrderLabel =
              coupon.minOrderValue > 0
                ? ` (Min ₹${coupon.minOrderValue.toLocaleString("en-IN")})`
                : "";
            return (
              <option key={coupon.id} value={coupon.id}>
                {coupon.code} — {discountLabel}
                {minOrderLabel}
              </option>
            );
          })}
        </select>
        <p className="text-[11px] text-slate-500 mt-1">
          Only currently active, non-expired coupons are listed. All discount values, codes, and thresholds are read dynamically from this coupon record.
        </p>
        {isSelectedCouponMissing && (
          <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              The previously selected coupon is no longer active or has expired. Please select a currently active coupon above.
            </span>
          </div>
        )}
      </div>

      {/* Headline & Description */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Popup Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.popup_title}
            onChange={(e) => setForm({ ...form, popup_title: e.target.value })}
            placeholder="Special Offer"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
          />
          <p className="text-[11px] text-slate-500 mt-1">Short headline displayed at the top of the modal.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Popup Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            value={form.popup_description}
            onChange={(e) => setForm({ ...form, popup_description: e.target.value })}
            placeholder="Use this code at checkout to enjoy an exclusive discount on your order."
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-normal text-slate-900 resize-none"
          />
          <p className="text-[11px] text-slate-500 mt-1">Supporting line of copy above the promo code pill.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Popup Display Delay (Seconds)
          </label>
          <input
            type="number"
            min={0}
            max={60}
            value={form.delay_seconds}
            onChange={(e) => setForm({ ...form, delay_seconds: Number(e.target.value) })}
            className="w-32 px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
          />
          <p className="text-[11px] text-slate-500 mt-1">Seconds after page load before displaying to new visitors (default: 9 seconds).</p>
        </div>
      </div>

      {/* Live Preview Section (Uses the identical PromoPopupCard presentation component) */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Live Customer Modal Preview</span>
          {form.is_enabled && selectedCoupon && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active on Site
            </span>
          )}
        </div>

        <div className="relative rounded-2xl border border-slate-200 bg-slate-900/40 p-4 sm:p-6 flex items-center justify-center min-h-[360px] overflow-hidden">
          <PromoPopupCard
            isPreview={true}
            title={form.popup_title}
            description={form.popup_description}
            coupon={
              selectedCoupon
                ? {
                    code: selectedCoupon.code,
                    discountType: selectedCoupon.discountType,
                    discountValue: selectedCoupon.discountValue,
                    minOrderValue: selectedCoupon.minOrderValue,
                    maxDiscountAmount: selectedCoupon.maxDiscountAmount,
                  }
                : null
            }
            productThumbnail={featuredProduct}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Promo Popup Settings</span>
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// CHECKOUT & CUSTOMER ACCOUNTS POLICY FORM
// ============================================================================
function CheckoutPolicyForm({
  initial,
  onSaved,
}: {
  initial: CheckoutPolicySetting;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    require_sign_in_to_order: initial.require_sign_in_to_order ?? false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await updateCheckoutPolicySettingsAction(form);
      if (res.success) {
        onSaved();
      } else {
        setErrorMsg(res.error || "Failed to save checkout policy.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-slate-100 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-slate-900">
              Customer Accounts &amp; Checkout Policy
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control whether visitors can place orders as guests or must sign in first.
            </p>
          </div>
          <div>
            {form.require_sign_in_to_order ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Sign-In Required for Orders
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Guest Checkout Active (No Sign-In Required)
              </span>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Switch Card */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="block text-sm font-bold text-slate-900">
              Require Customer Sign-In to Place Order
            </span>
            <span className="block text-xs text-slate-500 leading-relaxed max-w-xl">
              When toggled ON, customers must authenticate via email OTP or Google Sign-In before placing an order.
              When toggled OFF, guest checkout is enabled and any visitor can complete an order by just entering their email and delivery address.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={form.require_sign_in_to_order}
              onChange={(e) => setForm({ ...form, require_sign_in_to_order: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Dynamic Comparison Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200/80">
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 transition-all ${
              !form.require_sign_in_to_order
                ? "bg-white border-emerald-400 shadow-xs ring-1 ring-emerald-400/30"
                : "bg-slate-100/60 border-slate-200 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Guest Checkout (Current Default)</span>
              {!form.require_sign_in_to_order && (
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <p className="text-slate-600">
              • Lowest friction for early sales and maximum conversion.
            </p>
            <p className="text-slate-600">
              • Visitors can complete their purchase immediately without waiting for OTP codes.
            </p>
            <p className="text-slate-600">
              • An account can still optionally be created at checkout if the customer chooses.
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 transition-all ${
              form.require_sign_in_to_order
                ? "bg-white border-amber-400 shadow-xs ring-1 ring-amber-400/30"
                : "bg-slate-100/60 border-slate-200 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Sign-In Required</span>
              {form.require_sign_in_to_order && (
                <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <p className="text-slate-600">
              • Every order is 100% verified and linked to a registered customer account.
            </p>
            <p className="text-slate-600">
              • Prevents typos in email addresses and reduces spam / abandoned COD attempts.
            </p>
            <p className="text-slate-600">
              • Customers can view order progress anytime under their Account dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Checkout Policy</span>
        </button>
      </div>
    </form>
  );
}


