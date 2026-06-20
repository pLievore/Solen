// Classes Tailwind reutilizaveis (mantem o visual consistente entre as telas).
export const cls = {
  input:
    "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10",
  btn:
    "rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg shadow-sm transition hover:bg-brand-dark disabled:opacity-60",
  btnGhost:
    "rounded-lg border border-border px-3 py-1.5 text-sm transition hover:border-brand hover:bg-border/30",
  btnDanger:
    "rounded-lg border border-red-300 px-2 py-1 text-xs text-red-600 transition hover:bg-red-50",
  label: "text-sm font-medium",
  card: "rounded-xl border border-border bg-surface p-5 shadow-sm",
  th: "border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted",
  td: "border-b border-border px-3 py-2.5 text-sm",
};

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
