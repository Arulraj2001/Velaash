import {
  HeroSlideSchema,
  HeroBannerContentSchema,
  OccasionCardSchema,
  OccasionStripContentSchema,
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
