"use client";

import { useEffect, useState } from "react";

const KEY = "vendy_lgpd_accepted";
type Choice = "accepted" | "rejected" | null;

export default function CookiePreferences() {
  const [choice, setChoice] = useState<Choice>(null);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    setChoice(
      saved === "accepted" || saved === "rejected" ? saved : null,
    );
  }, []);

  function choose(value: Exclude<Choice, null>) {
    localStorage.setItem(KEY, value);
    window.dispatchEvent(
      new CustomEvent("vendy-consent-changed", { detail: value }),
    );
    setChoice(value);
  }

  return (
    <div className="not-prose rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold">Preferência atual</p>
      <p className="mt-1 text-sm text-muted">
        {choice === "accepted"
          ? "Analytics autorizado."
          : choice === "rejected"
            ? "Analytics recusado."
            : "Nenhuma escolha registrada neste navegador."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => choose("rejected")}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:border-brand"
        >
          Recusar analytics
        </button>
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition hover:bg-brand-dark"
        >
          Autorizar analytics
        </button>
      </div>
    </div>
  );
}
