"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const KEY = "vendy_lgpd_accepted";

export default function LgpdBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (!localStorage.getItem(KEY)) setVisible(true);
  }, [pathname]);

  function accept() {
    localStorage.setItem(KEY, "1");
    setVisible(false);
  }

  if (pathname.startsWith("/admin") || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg px-4 py-3 shadow-lg sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Usamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa{" "}
          <a href="/privacidade" className="underline hover:text-brand">
            política de privacidade
          </a>
          .
        </p>
        <button
          onClick={accept}
          className="rounded bg-brand px-4 py-1.5 text-sm font-medium text-brand-fg hover:opacity-90"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
