import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Sparkles, Home, PhoneCall } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found | Velaash",
  description: "The page you are looking for does not exist or has been moved.",
};

export default function NotFound() {
  return (
    <div className="relative min-h-[75vh] flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Decorative Ambient Glow & Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.035] -z-10">
        <span className="font-heading text-[18rem] sm:text-[26rem] font-bold text-brand-dark tracking-tighter">
          404
        </span>
      </div>

      <div className="relative max-w-2xl w-full text-center space-y-8">
        {/* Subtle Luxury Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-light/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-accent shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
          <span>Page Not Found</span>
        </div>

        {/* Headings */}
        <div className="space-y-3">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-brand-dark">
            Lost in the Tapestry
          </h1>
          <p className="mx-auto max-w-lg text-sm sm:text-base text-brand-muted leading-relaxed font-sans">
            The page, collection, or piece you are searching for may have been moved, archived, or is currently unavailable.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 py-3.5 text-xs sm:text-sm font-semibold text-brand-cream hover:bg-brand-accent shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <Home className="h-4 w-4 text-brand-gold" />
            <span>Return to Homepage</span>
          </Link>
          <Link
            href="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-card px-6 py-3.5 text-xs sm:text-sm font-semibold text-brand-dark hover:border-brand-gold hover:bg-brand-cream-dark/40 shadow-xs transition-all duration-200 hover:-translate-y-0.5"
          >
            <ShoppingBag className="h-4 w-4 text-brand-accent" />
            <span>Explore All Collections</span>
          </Link>
        </div>

        {/* Helpful Pathways Divider */}
        <div className="relative pt-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-brand-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
            <span className="bg-brand-cream px-3 text-brand-subtle">
              Or Explore Popular Destinations
            </span>
          </div>
        </div>

        {/* Quick Discovery Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left pt-1">
          <Link
            href="/shop"
            className="group flex flex-col p-4 rounded-xl bg-brand-card border border-brand-border/80 hover:border-brand-gold/60 shadow-xs hover:shadow-gold-sm transition-all duration-200"
          >
            <div className="h-8 w-8 rounded-lg bg-brand-light/30 flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform duration-200 mb-2.5">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-brand-dark group-hover:text-brand-accent transition-colors">
              Contemporary Clothing
            </span>
            <span className="text-[11px] text-brand-muted mt-0.5">
              Kurtas, Sarees, Co-ords & Suits
            </span>
          </Link>

          <Link
            href="/category/pooja-and-brass"
            className="group flex flex-col p-4 rounded-xl bg-brand-card border border-brand-border/80 hover:border-brand-gold/60 shadow-xs hover:shadow-gold-sm transition-all duration-200"
          >
            <div className="h-8 w-8 rounded-lg bg-brand-light/30 flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform duration-200 mb-2.5">
              <Sparkles className="h-4 w-4 text-brand-gold" />
            </div>
            <span className="text-xs font-semibold text-brand-dark group-hover:text-brand-accent transition-colors">
              Pooja & Brass Items
            </span>
            <span className="text-[11px] text-brand-muted mt-0.5">
              Handcrafted lamps, diyas & brassware
            </span>
          </Link>

          <Link
            href="/contact"
            className="group flex flex-col p-4 rounded-xl bg-brand-card border border-brand-border/80 hover:border-brand-gold/60 shadow-xs hover:shadow-gold-sm transition-all duration-200"
          >
            <div className="h-8 w-8 rounded-lg bg-brand-light/30 flex items-center justify-center text-brand-accent group-hover:scale-110 transition-transform duration-200 mb-2.5">
              <PhoneCall className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-brand-dark group-hover:text-brand-accent transition-colors">
              Need Help?
            </span>
            <span className="text-[11px] text-brand-muted mt-0.5">
              Contact our concierge & WhatsApp support
            </span>
          </Link>
        </div>

        {/* Back Link */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-brand-dark transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Velaash Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
