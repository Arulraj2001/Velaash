import type {
  HomepageSectionKind,
  HeroBannerContent,
  CategoryGridContent,
  FeaturedProductsContent,
  CoutureSpotlightContent,
  TestimonialsContent,
  ValueStripContent,
  NewsletterContent,
} from "@/features/admin/types/homepage";

export interface LiveHomepageSection {
  id: string;
  section_type: HomepageSectionKind;
  title: string | null;
  display_order: number;
  is_active: boolean;
  content:
    | HeroBannerContent
    | CategoryGridContent
    | FeaturedProductsContent
    | CoutureSpotlightContent
    | TestimonialsContent
    | ValueStripContent
    | NewsletterContent
    | Record<string, unknown>;
}
