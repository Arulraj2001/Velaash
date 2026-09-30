"use client";

import React, { useEffect, Suspense } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useCookieConsent } from "../hooks/use-cookie-consent";
import { trackPageView } from "../utils/track";

function AnalyticsContent() {
  const { consent, isMounted } = useCookieConsent();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim();

  // Automatic page_view event on route transitions when consent is active
  useEffect(() => {
    if (consent === "all") {
      const fullPath = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      trackPageView(fullPath);
    }
  }, [pathname, searchParams, consent]);

  // CRITICAL CONSENT GATE:
  // If visitor has not mounted or has NOT granted full consent ("all"),
  // return null. Absolutely no tracking scripts are injected into the DOM.
  if (!isMounted || consent !== "all") {
    return null;
  }

  // If no analytics IDs are configured in environment variables, skip cleanly
  if (!ga4Id && !pixelId && !clarityId) {
    return null;
  }

  return (
    <>
      {/* 1. Google Analytics 4 (GA4) */}
      {ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}', {
                page_path: window.location.pathname,
                anonymize_ip: true
              });
            `}
          </Script>
        </>
      )}

      {/* 2. Meta Pixel */}
      {pixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* 3. Microsoft Clarity */}
      {clarityId && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      )}
    </>
  );
}

export function AnalyticsScripts() {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  );
}
