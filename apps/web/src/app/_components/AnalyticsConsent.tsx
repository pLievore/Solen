"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const KEY = "vendy_lgpd_accepted";

export default function AnalyticsConsent({ gaId }: { gaId?: string }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => {
      const accepted = localStorage.getItem(KEY) === "accepted";
      setAllowed(accepted);
      if (!gaId) return;

      const analyticsWindow = window as typeof window & {
        gtag?: (...args: unknown[]) => void;
        [key: `ga-disable-${string}`]: boolean;
      };
      analyticsWindow[`ga-disable-${gaId}`] = !accepted;
      analyticsWindow.gtag?.("consent", "update", {
        analytics_storage: accepted ? "granted" : "denied",
      });
    };
    sync();
    window.addEventListener("vendy-consent-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("vendy-consent-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [gaId]);

  if (!gaId || !allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="vendy-ga4" strategy="afterInteractive">
        {`window['ga-disable-${gaId}']=false;window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{analytics_storage:'granted'});gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true,page_path:window.location.pathname});`}
      </Script>
    </>
  );
}
