"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Icon } from "@/lib/icons";

export function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function pct(n: number): string {
  return `${(n * 100).toFixed(n >= 0.1 ? 0 : 1)}%`;
}

// Paleta consistente para segmentos (status/categorias).
export const PALETTE = [
  "#16a34a", // brand green
  "#0ea5e9",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#64748b",
];

// ── StatCard ───────────────────────────────────────────────────────────────
export function StatCard({
  title,
  value,
  sub,
  trend,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  trend?: number | null;
  accent?: boolean;
}) {
  const up = typeof trend === "number" && trend >= 0;
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
        accent ? "border-brand/30 bg-brand-subtle/50" : "border-border bg-bg"
      }`}
    >
      {accent && (
        <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand/10 blur-2xl" />
      )}
      <p className="relative text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <p className="relative mt-1.5 text-[1.7rem] font-bold leading-none tracking-tight tabular-nums">
        {value}
      </p>
      <div className="relative mt-2 flex items-center gap-2">
        {typeof trend === "number" && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {up ? <Icon.trendUp size={13} /> : <Icon.trendDown size={13} />}
            {pct(Math.abs(trend))}
          </span>
        )}
        {sub && <span className="text-xs text-muted">{sub}</span>}
      </div>
    </div>
  );
}

// ── BarChart (série temporal) ────────────────────────────────────────────────
export function BarChart({
  data,
  height = 160,
}: {
  data: { date: string; count: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const barW = 100 / Math.max(data.length, 1);
  const labelEvery = Math.ceil(data.length / 6);
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.count / max) * (height - 22);
          return (
            <motion.rect
              key={d.date}
              initial={{ height: 0, y: height - 18 }}
              animate={{ height: h, y: height - 18 - h }}
              transition={{ delay: i * 0.01, duration: 0.4, ease: "easeOut" }}
              x={i * barW + barW * 0.15}
              width={barW * 0.7}
              rx={0.6}
              className="fill-brand"
            >
              <title>{`${d.date}: ${d.count}`}</title>
            </motion.rect>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        {data
          .filter((_, i) => i % labelEvery === 0)
          .map((d) => (
            <span key={d.date}>{d.date.slice(5)}</span>
          ))}
      </div>
    </div>
  );
}

// ── Donut ────────────────────────────────────────────────────────────────────
export function Donut({
  segments,
  size = 150,
}: {
  segments: { label: string; value: number; color: string; href?: string }[];
  size?: number;
}) {
  const total = Math.max(1, segments.reduce((a, s) => a + s.value, 0));
  const r = 60;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
      <svg
        viewBox="0 0 150 150"
        style={{ width: size, height: size }}
        className="shrink-0 -rotate-90"
      >
        {segments.map((s) => {
          const frac = s.value / total;
          const dash = frac * c;
          const seg = (
            <circle
              key={s.label}
              cx="75"
              cy="75"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="20"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
            >
              <title>{`${s.label}: ${s.value}`}</title>
            </circle>
          );
          offset += dash;
          return seg;
        })}
        <circle cx="75" cy="75" r={r} fill="none" stroke="currentColor" className="text-border" strokeWidth="0.5" />
      </svg>
      <ul className="space-y-1.5 text-sm">
        {segments.map((s) => {
          const content = (
            <>
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              <span className="min-w-0 truncate text-muted">{s.label}</span>
              <span className="font-semibold">{s.value}</span>
            </>
          );
          return (
            <li key={s.label}>
              {s.href ? (
                <Link
                  href={s.href}
                  className="flex max-w-full items-center gap-2 rounded px-1 py-0.5 transition hover:bg-surface-2 hover:text-brand"
                  title={`Ver propostas: ${s.label}`}
                >
                  {content}
                </Link>
              ) : (
                <div className="flex max-w-full items-center gap-2">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── HBar (ranking horizontal) ────────────────────────────────────────────────
export function HBar({
  rows,
}: {
  rows: { label: string; value: number; hint?: string; href?: string }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0)
    return <p className="text-sm text-muted">Sem dados no período.</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => {
        const content = (
          <>
            <span className="w-24 shrink-0 truncate text-xs sm:w-36 sm:text-sm" title={r.label}>
              {r.label}
            </span>
            <div className="relative h-6 min-w-12 flex-1 overflow-hidden rounded bg-surface-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(r.value / max) * 100}%` }}
                transition={{ delay: i * 0.04, duration: 0.45, ease: "easeOut" }}
                className="h-full rounded bg-brand/80"
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums sm:w-20 sm:text-sm">
              {r.hint ?? r.value}
            </span>
          </>
        );
        return r.href ? (
          <Link
            key={r.label}
            href={r.href}
            className="-mx-1 flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-surface-2 sm:gap-3"
            title={`Ver propostas: ${r.label}`}
          >
            {content}
          </Link>
        ) : (
          <div key={r.label} className="flex items-center gap-2 sm:gap-3">
            {content}
          </div>
        );
      })}
    </div>
  );
}

// ── Card wrapper ─────────────────────────────────────────────────────────────
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-bg p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
