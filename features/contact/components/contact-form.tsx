"use client";

import * as React from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { submitContactFormAction } from "../actions/submit-contact-action";

export function ContactForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const res = await submitContactFormAction({
        name,
        email,
        subject,
        message,
        company_website: honeypot,
      });

      if (res.success) {
        setIsSuccess(true);
        setSuccessMessage(
          res.message || "Thank you for reaching out! We have received your message and will respond shortly."
        );
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setHoneypot("");
      } else {
        setErrorMessage(res.error || "Failed to send message. Please try again.");
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSuccess(false);
    setSuccessMessage("");
    setErrorMessage(null);
    setFieldErrors({});
  };

  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-brand-border/80 bg-white p-8 sm:p-10 shadow-sm text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-heading text-2xl font-semibold text-brand-dark">
            Message Sent Successfully
          </h3>
          <p className="text-sm text-brand-muted max-w-md mx-auto leading-relaxed">
            {successMessage}
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-brand-dark/20 text-xs font-semibold uppercase tracking-wider text-brand-dark hover:bg-brand-cream/60 transition-colors"
          >
            Send Another Inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-brand-border/80 bg-white p-6 sm:p-8 md:p-10 shadow-sm space-y-6"
    >
      {/* Error Notification */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Invisible Honeypot Spam Protection Field */}
      <div
        style={{ display: "none", opacity: 0, position: "absolute", left: "-9999px" }}
        aria-hidden="true"
      >
        <label htmlFor="company_website">Do not fill this field</label>
        <input
          type="text"
          id="company_website"
          name="company_website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Full Name */}
        <div>
          <label htmlFor="contact_name" className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-2">
            Your Name <span className="text-rose-600">*</span>
          </label>
          <input
            id="contact_name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            className={`w-full px-4 py-3 rounded-lg border text-sm text-brand-dark bg-brand-light/30 placeholder:text-brand-muted/60 transition-all focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold ${
              fieldErrors.name ? "border-rose-400 bg-rose-50/20" : "border-brand-border"
            }`}
          />
          {fieldErrors.name && (
            <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.name}</p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="contact_email" className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-2">
            Email Address <span className="text-rose-600">*</span>
          </label>
          <input
            id="contact_email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. priya@example.com"
            className={`w-full px-4 py-3 rounded-lg border text-sm text-brand-dark bg-brand-light/30 placeholder:text-brand-muted/60 transition-all focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold ${
              fieldErrors.email ? "border-rose-400 bg-rose-50/20" : "border-brand-border"
            }`}
          />
          {fieldErrors.email && (
            <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.email}</p>
          )}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="contact_subject" className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-2">
          Subject <span className="text-rose-600">*</span>
        </label>
        <input
          id="contact_subject"
          name="subject"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Inquiry regarding sizing on Anarkali Kurta"
          className={`w-full px-4 py-3 rounded-lg border text-sm text-brand-dark bg-brand-light/30 placeholder:text-brand-muted/60 transition-all focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold ${
            fieldErrors.subject ? "border-rose-400 bg-rose-50/20" : "border-brand-border"
          }`}
        />
        {fieldErrors.subject && (
          <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.subject}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="contact_message" className="block text-xs font-semibold text-brand-dark uppercase tracking-wider mb-2">
          Message <span className="text-rose-600">*</span>
        </label>
        <textarea
          id="contact_message"
          name="message"
          rows={5}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Please share details about your inquiry, order number if applicable, or questions..."
          className={`w-full px-4 py-3 rounded-lg border text-sm text-brand-dark bg-brand-light/30 placeholder:text-brand-muted/60 transition-all focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold resize-y ${
            fieldErrors.message ? "border-rose-400 bg-rose-50/20" : "border-brand-border"
          }`}
        />
        {fieldErrors.message && (
          <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-brand-dark text-brand-cream text-xs font-semibold uppercase tracking-widest hover:bg-black transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
              <span>Sending Message...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-brand-gold" />
              <span>Submit Inquiry</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
