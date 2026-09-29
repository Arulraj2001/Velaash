"use client";

import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Mail, Phone, UserCheck } from "lucide-react";
import type { CheckoutFormData } from "../types";

interface ContactInfoStepProps {
  register: UseFormRegister<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
  isLoggedIn: boolean;
  customerName?: string | null;
}

export function ContactInfoStep({
  register,
  errors,
  isLoggedIn,
  customerName,
}: ContactInfoStepProps) {
  return (
    <div className="rounded-xl border border-brand-border/80 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-brand-border/50">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark text-xs font-semibold text-brand-cream">
            1
          </span>
          <h2 className="font-heading text-base sm:text-lg font-medium text-brand-dark">
            Contact Information
          </h2>
        </div>
        {isLoggedIn && (
          <span className="inline-flex items-center gap-1 text-[11px] text-brand-accent font-medium bg-brand-cream/80 px-2 py-0.5 rounded border border-brand-gold/30">
            <UserCheck className="h-3 w-3" />
            Signed In {customerName ? `as ${customerName}` : ""}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Email Field */}
        <div>
          <label htmlFor="contact-email" className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
            Email Address <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              id="contact-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("contact.email")}
              className={`w-full rounded-none border px-3 py-2.5 pl-9 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-dark focus:outline-none transition-colors ${
                errors.contact?.email ? "border-red-500 bg-red-50/20" : "border-brand-border/80 bg-white"
              }`}
            />
            <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-brand-dark/40" />
          </div>
          {errors.contact?.email && (
            <p className="mt-1 text-[11px] text-red-600">{errors.contact.email.message}</p>
          )}
          <p className="mt-1 text-[11px] text-brand-dark/50">Order confirmation &amp; receipt will be sent here.</p>
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="contact-phone" className="block text-xs font-semibold uppercase tracking-wider text-brand-dark mb-1.5">
            Mobile Number <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-medium text-brand-dark/60 select-none">
              +91
            </span>
            <input
              id="contact-phone"
              type="tel"
              maxLength={10}
              autoComplete="tel"
              placeholder="9876543210"
              {...register("contact.phone")}
              className={`w-full rounded-none border px-3 py-2.5 pl-12 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-dark focus:outline-none transition-colors ${
                errors.contact?.phone ? "border-red-500 bg-red-50/20" : "border-brand-border/80 bg-white"
              }`}
            />
            <Phone className="absolute right-3 top-3 h-3.5 w-3.5 text-brand-dark/40" />
          </div>
          {errors.contact?.phone && (
            <p className="mt-1 text-[11px] text-red-600">{errors.contact.phone.message}</p>
          )}
          <p className="mt-1 text-[11px] text-brand-dark/50">Used for courier delivery updates.</p>
        </div>
      </div>

      {/* Guest Account Creation Checkbox */}
      {!isLoggedIn && (
        <div className="mt-4 pt-3 border-t border-brand-border/40">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register("contact.createAccount")}
              className="h-4 w-4 rounded border-brand-border text-brand-dark focus:ring-brand-accent"
            />
            <span className="text-xs text-brand-dark/80">
              Create an account with this info to track your orders faster next time
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
