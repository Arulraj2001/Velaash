import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";
import { getCustomerAddresses, SavedAddressesView } from "@/features/addresses";

export const metadata: Metadata = {
  title: "Saved Addresses | Velaash",
  description: "Manage your saved delivery destinations for quick checkout.",
};

export default async function AddressesPage() {
  const authData = await getCurrentUser();

  if (!authData || !authData.user) {
    redirect("/account/login?returnUrl=/account/addresses");
  }

  const addresses = await getCustomerAddresses(authData.user.id);

  return <SavedAddressesView initialAddresses={addresses} />;
}
