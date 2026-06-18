// Classes Tailwind reutilizaveis (mantem o visual consistente entre as telas).
export const cls = {
  input:
    "w-full rounded border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand",
  btn:
    "rounded bg-brand px-3 py-2 text-sm font-medium text-brand-fg transition hover:opacity-90 disabled:opacity-60",
  btnGhost:
    "rounded border border-border px-3 py-1.5 text-sm transition hover:border-brand",
  btnDanger:
    "rounded border border-red-300 px-2 py-1 text-xs text-red-600 transition hover:bg-red-50",
  label: "text-sm font-medium",
  card: "rounded border border-border p-4",
  th: "border-b border-border px-3 py-2 text-left text-xs font-semibold text-muted",
  td: "border-b border-border px-3 py-2 text-sm",
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
