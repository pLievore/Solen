// Classes Tailwind reutilizaveis (mantem o visual consistente entre as telas).
export const cls = {
  input:
    "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10",
  label: "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted",

  // Botoes
  btn:
    "inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg shadow-sm transition hover:bg-brand-dark hover:shadow-brand/40 active:scale-[.98] disabled:opacity-60 disabled:hover:bg-brand",
  btnGhost:
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm font-medium text-fg transition hover:border-brand hover:bg-surface-2 active:scale-[.98]",
  btnDanger:
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100 active:scale-[.98]",

  // Superficies
  card: "rounded-xl border border-border bg-bg p-5 shadow-sm",
  cardMuted: "rounded-xl border border-border bg-surface p-5 shadow-xs",

  // Tabelas
  th: "border-b border-border px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted",
  td: "border-b border-border px-3 py-3 text-sm",
};

// Concatenacao de classes condicional (filtra falsy).
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// Variantes de selo/etiqueta.
const BADGE_TONES: Record<string, string> = {
  neutral: "bg-surface-2 text-fg/70 ring-1 ring-inset ring-border",
  brand: "bg-brand-subtle text-brand-subtle-fg ring-1 ring-inset ring-brand/20",
  blue: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  green: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
};

export function badge(tone: keyof typeof BADGE_TONES = "neutral"): string {
  return cn(
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
    BADGE_TONES[tone] ?? BADGE_TONES.neutral,
  );
}

export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatBRLInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
