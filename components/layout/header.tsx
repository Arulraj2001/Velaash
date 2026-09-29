import * as React from "react";
import { getNavigationCategories } from "@/features/navigation";
import { HeaderClient } from "./header-client";

export async function Header() {
  const categories = await getNavigationCategories();

  return <HeaderClient categories={categories} />;
}
