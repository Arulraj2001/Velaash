import * as React from "react";
import { getNavigationCategories } from "@/features/navigation";
import { getSiteSettings } from "@/features/settings";
import { HeaderClient } from "./header-client";

export async function Header() {
  const [categories, { storeProfile, announcement }] = await Promise.all([
    getNavigationCategories(),
    getSiteSettings(),
  ]);

  return (
    <HeaderClient
      categories={categories}
      logoUrl={storeProfile.logo_url || "/logo.png"}
      storeName={storeProfile.name}
      whatsappNumber={storeProfile.whatsapp_number}
      whatsappUrl={storeProfile.whatsapp_url}
      announcement={announcement}
    />
  );
}
