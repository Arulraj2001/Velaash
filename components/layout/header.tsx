import * as React from "react";
import { getNavigationCategories } from "@/features/navigation";
import { getSiteSettings } from "@/features/settings";
import { HeaderClient } from "./header-client";

export async function Header() {
  const [categories, { storeProfile }] = await Promise.all([
    getNavigationCategories(),
    getSiteSettings(),
  ]);

  return (
    <HeaderClient
      categories={categories}
      whatsappNumber={storeProfile.whatsapp_number}
      whatsappUrl={storeProfile.whatsapp_url}
    />
  );
}
