import * as React from "react";
import { Mail, MessageCircle, Phone, Clock, MapPin, ShieldCheck } from "lucide-react";
import type { SiteSettings } from "@/features/settings/types";

interface ContactDetailsProps {
  settings: SiteSettings;
}

export function ContactDetails({ settings }: ContactDetailsProps) {
  const { storeProfile } = settings;

  const cleanPhone = (storeProfile.whatsapp_number || storeProfile.phone || "").replace(/[^0-9]/g, "");
  const whatsappUrl = cleanPhone.length > 0 ? `https://wa.me/${cleanPhone}` : "https://wa.me/918508643832";
  const displayPhone = storeProfile.whatsapp_number || storeProfile.phone || "+91 8508643832";
  const displayEmail = storeProfile.email || "bestrchandra@gmail.com";
  const legalName = storeProfile.legal_name || "VELAASH TRADER'S";

  return (
    <div className="space-y-6 font-sans">
      <div className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <span className="text-[11px] font-semibold text-brand-gold uppercase tracking-widest block mb-1">
            Direct Assistance
          </span>
          <h3 className="font-heading text-xl sm:text-2xl font-semibold text-brand-dark">
            Get in Touch
          </h3>
          <p className="text-xs text-brand-muted mt-1 leading-relaxed">
            Have questions about an existing order, sizing recommendations, or return assistance?
            We are here to help.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {/* WhatsApp Direct Chat */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/80 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Instant Chat &bull; WhatsApp
              </span>
              <p className="text-sm font-semibold text-brand-dark mt-0.5">
                {displayPhone}
              </p>
              <p className="text-xs text-emerald-700/80 mt-0.5">
                Fastest response for sizing and quick questions
              </p>
            </div>
          </a>

          {/* Email Support */}
          <a
            href={`mailto:${displayEmail}`}
            className="flex items-start gap-4 p-4 rounded-xl border border-brand-border/60 bg-brand-light/20 hover:bg-brand-light/60 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-brand-dark text-brand-gold flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">
                Customer Support Email
              </span>
              <p className="text-sm font-semibold text-brand-dark mt-0.5 truncate">
                {displayEmail}
              </p>
              <p className="text-xs text-brand-muted mt-0.5">
                For order inquiries, billing, and formal requests
              </p>
            </div>
          </a>

          {/* Phone Call */}
          <a
            href={`tel:${cleanPhone}`}
            className="flex items-start gap-4 p-4 rounded-xl border border-brand-border/60 bg-brand-light/20 hover:bg-brand-light/60 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-brand-dark text-brand-gold flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">
                Phone Support
              </span>
              <p className="text-sm font-semibold text-brand-dark mt-0.5">
                {displayPhone}
              </p>
              <p className="text-xs text-brand-muted mt-0.5">
                Direct voice line for order inquiries
              </p>
            </div>
          </a>
        </div>

        {/* Response Expectation & Business Identity */}
        <div className="pt-4 border-t border-brand-border/60 space-y-3 text-xs text-brand-muted">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
            <div>
              <strong className="text-brand-dark">Response Time:</strong> We typically respond within 24 hours via WhatsApp or email.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
            <div>
              <strong className="text-brand-dark">Legal Entity:</strong> {legalName}. Registered in India.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
            <div>
              <strong className="text-brand-dark">Authenticity Guarantee:</strong> All items listed on Velaash are authentic and shipped with secure, tracked domestic packaging.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
