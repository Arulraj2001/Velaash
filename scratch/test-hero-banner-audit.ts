import {
  HeroSlideSchema,
  HeroBannerContentSchema,
  OccasionCardSchema,
  OccasionStripContentSchema,
  CategoryGridContentSchema,
  FeaturedProductsContentSchema,
  CoutureSpotlightContentSchema,
  TestimonialItemSchema,
  TestimonialsContentSchema,
} from "../features/admin/types/homepage";

function runHomepageAuditTests() {
  console.log("=== RUNNING HOMEPAGE BUILDER AUDIT SUITE ===");
  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  // --- SECTION 1: HERO BANNER TESTS ---
  const validSlide = {
    id: "slide-test-1",
    tag: "Spring 2026",
    headline: "Contemporary Indian Luxury",
    subtitle: "Airy fabrics and timeless silhouettes.",
    cta_text: "Shop New Season",
    cta_link: "/shop",
    secondary_cta_text: "Kurtas",
    secondary_cta_link: "/collections/kurtas-sets",
    bg_image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",
  };
  const slideRes = HeroSlideSchema.safeParse(validSlide);
  assert("HeroSlideSchema accepts valid slide", slideRes.success);

  const invalidHeadline = { ...validSlide, headline: "   " };
  assert("HeroSlideSchema rejects empty headline", !HeroSlideSchema.safeParse(invalidHeadline).success);

  const invalidCta = { ...validSlide, cta_text: "" };
  assert("HeroSlideSchema rejects empty cta_text", !HeroSlideSchema.safeParse(invalidCta).success);

  const invalidLink = { ...validSlide, cta_link: "" };
  assert("HeroSlideSchema rejects empty cta_link", !HeroSlideSchema.safeParse(invalidLink).success);

  const invalidImage = { ...validSlide, bg_image: "  " };
  assert("HeroSlideSchema rejects empty bg_image", !HeroSlideSchema.safeParse(invalidImage).success);

  const bannerContent = {
    headline: "Contemporary Indian Luxury",
    subtitle: "Airy fabrics and timeless silhouettes.",
    cta_text: "Shop New Season",
    cta_link: "/shop",
    bg_image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",
    slides: [validSlide],
  };
  assert("HeroBannerContentSchema validates correctly", HeroBannerContentSchema.safeParse(bannerContent).success);

  // --- SECTION 2: OCCASION STRIP TESTS ---
  const validOccasion = {
    id: "occ-1",
    name: "Festive Capsule",
    subtitle: "Zari & Silk Blends",
    slug: "festive",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b",
    href: "/collections/kurtas-sets",
  };
  assert("OccasionCardSchema accepts valid card", OccasionCardSchema.safeParse(validOccasion).success);

  const invalidOccasionName = { ...validOccasion, name: "  " };
  assert("OccasionCardSchema rejects empty name", !OccasionCardSchema.safeParse(invalidOccasionName).success);

  const invalidOccasionHref = { ...validOccasion, href: "" };
  assert("OccasionCardSchema rejects empty href", !OccasionCardSchema.safeParse(invalidOccasionHref).success);

  const invalidOccasionImg = { ...validOccasion, image: " " };
  assert("OccasionCardSchema rejects empty image", !OccasionCardSchema.safeParse(invalidOccasionImg).success);

  const occasionStripContent = {
    title: "Shop by Occasion",
    subtitle: "Thoughtfully curated palettes and cuts.",
    items: [validOccasion],
  };
  assert(
    "OccasionStripContentSchema validates correctly",
    OccasionStripContentSchema.safeParse(occasionStripContent).success
  );

  // --- SECTION 3: CATEGORY GRID TESTS ---
  const validCategoryGrid = {
    title: "Explore Categories",
    subtitle: "Thoughtfully tailored pieces across modern everyday silhouettes.",
  };
  assert("CategoryGridContentSchema accepts valid title and subtitle", CategoryGridContentSchema.safeParse(validCategoryGrid).success);

  const defaultCategoryGrid = {};
  const parsedDefault = CategoryGridContentSchema.safeParse(defaultCategoryGrid);
  assert("CategoryGridContentSchema applies defaults when empty", parsedDefault.success && parsedDefault.data.title === "Explore Categories");

  // --- SECTION 4: FEATURED PRODUCTS TESTS ---
  const validAutoFeatured = {
    title: "Featured Arrivals",
    subtitle: "Handpicked styles from our collection.",
    mode: "auto",
    product_ids: [],
    limit: 12,
  };
  assert(
    "FeaturedProductsContentSchema accepts valid auto config with limit 12",
    FeaturedProductsContentSchema.safeParse(validAutoFeatured).success
  );

  const validManualFeatured = {
    title: "Curated Silk Sets",
    subtitle: "Handpicked styles.",
    mode: "manual",
    product_ids: ["prod-1", "prod-2", "prod-3"],
    limit: 8,
  };
  const parsedManual = FeaturedProductsContentSchema.safeParse(validManualFeatured);
  assert(
    "FeaturedProductsContentSchema accepts manual mode with product_ids",
    parsedManual.success && parsedManual.data.product_ids.length === 3
  );

  const invalidMode = { ...validAutoFeatured, mode: "invalid_mode" };
  assert(
    "FeaturedProductsContentSchema rejects invalid mode",
    !FeaturedProductsContentSchema.safeParse(invalidMode).success
  );

  // --- SECTION 5: COUTURE SPOTLIGHT TESTS ---
  const validCouture = {
    tagline: "Artisanal Craft & Slow Fashion",
    headline: "Consciously Crafted. Designed for Everyday Grace.",
    description: "At Velaash, we reject disposable seasonal trends.",
    image_url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e",
    detail_badge_title: "The Velaash Touch",
    detail_badge_text: "Hand-finished hems.",
    cta_text: "Explore The Full Catalog",
    cta_link: "/shop",
  };
  assert(
    "CoutureSpotlightContentSchema accepts valid couture spotlight config",
    CoutureSpotlightContentSchema.safeParse(validCouture).success
  );

  const defaultCouture = {};
  const parsedCoutureDefault = CoutureSpotlightContentSchema.safeParse(defaultCouture);
  assert(
    "CoutureSpotlightContentSchema applies defaults when empty",
    parsedCoutureDefault.success && parsedCoutureDefault.data.headline === "Consciously Crafted. Designed for Everyday Grace."
  );

  const invalidCoutureHeadline = { ...validCouture, headline: "" };
  assert(
    "CoutureSpotlightContentSchema rejects empty headline",
    !CoutureSpotlightContentSchema.safeParse(invalidCoutureHeadline).success
  );

  // --- SECTION 6: CLIENT TESTIMONIALS TESTS ---
  const validTestimonial = {
    id: "testi-1",
    name: "Ananya Sharma",
    location: "Mumbai",
    rating: 5,
    review: "The fabric quality of the Chanderi Kurta set is simply unmatched.",
    product_name: "Chanderi Anarkali Set",
  };
  assert(
    "TestimonialItemSchema accepts valid testimonial item",
    TestimonialItemSchema.safeParse(validTestimonial).success
  );

  const invalidTestimonialName = { ...validTestimonial, name: " " };
  assert(
    "TestimonialItemSchema rejects empty customer name",
    !TestimonialItemSchema.safeParse(invalidTestimonialName).success
  );

  const invalidTestimonialReview = { ...validTestimonial, review: "" };
  assert(
    "TestimonialItemSchema rejects empty review quote",
    !TestimonialItemSchema.safeParse(invalidTestimonialReview).success
  );

  const validTestimonialsSection = {
    headline: "Cherished by Our Patrons",
    subtitle: "Real experiences from women who celebrate everyday grace.",
    items: [validTestimonial],
  };
  assert(
    "TestimonialsContentSchema validates correctly",
    TestimonialsContentSchema.safeParse(validTestimonialsSection).success
  );

  const defaultTestimonials = {};
  const parsedTestiDefault = TestimonialsContentSchema.safeParse(defaultTestimonials);
  assert(
    "TestimonialsContentSchema applies defaults when empty",
    parsedTestiDefault.success && parsedTestiDefault.data.headline === "Cherished by Our Patrons"
  );

  // URL normalization logic
  const normalizeLink = (url: string | undefined): string => {
    if (!url) return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (
      trimmed.startsWith("/") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("mailto:") ||
      trimmed.startsWith("tel:")
    ) {
      return trimmed;
    }
    return `/${trimmed}`;
  };

  assert("normalizeLink leaves /shop unchanged", normalizeLink("/shop") === "/shop");
  assert("normalizeLink turns 'shop' into '/shop'", normalizeLink("shop") === "/shop");
  assert(
    "normalizeLink leaves https://example.com unchanged",
    normalizeLink("https://example.com") === "https://example.com"
  );
  assert(
    "normalizeLink handles collections/kurtas-sets",
    normalizeLink("collections/kurtas-sets") === "/collections/kurtas-sets"
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runHomepageAuditTests();
