"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const KEY = "vendy_lgpd_accepted";

export default function LgpdBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const choice = localStorage.getItem(KEY);
    if (choice !== "accepted" && choice !== "rejected") setVisible(true);
  }, [pathname]);

  function choose(value: "accepted" | "rejected") {
    localStorage.setItem(KEY, value);
    window.dispatchEvent(
      new CustomEvent("vendy-consent-changed", { detail: value }),
    );
    setVisible(false);
  }

  if (pathname.startsWith("/admin") || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg px-4 py-3 shadow-lg sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Usamos cookies opcionais de analytics para melhorar sua experiência.{" "}
          <a href="/privacidade" className="underline hover:text-brand">
            política de privacidade
          </a>
          .
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => choose("rejected")}
            className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium transition hover:border-brand"
          >
            Recusar
          </button>
          <button
            onClick={() => choose("accepted")}
            className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-brand-fg hover:bg-brand-dark"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
