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
  headline = "Loved by Our Customers",
  subtitle = "Real experiences from customers who celebrate quality and everyday grace.",
  items,
}: ClientTestimonialsProps) {
  const displayItems = items && items.length > 0 ? items : DEFAULT_TESTIMONIALS;

  return (
    <section className="py-12 sm:py-16 bg-luxury-dots-cream border-b border-brand-border/60 relative">
      <Container size="xl">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center space-y-2 mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 text-brand-gold text-xs font-semibold tracking-widest uppercase">
            <Heart className="w-3 h-3 fill-brand-gold text-brand-gold" />
            <span>Customer Reviews</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-brand-dark tracking-tight">
            {headline}
          </h2>
          <p className="text-brand-muted text-xs sm:text-sm font-sans">
            {subtitle}
          </p>
        </div>

        {/* Minimal Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {displayItems.map((item, idx) => {
            const rating = Math.min(5, Math.max(1, Math.round(item.rating || 5)));
            return (
              <div
                key={item.id || idx}
                className="p-5 sm:p-6 rounded-xl bg-white/95 border border-brand-border/60 hover:border-brand-gold/60 hover:shadow-luxury transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Rating Stars - Minimal */}
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="text-xs sm:text-[13px] font-sans text-brand-dark/90 leading-relaxed">
                    &ldquo;{item.review}&rdquo;
                  </p>
                </div>

                {/* Minimal Author & Verification */}
                <div className="pt-4 mt-4 border-t border-brand-border/40 flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-xs sm:text-sm font-semibold text-brand-dark">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-brand-muted truncate max-w-[180px]">
                      {item.location || "India"}
                      {item.productName || item.product_name
                        ? ` • ${item.productName || item.product_name}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-medium text-[10px] tracking-wide uppercase">Verified</span>
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
