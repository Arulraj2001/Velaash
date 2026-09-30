import React from "react";
import { Star, ShieldCheck, Heart } from "lucide-react";
import { Container } from "@/components/ui/container";

export interface TestimonialItem {
  id?: string;
  name: string;
  location?: string;
  rating?: number;
  review: string;
  productName?: string;
  product_name?: string;
}

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: "1",
    name: "Ananya Sharma",
    location: "Mumbai",
    rating: 5,
    review:
      "The fabric quality of the Chanderi Kurta set is simply unmatched. It breathes so well even during humid days, and the subtle gold zari trim feels wonderfully luxurious without being over the top.",
    productName: "Chanderi Anarkali Set",
  },
  {
    id: "2",
    name: "Ritu Mathur",
    location: "Bangalore",
    rating: 5,
    review:
      "Wore my Velaash co-ord set to an evening gallery preview and received countless compliments! The drape is exceptionally flattering, and the stitching is high-end boutique caliber.",
    productName: "Silk Blend Co-Ord Ensemble",
  },
  {
    id: "3",
    name: "Dr. Divya Patel",
    location: "Ahmedabad",
    rating: 5,
    review:
      "Fast dispatch, gorgeous unboxing packaging, and the cotton weave is heavenly. It holds its silhouette beautifully after multiple gentle washes. Velaash is my new staple.",
    productName: "Everyday Classic Straight Kurta",
  },
];

export interface ClientTestimonialsProps {
  headline?: string;
  subtitle?: string;
  items?: TestimonialItem[];
}

export function ClientTestimonials({
  headline = "Cherished by Our Patrons",
  subtitle = "Real experiences from women who celebrate everyday grace in our tailored silhouettes.",
  items,
}: ClientTestimonialsProps) {
  const displayItems = items && items.length > 0 ? items : DEFAULT_TESTIMONIALS;

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-brand-border/60">
      <Container size="xl">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center space-y-2 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 text-brand-gold text-xs font-semibold tracking-widest uppercase">
            <Heart className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
            <span>Velaash Women</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-brand-dark tracking-tight">
            {headline}
          </h2>
          <p className="text-brand-muted text-xs sm:text-sm font-sans">
            {subtitle}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {displayItems.map((item, idx) => {
            const rating = item.rating || 5;
            return (
              <div
                key={item.id || idx}
                className="p-6 sm:p-8 rounded-2xl bg-brand-cream/20 border border-brand-border/70 hover:border-brand-gold/40 hover:shadow-luxury transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="text-xs sm:text-sm font-sans text-brand-dark/90 leading-relaxed italic">
                    &ldquo;{item.review}&rdquo;
                  </p>
                </div>

                {/* Author & Verification */}
                <div className="pt-6 mt-6 border-t border-brand-border/50 flex items-center justify-between">
                  <div>
                    <h4 className="font-heading text-sm font-semibold text-brand-dark">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-brand-muted">
                      {item.location || "India"}
                      {item.productName || item.product_name
                        ? ` • ${item.productName || item.product_name}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified Buyer</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
