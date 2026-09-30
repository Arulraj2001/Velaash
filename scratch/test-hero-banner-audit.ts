import { HeroSlideSchema, HeroBannerContentSchema } from "../features/admin/types/homepage";

function runHeroBannerAuditTests() {
  console.log("=== RUNNING HERO BANNER AUDIT SUITE ===");
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

  // Test 1: Valid Hero Slide schema
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

  // Test 2: Hero Slide requires headline
  const invalidHeadline = { ...validSlide, headline: "   " };
  const headlineRes = HeroSlideSchema.safeParse(invalidHeadline);
  assert("HeroSlideSchema rejects empty headline", !headlineRes.success);

  // Test 3: Hero Slide requires cta_text and cta_link
  const invalidCta = { ...validSlide, cta_text: "" };
  assert("HeroSlideSchema rejects empty cta_text", !HeroSlideSchema.safeParse(invalidCta).success);

  const invalidLink = { ...validSlide, cta_link: "" };
  assert("HeroSlideSchema rejects empty cta_link", !HeroSlideSchema.safeParse(invalidLink).success);

  // Test 4: Hero Slide requires bg_image
  const invalidImage = { ...validSlide, bg_image: "  " };
  assert("HeroSlideSchema rejects empty bg_image", !HeroSlideSchema.safeParse(invalidImage).success);

  // Test 5: HeroBannerContentSchema accepts root content and slides array
  const bannerContent = {
    headline: "Contemporary Indian Luxury",
    subtitle: "Airy fabrics and timeless silhouettes.",
    cta_text: "Shop New Season",
    cta_link: "/shop",
    bg_image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",
    slides: [validSlide],
  };
  const bannerRes = HeroBannerContentSchema.safeParse(bannerContent);
  assert("HeroBannerContentSchema validates correctly", bannerRes.success);

  // Test 6: URL normalization logic
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
  assert("normalizeLink handles collections/kurtas-sets", normalizeLink("collections/kurtas-sets") === "/collections/kurtas-sets");

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runHeroBannerAuditTests();
