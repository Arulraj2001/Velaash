"use client";

import dynamic from "next/dynamic";

const CookieConsentBanner = dynamic(
  () => import("./cookie-consent-banner").then((mod) => mod.CookieConsentBanner),
  { ssr: false }
);

export function DeferredCookieConsentBanner() {
  return <CookieConsentBanner />;
}
