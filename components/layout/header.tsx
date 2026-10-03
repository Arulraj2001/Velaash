import * as React from "react";
import { getNavigationCategories } from "@/features/navigation";
import { getSiteSettings, getStoreContact } from "@/features/settings";
import { HeaderClient } from "./header-client";

export async function Header() {
  const [categories, { storeProfile, announcement, shippingPolicy }] = await Promise.all([
    getNavigationCategories(),
    getSiteSettings(),
  ]);
  const { whatsappUrl } = getStoreContact(storeProfile);

  return (
    <HeaderClient
      categories={categories}
      shippingPolicy={shippingPolicy}
      logoUrl={storeProfile.logo_url || "/logo.png"}
      storeName={storeProfile.name}
      whatsappNumber={storeProfile.whatsapp_number}
      whatsappUrl={whatsappUrl}
      announcement={announcement}
    />
  );
}
