import type { StoreProfileSetting } from "../types";

export function getStoreContact(storeProfile: StoreProfileSetting) {
  const email = storeProfile.email.trim();
  const whatsappNumber = (storeProfile.whatsapp_number || storeProfile.phone).trim();
  const whatsappDigits = whatsappNumber.replace(/\D/g, "");

  return {
    email,
    whatsappNumber,
    whatsappUrl: whatsappDigits ? `https://wa.me/${whatsappDigits}` : "",
  };
}