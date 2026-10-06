export interface CategoryBannerConfig {
  imageUrl: string;
  badge: string;
  description: string;
}

export const CATEGORY_BANNER_MAP: Record<string, CategoryBannerConfig> = {
  women: {
    imageUrl: "/categories/kurtas-sets.jpg",
    badge: "Women's Collection",
    description:
      "Handcrafted silhouettes in pure cottons, festive jewel tones, elegant sarees, and artisanal coordinated sets.",
  },
  sarees: {
    imageUrl: "/categories/sarees.jpg",
    badge: "Heritage Handloom Weaves",
    description:
      "Authentic Kanjeevaram silks, Chanderi drapes, and lightweight linen sarees with intricate temple zari borders.",
  },
  "kurtas-sets": {
    imageUrl: "/categories/kurtas-sets.jpg",
    badge: "Timeless Indian Weaves",
    description:
      "Handcrafted Chanderi, pure mulmul cottons, and festive anarkalis with refined zari detailing for celebratory moments and everyday poise.",
  },
  dresses: {
    imageUrl: "/categories/dresses.jpg",
    badge: "Effortless Silhouettes",
    description:
      "Flowing midis, sweeping maxis, and breezy tiered dresses crafted in lightweight, breathable weaves tailored for relaxed sophistication.",
  },
  "co-ord-sets": {
    imageUrl: "/categories/kurtas-sets.jpg",
    badge: "Contemporary Ensembles",
    description:
      "Effortlessly paired tops and fluid bottoms tailored for everyday poise, warm afternoons, and statement evening soirees.",
  },
  "coord-sets": {
    imageUrl: "/categories/kurtas-sets.jpg",
    badge: "Contemporary Ensembles",
    description:
      "Effortlessly paired tops and fluid bottoms tailored for everyday poise, warm afternoons, and statement evening soirees.",
  },
  "tops-shirts": {
    imageUrl: "/categories/tops-shirts.jpg",
    badge: "Everyday Versatility",
    description:
      "Crisp cotton shirts, artisanal tunics, and delicately pleated blouses designed to pair seamlessly with tailored trousers or denims.",
  },
  "tops-tunics": {
    imageUrl: "/categories/tops-shirts.jpg",
    badge: "Everyday Versatility",
    description:
      "Crisp cotton shirts, artisanal tunics, and delicately pleated blouses designed to pair seamlessly with tailored trousers or denims.",
  },
  bottoms: {
    imageUrl: "/categories/bottoms.jpg",
    badge: "Tailored Ease",
    description:
      "Structured trousers, airy palazzos, and fluid culottes engineered with flexible comfort and clean, flattering waistlines.",
  },
  "pants-trousers": {
    imageUrl: "/categories/bottoms.jpg",
    badge: "Tailored Ease",
    description:
      "Structured trousers, airy palazzos, and fluid culottes engineered with flexible comfort and clean, flattering waistlines.",
  },
  loungewear: {
    imageUrl: "/categories/loungewear.jpg",
    badge: "Serene Comfort",
    description:
      "Featherlight mulmul sets, relaxed kaftans, and bedtime separates crafted for tranquil downtime and serene weekends at home.",
  },
  // Menswear
  men: {
    imageUrl: "/categories/men.jpg",
    badge: "Artisanal Menswear",
    description:
      "Classic kurtas, Kasavu-bordered veshtis, and breathable linen essentials handcrafted for celebration and daily comfort.",
  },
  "men-kurtas": {
    imageUrl: "/categories/men-kurtas.jpg",
    badge: "Festive & Classic Kurtas",
    description:
      "Handcrafted silk-cotton and khadi kurtas tailored with mandarin collars and subtle neck embroidery.",
  },
  "men-t-shirts": {
    imageUrl: "/categories/men-t-shirts.jpg",
    badge: "Organic Cotton Essentials",
    description:
      "Pre-shrunk, breathable organic cotton t-shirts and polos tailored for tropical warmth.",
  },
  "men-bottoms": {
    imageUrl: "/categories/men-bottoms.jpg",
    badge: "Traditional & Tailored Bottoms",
    description:
      "Pure cotton Kasavu veshtis and tailored drawstring linen trousers crafted for timeless poise.",
  },
  "men-shirts": {
    imageUrl: "/categories/tops-shirts.jpg",
    badge: "Tailored Shirts",
    description:
      "Breezy cotton and linen shirts tailored with mandarin and resort collars.",
  },
  // Sacred & Brassware
  "pooja-and-brass": {
    imageUrl: "/categories/pooja-and-brass.jpg",
    badge: "Sacred South Indian Heritage",
    description:
      "Handcrafted bronze and brass Kuthu Vilakku, urlis, and ritual accessories for temples and sanctified living spaces.",
  },
  "lamps-diyas": {
    imageUrl: "/categories/lamps-diyas.jpg",
    badge: "Sacred Deepams & Diyas",
    description:
      "Authentic brass Kuthu Vilakku, hanging deepams, and peacock oil lamps radiating traditional illumination.",
  },
  "pooja-accessories": {
    imageUrl: "/categories/pooja-accessories.jpg",
    badge: "Ritual & Pooja Essentials",
    description:
      "Panchapathiram, udharani, bells, and brass aarti thalis sculpted with traditional iconography.",
  },
  // Sub-categories mapping
  "straight-kurtas": {
    imageUrl: "/categories/kurtas-sets.jpg",
    badge: "Kurtas & Suits Collection",
    description: "Classic straight-cut silhouettes for effortless elegance, office wear, and everyday poise.",
  },
  "anarkali-flared-sets": {
    imageUrl: "/categories/kurtas-sets.jpg",
    badge: "Kurtas & Suits Collection",
    description: "Graceful flowing flares with coordinated dupattas and hand-touched artisanal finishes.",
  },
  "a-line-kurtas": {
    imageUrl: "/categories/kurtas-sets.jpg",
    badge: "Kurtas & Suits Collection",
    description: "Flattering A-line cuts tailored for comfortable daily movement and understated grace.",
  },
  "short-kurtis-tunics": {
    imageUrl: "/categories/kurtas-sets.jpg",
    badge: "Kurtas & Suits Collection",
    description: "Contemporary short kurtis crafted in breathable weaves, ideal for casual and college styling.",
  },
  "midi-dresses": {
    imageUrl: "/categories/dresses.jpg",
    badge: "Dresses Collection",
    description: "Flattering midi lengths tailored in breathable cottons and linens for effortless daywear.",
  },
  "maxi-dresses": {
    imageUrl: "/categories/dresses.jpg",
    badge: "Dresses Collection",
    description: "Sweeping hemlines with understated elegance, perfect for evening gatherings and celebrations.",
  },
  "wrap-tiered-dresses": {
    imageUrl: "/categories/dresses.jpg",
    badge: "Dresses Collection",
    description: "Tiered volume and cinch ties that flatter every silhouette with relaxed modern charm.",
  },
  "linen-coord-sets": {
    imageUrl: "/categories/kurtas-sets.jpg",
    badge: "Co-ord Sets Collection",
    description: "Pure European linen sets engineered for cool, breathable luxury across warm sunny days.",
  },
  "printed-coord-sets": {
    imageUrl: "/categories/kurtas-sets.jpg",
    badge: "Co-ord Sets Collection",
    description: "Artisanal hand-block and geometric motifs paired across contemporary silhouettes.",
  },
  "festive-coord-sets": {
    imageUrl: "/categories/kurtas-sets.jpg",
    badge: "Co-ord Sets Collection",
    description: "Subtle tone-on-tone embroidery and opulent drapes curated for cocktail and festive evenings.",
  },
  "tailored-shirts": {
    imageUrl: "/categories/tops-shirts.jpg",
    badge: "Tops & Shirts Collection",
    description: "Sharp collars and relaxed silhouettes crafted in crisp poplin and breathable organic cotton.",
  },
  "embroidered-tops": {
    imageUrl: "/categories/tops-shirts.jpg",
    badge: "Tops & Shirts Collection",
    description: "Delicate necklines and artisanal sleeve threadwork that elevate everyday pairing.",
  },
  "peplum-flared-tops": {
    imageUrl: "/categories/tops-shirts.jpg",
    badge: "Tops & Shirts Collection",
    description: "Cinched waists with breezy flared hems for graceful motion and modern comfort.",
  },
  "palazzos-culottes": {
    imageUrl: "/categories/bottoms.jpg",
    badge: "Bottoms Collection",
    description: "Wide-leg volume and breezy drape crafted in lightweight cottons with relaxed elastication.",
  },
  skirts: {
    imageUrl: "/categories/bottoms.jpg",
    badge: "Bottoms Collection",
    description: "Tiered and pleated statement skirts that twirl with ease across casual and festive settings.",
  },
  "lounge-sets": {
    imageUrl: "/categories/loungewear.jpg",
    badge: "Loungewear Collection",
    description: "Matching notch-collar sets in buttery-soft modal and mulmul for serene comfort at home.",
  },
  "kaftans-robes": {
    imageUrl: "/categories/loungewear.jpg",
    badge: "Loungewear Collection",
    description: "Airy silhouettes and flowy robes curated for peaceful weekends and gentle slow living.",
  },
};

export const DEFAULT_FALLBACK_CATEGORY_BANNER: CategoryBannerConfig = {
  imageUrl: "/categories/kurtas-sets.jpg",
  badge: "Curated Collection",
  description:
    "Discover contemporary clothing thoughtfully designed with refined fabrics, effortless cuts, and everyday grace.",
};

export function getCategoryBannerConfig(slug: string): CategoryBannerConfig {
  const normalized = slug.toLowerCase().trim();
  return CATEGORY_BANNER_MAP[normalized] || DEFAULT_FALLBACK_CATEGORY_BANNER;
}
