"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/queries/get-admin-user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PRODUCT_IMAGES_BUCKET,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
  ensureProductImagesBucket,
} from "../utils/storage";
import type { HomepageSectionType, Json } from "@/types/database.types";
import {
  HOMEPAGE_SECTION_TYPES,
  type HomepageSectionKind,
  type AdminHomepageSection,
  type ReorderSectionUpdate,
  HeroBannerContentSchema,
  CategoryGridContentSchema,
  FeaturedProductsContentSchema,
  ValueStripContentSchema,
  NewsletterContentSchema,
} from "../types/homepage";

export interface HomepageActionResult {
  success: boolean;
  message?: string;
  error?: string;
  sectionId?: string;
}

/**
 * Revalidates public homepage and admin builder.
 */
function revalidateHomepagePaths() {
  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

/**
 * Default initial sections if database has none.
 */
const DEFAULT_INITIAL_SECTIONS: Omit<AdminHomepageSection, "id">[] = [
  {
    section_type: "hero_banner",
    title: "Modern Everyday Luxury",
    display_order: 1,
    is_active: true,
    content: {
      headline: "Modern Everyday Luxury",
      subtitle: "Effortless silhouettes, refined textures, and contemporary wardrobe essentials designed for everyday elegance.",
      cta_text: "Explore Collection",
      cta_link: "/shop",
      secondary_cta_text: "Kurtas & Sets",
      secondary_cta_link: "/collections/kurtas-sets",
      bg_image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
    },
  },
  {
    section_type: "category_grid",
    title: "Explore by Category",
    display_order: 2,
    is_active: true,
    content: {
      title: "Explore by Category",
      subtitle: "Thoughtfully tailored pieces across modern everyday silhouettes.",
    },
  },
  {
    section_type: "featured_products",
    title: "Featured Arrivals",
    display_order: 3,
    is_active: true,
    content: {
      title: "Featured Arrivals",
      subtitle: "Handpicked styles from our collection.",
      mode: "auto",
      product_ids: [],
      limit: 8,
    },
  },
  {
    section_type: "value_strip",
    title: "Our Commitments",
    display_order: 4,
    is_active: true,
    content: {
      title: "Our Commitments",
      items: [
        {
          icon: "Truck",
          title: "Pan-India Delivery",
          description: "Reliable domestic shipping across all serviceable PIN codes.",
        },
        {
          icon: "RotateCcw",
          title: "Easy Returns",
          description: "Hassle-free return and exchange assistance for unworn items.",
        },
        {
          icon: "ShieldCheck",
          title: "Secure Payments",
          description: "100% encrypted checkout with UPI, Cards, and Net Banking.",
        },
        {
          icon: "MessageCircle",
          title: "WhatsApp Support",
          description: "Direct assistance and sizing guidance on +91 8508643832.",
        },
      ],
    },
  },
  {
    section_type: "newsletter",
    title: "Stay In Touch",
    display_order: 5,
    is_active: true,
    content: {
      headline: "Join the Velaash Circle",
      subtext: "Subscribe to receive updates on new arrivals, seasonal collections, and wardrobe inspiration directly to your inbox.",
    },
  },
];

/**
 * Normalizes a raw database row into an AdminHomepageSection.
 */
function normalizeSectionRow(row: Record<string, unknown>): AdminHomepageSection {
  let section_type: HomepageSectionKind = row.section_type as HomepageSectionKind;
  if (row.section_type === "custom_html" || row.section_type === "newsletter") {
    section_type = "newsletter";
  }

  // Ensure content object
  const content =
    row.content && typeof row.content === "object" ? (row.content as Record<string, unknown>) : {};

  return {
    id: String(row.id),
    section_type,
    title: (row.title as string) || "",
    display_order: typeof row.display_order === "number" ? row.display_order : 0,
    is_active: Boolean(row.is_active),
    content,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

/**
 * Fetches all homepage sections for the admin builder.
 * Deduplicates and sorts by display_order.
 */
export async function getAdminHomepageSectionsAction(): Promise<AdminHomepageSection[]> {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("homepage_sections")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
      // Seed default initial sections if table is completely empty
      return DEFAULT_INITIAL_SECTIONS.map((s, idx) => ({
        ...s,
        id: `mock-${idx + 1}`,
      }));
    }

    // Deduplicate duplicate seeded types if any, preferring lowest display_order
    const seenTypes = new Set<string>();
    const normalized: AdminHomepageSection[] = [];

    for (const row of data) {
      const section = normalizeSectionRow(row);
      // If we haven't seen this type yet, keep it
      if (!seenTypes.has(section.section_type)) {
        seenTypes.add(section.section_type);
        normalized.push(section);
      }
    }

    // Re-assign display_order sequentially 1, 2, 3...
    normalized.sort((a, b) => a.display_order - b.display_order);

    return normalized;
  } catch (err) {
    console.error("Failed to load admin homepage sections:", err);
    return DEFAULT_INITIAL_SECTIONS.map((s, idx) => ({
      ...s,
      id: `fallback-${idx + 1}`,
    }));
  }
}

/**
 * Updates a homepage section's title, is_active, and typed content JSONB.
 * Permission: manage_homepage (Owner only).
 */
export async function updateHomepageSectionAction(
  id: string,
  input: {
    title?: string;
    is_active?: boolean;
    content: Record<string, unknown>;
  }
): Promise<HomepageActionResult> {
  try {
    await requireAdmin("manage_homepage");

    const adminClient = createAdminClient();

    // Fetch current section to identify type
    const { data: current, error: fetchErr } = await adminClient
      .from("homepage_sections")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !current) {
      return { success: false, error: "Section not found." };
    }

    const sectionType: HomepageSectionKind =
      current.section_type === "custom_html"
        ? "newsletter"
        : (current.section_type as HomepageSectionKind);

    // Validate content according to type
    let validatedContent = input.content;

    if (sectionType === "hero_banner") {
      const parsed = HeroBannerContentSchema.safeParse(input.content);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
      }
      validatedContent = parsed.data;
    } else if (sectionType === "category_grid") {
      const parsed = CategoryGridContentSchema.safeParse(input.content);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
      }
      validatedContent = parsed.data;
    } else if (sectionType === "featured_products") {
      const parsed = FeaturedProductsContentSchema.safeParse(input.content);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
      }
      validatedContent = parsed.data;
    } else if (sectionType === "value_strip") {
      const parsed = ValueStripContentSchema.safeParse(input.content);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
      }
      validatedContent = parsed.data;
    } else if (sectionType === "newsletter") {
      const parsed = NewsletterContentSchema.safeParse(input.content);
      if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
      }
      validatedContent = parsed.data;
    }

    const { error: updateErr } = await adminClient
      .from("homepage_sections")
      .update({
        title: input.title !== undefined ? input.title : current.title,
        is_active: input.is_active !== undefined ? input.is_active : current.is_active,
        content: validatedContent as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    revalidateHomepagePaths();
    return { success: true, message: "Section saved successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update section.",
    };
  }
}

/**
 * Reorders homepage sections. Updates display_order for each section.
 * Permission: manage_homepage (Owner only).
 */
export async function reorderHomepageSectionsAction(
  updates: ReorderSectionUpdate[]
): Promise<HomepageActionResult> {
  try {
    await requireAdmin("manage_homepage");

    if (!updates || updates.length === 0) {
      return { success: false, error: "No reorder updates provided." };
    }

    const adminClient = createAdminClient();

    for (const item of updates) {
      const { error } = await adminClient
        .from("homepage_sections")
        .update({
          display_order: item.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) {
        console.error(`Failed to update display order for section ${item.id}:`, error);
        return { success: false, error: `Failed to update display order: ${error.message}` };
      }
    }

    revalidateHomepagePaths();
    return { success: true, message: "Section order updated successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reorder sections.",
    };
  }
}

/**
 * Quick toggle for a section's is_active status.
 * Permission: manage_homepage (Owner only).
 */
export async function toggleHomepageSectionActiveAction(
  id: string,
  is_active: boolean
): Promise<HomepageActionResult> {
  try {
    await requireAdmin("manage_homepage");

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("homepage_sections")
      .update({
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidateHomepagePaths();
    return {
      success: true,
      message: `Section is now ${is_active ? "active" : "hidden"}.`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to toggle section status.",
    };
  }
}

/**
 * Creates a new homepage section (strictly limited to the 5 known types).
 * Permission: manage_homepage (Owner only).
 */
export async function createHomepageSectionAction(
  section_type: HomepageSectionKind,
  title?: string,
  content?: Record<string, unknown>
): Promise<HomepageActionResult> {
  try {
    await requireAdmin("manage_homepage");

    if (!HOMEPAGE_SECTION_TYPES.includes(section_type)) {
      return {
        success: false,
        error: `Invalid section type. Allowed types are: ${HOMEPAGE_SECTION_TYPES.join(", ")}`,
      };
    }

    const adminClient = createAdminClient();

    // Get max display_order to append to end
    const { data: existing } = await adminClient
      .from("homepage_sections")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.display_order ?? 0) + 1;

    // Default template content
    let defaultContent: Record<string, unknown> = content || {};
    let defaultTitle = title || "";

    if (section_type === "hero_banner") {
      defaultTitle = defaultTitle || "Hero Banner";
      defaultContent = {
        headline: "Modern Everyday Luxury",
        subtitle: "Effortless silhouettes and contemporary styles designed for everyday refinement.",
        cta_text: "Explore Collection",
        cta_link: "/shop",
        secondary_cta_text: "",
        secondary_cta_link: "",
        bg_image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85",
        ...defaultContent,
      };
    } else if (section_type === "category_grid") {
      defaultTitle = defaultTitle || "Explore Categories";
      defaultContent = {
        title: "Explore Categories",
        subtitle: "Thoughtfully tailored pieces across modern everyday silhouettes.",
        ...defaultContent,
      };
    } else if (section_type === "featured_products") {
      defaultTitle = defaultTitle || "Featured Arrivals";
      defaultContent = {
        title: "Featured Arrivals",
        subtitle: "Handpicked styles from our collection.",
        mode: "auto",
        product_ids: [],
        limit: 8,
        ...defaultContent,
      };
    } else if (section_type === "value_strip") {
      defaultTitle = defaultTitle || "Our Commitments";
      defaultContent = {
        title: "Our Commitments",
        items: [
          { icon: "Truck", title: "Pan-India Delivery", description: "Reliable domestic shipping across all serviceable PIN codes." },
          { icon: "RotateCcw", title: "Easy Returns", description: "Hassle-free return and exchange assistance." },
          { icon: "ShieldCheck", title: "Secure Payments", description: "100% encrypted & protected checkout." },
          { icon: "MessageCircle", title: "WhatsApp Support", description: "Personal assistance on +91 8508643832." },
        ],
        ...defaultContent,
      };
    } else if (section_type === "newsletter") {
      defaultTitle = defaultTitle || "Newsletter Signup";
      defaultContent = {
        headline: "Join the Velaash Circle",
        subtext: "Subscribe to receive updates on new arrivals and seasonal collections.",
        ...defaultContent,
      };
    }

    // Try inserting with section_type; if newsletter enum is not yet in postgres, fallback to custom_html
    let dbType: string = section_type;
    let insertRes = await adminClient
      .from("homepage_sections")
      .insert({
        section_type: dbType as HomepageSectionType,
        title: defaultTitle,
        display_order: nextOrder,
        is_active: true,
        content: defaultContent as unknown as Json,
      })
      .select("id")
      .single();

    if (insertRes.error && section_type === "newsletter") {
      // Fallback to custom_html
      dbType = "custom_html";
      insertRes = await adminClient
        .from("homepage_sections")
        .insert({
          section_type: dbType as HomepageSectionType,
          title: defaultTitle,
          display_order: nextOrder,
          is_active: true,
          content: { ...defaultContent, section_kind: "newsletter" } as unknown as Json,
        })
        .select("id")
        .single();
    }

    if (insertRes.error) {
      return { success: false, error: insertRes.error.message };
    }

    revalidateHomepagePaths();
    return {
      success: true,
      message: "New section created successfully.",
      sectionId: insertRes.data.id,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create section.",
    };
  }
}

/**
 * Deletes a homepage section.
 * Permission: manage_homepage (Owner only).
 */
export async function deleteHomepageSectionAction(id: string): Promise<HomepageActionResult> {
  try {
    await requireAdmin("manage_homepage");

    const adminClient = createAdminClient();
    const { error } = await adminClient.from("homepage_sections").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidateHomepagePaths();
    return { success: true, message: "Section deleted successfully." };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete section.",
    };
  }
}

/**
 * Uploads an image for hero banner or homepage sections.
 * Permission: manage_homepage (Owner only).
 */
export async function uploadHomepageImageAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    await requireAdmin("manage_homepage");

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No image file provided." };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Please upload a JPG, PNG, or WebP image.",
      };
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return { success: false, error: "File size exceeds the 5MB maximum limit." };
    }

    await ensureProductImagesBucket();
    const adminClient = createAdminClient();

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `hero-${crypto.randomUUID()}.${ext}`;
    const storagePath = `homepage/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await adminClient.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      console.error("Homepage image upload failed:", uploadErr);
      return { success: false, error: "Failed to upload image to storage." };
    }

    const {
      data: { publicUrl },
    } = adminClient.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);

    return { success: true, url: publicUrl };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload homepage image.",
    };
  }
}
