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
} from "lucide-react";
import type { SiteSettingsData } from "@/features/settings";
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
  uploadBrandAssetAction,
} from "../../actions/settings-actions";

type SettingsTab =
  | "store_profile"
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
  { id: "social_links", label: "Social Links", icon: Share2, description: "Instagram, Facebook, WhatsApp & Pinterest URLs" },
  { id: "shipping", label: "Shipping & Rates", icon: Truck, description: "Free shipping threshold & standard shipping fees" },
  { id: "logistics", label: "Logistics & Shiprocket", icon: PackageCheck, description: "Warehouse pickup pincode & dispatch location" },
  { id: "returns", label: "Returns Policy", icon: RotateCcw, description: "Return window in days & terms copy" },
  { id: "payments", label: "Payments & COD", icon: CreditCard, description: "COD fees, order limits & Razorpay gateway toggle" },
  { id: "tax", label: "Tax & GST", icon: Receipt, description: "Indian GST toggle & GSTIN for invoice generation" },
  { id: "announcement", label: "Announcement Bar", icon: Megaphone, description: "Top header alert text & promotional destination link" },
  { id: "seo", label: "SEO Defaults", icon: Globe, description: "Site-wide fallback meta title & meta description" },
];

export function SiteSettingsView({ initialSettings }: { initialSettings: SiteSettingsData }) {
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
    email: initial.email || "bestrchandra@gmail.com",
    phone: initial.phone || "+91 8508643832",
    whatsapp_number: initial.whatsapp_number || "+91 8508643832",
    whatsapp_url: initial.whatsapp_url || "https://wa.me/918508643832",
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
            placeholder="+91 8508643832"
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
              const val = e.target.value;
              const digits = val.replace(/\D/g, "");
              const cleanDigits = digits.length === 10 ? `91${digits}` : digits;
              const url = cleanDigits ? `https://wa.me/${cleanDigits}` : "";
              setForm({
                ...form,
                whatsapp_number: val,
                whatsapp_url: url,
              });
            }}
            placeholder="+91 8508643832"
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

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <label className="block text-xs font-semibold text-slate-700">Browser Favicon</label>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border bg-white flex items-center justify-center text-xs font-bold">
              V
            </div>
            <span className="text-xs text-slate-500">Preview</span>
          </div>
          <div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white transition-colors">
              {uploadingFavicon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>Upload New Favicon</span>
              <input
                type="file"
                accept="image/x-icon,image/png,image/svg+xml"
                onChange={(e) => handleUpload(e, "favicon")}
                disabled={uploadingFavicon}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={form.favicon_url}
              onChange={(e) => setForm({ ...form, favicon_url: e.target.value })}
              className="w-full mt-2 px-2.5 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
            />
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
    whatsapp: initial.whatsapp || "",
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
          <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Chat Link</label>
          <input
            type="url"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            placeholder="https://wa.me/918508643832"
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
          placeholder="Velaash | Modern Everyday Luxury & Contemporary Clothing"
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
          placeholder="Contemporary clothing designed with refined fabrics and effortless silhouettes for your everyday and occasion wardrobe."
          className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <p className="text-[11px] text-slate-500 mt-1">Recommended length: 150–160 characters.</p>
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
            {form.meta_description || "Contemporary clothing designed with refined fabrics..."}
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
// 9. LOGISTICS & SHIPROCKET SETTINGS FORM
// ============================================================================
function LogisticsSettingsForm({
  initial,
  onSaved,
}: {
  initial: SiteSettingsData["shiprocketSettings"];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    pickup_postcode: initial.pickup_postcode || "600001",
    pickup_location_name: initial.pickup_location_name || "Primary",
    default_weight_kg: initial.default_weight_kg ?? 0.5,
    auto_push_on_pack: initial.auto_push_on_pack ?? false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-heading font-semibold text-slate-900">Logistics &amp; Shiprocket</h2>
        <p className="text-xs text-slate-500">
          Configure warehouse dispatch details, pickup location name, and parcel weight used for live courier rates and automated fulfillment.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs leading-relaxed">
        <strong>Dispatch Hub:</strong> The pickup pincode is used as the origin when querying real-time delivery estimates and courier rates for customer destination pincodes. The pickup location name must exactly match a registered pickup address in your Shiprocket dashboard.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Warehouse Pickup Pincode (Origin) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={6}
            value={form.pickup_postcode}
            onChange={(e) => setForm({ ...form, pickup_postcode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
            placeholder="600001"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
          />
          <p className="text-[11px] text-slate-500 mt-1">6-digit Indian PIN code of your dispatch warehouse or workshop.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Shiprocket Pickup Location Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.pickup_location_name}
            onChange={(e) => setForm({ ...form, pickup_location_name: e.target.value })}
            placeholder="Primary"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
          <p className="text-[11px] text-slate-500 mt-1">Exact nickname configured under Settings &rarr; Pickup Addresses in Shiprocket.</p>
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
              required
              value={form.default_weight_kg}
              onChange={(e) => setForm({ ...form, default_weight_kg: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
            />
            <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">kg</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Estimated parcel weight if individual product weight is not specified.</p>
        </div>
      </div>

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
  );
}
