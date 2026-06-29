"use client";

import { motion } from "framer-motion";
import type { IconName } from "@/lib/icons";
import { Icon } from "@/lib/icons";

export const intl = (n: number) => Math.round(n).toLocaleString("pt-BR");
export const pctFmt = (n: number) =>
  `${(n * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

const CHANNEL_COLORS = [
  "#16a34a",
  "#0ea5e9",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

// ── KPI card ────────────────────────────────────────────────────────────────
export function KpiCard({
  label,
  value,
  sub,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: IconName;
  highlight?: boolean;
}) {
  const IconCmp = Icon[icon];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
        highlight
          ? "border-transparent bg-gradient-to-br from-brand to-brand-dark text-brand-fg"
          : "border-border bg-bg"
      }`}
    >
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
          highlight ? "bg-white/20 text-brand-fg" : "bg-brand-subtle text-brand"
        }`}
      >
        <IconCmp size={18} />
      </div>
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${
          highlight ? "text-brand-fg/80" : "text-muted"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      {sub && (
        <p className={`mt-1 text-xs ${highlight ? "text-brand-fg/80" : "text-muted"}`}>
          {sub}
        </p>
      )}
      {highlight && (
        <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      )}
    </motion.div>
  );
}

// ── Funil de conversão (storytelling) ───────────────────────────────────────
export function FunnelChart({
  steps,
}: {
  steps: { key: string; label: string; count: number }[];
}) {
  const top = steps[0]?.count ?? 0;
  if (top === 0)
    return <p className="text-sm text-muted">Sem eventos no período ainda.</p>;

  // Maior queda relativa entre etapas consecutivas.
  let worstIdx = -1;
  let worstDrop = 0;
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1].count;
    if (prev > 0) {
      const drop = (prev - steps[i].count) / prev;
      if (drop > worstDrop) {
        worstDrop = drop;
        worstIdx = i;
      }
    }
  }

  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const widthPct = Math.max((step.count / top) * 100, 6);
        const prev = i > 0 ? steps[i - 1].count : null;
        const stepConv = prev && prev > 0 ? step.count / prev : null;
        const ofTop = step.count / top;
        const isExit = i === worstIdx;
        return (
          <div key={step.key}>
            {i > 0 && (
              <div className="flex items-center justify-center py-0.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    isExit
                      ? "bg-red-100 text-red-600"
                      : "bg-surface-2 text-muted"
                  }`}
                >
                  {isExit ? "↓ " : ""}
                  {stepConv !== null ? pctFmt(stepConv) : "—"} seguiram
                  {isExit ? " · maior saída" : ""}
                </span>
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.6 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: i * 0.06 }}
              style={{ width: `${widthPct}%` }}
              className="mx-auto flex h-14 items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-brand to-brand-dark px-4 text-brand-fg shadow-sm"
            >
              <span className="truncate text-sm font-semibold">{step.label}</span>
              <span className="flex shrink-0 items-baseline gap-1.5">
                <span className="text-lg font-bold tabular-nums">{intl(step.count)}</span>
                <span className="text-[11px] text-brand-fg/80">{pctFmt(ofTop)}</span>
              </span>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

// ── Área temporal com gradiente + pico ──────────────────────────────────────
export function TrendArea({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  if (data.length === 0)
    return <p className="text-sm text-muted">Sem dados no período.</p>;

  const W = 720;
  const H = 220;
  const padX = 12;
  const padTop = 28;
  const padBottom = 26;
  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => d.count));
  const n = data.length;
  const x = (i: number) => padX + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => padTop + innerH - (v / max) * innerH;

  const line = data.map((d, i) => `${x(i)},${y(d.count)}`).join(" ");
  const area = `M ${x(0)},${padTop + innerH} L ${line.replaceAll(" ", " L ")} L ${x(n - 1)},${padTop + innerH} Z`;

  const peakIdx = data.reduce((best, d, i) => (d.count > data[best].count ? i : best), 0);
  const peak = data[peakIdx];
  const labelEvery = Math.ceil(n / 6);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* baseline */}
        <line
          x1={padX}
          y1={padTop + innerH}
          x2={W - padX}
          y2={padTop + innerH}
          stroke="currentColor"
          className="text-border"
          strokeWidth="1"
        />
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          d={area}
          fill="url(#trendFill)"
        />
        <motion.polyline
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          points={line}
          fill="none"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* pico */}
        <circle cx={x(peakIdx)} cy={y(peak.count)} r="4" fill="#16a34a" />
        <g transform={`translate(${Math.min(Math.max(x(peakIdx), 40), W - 40)}, ${Math.max(y(peak.count) - 12, 14)})`}>
          <text textAnchor="middle" className="fill-fg text-[12px] font-bold">
            {intl(peak.count)}
          </text>
        </g>
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[10px] text-muted">
        {data
          .filter((_, i) => i % labelEvery === 0)
          .map((d) => (
            <span key={d.date}>
              {d.date.slice(8)}/{d.date.slice(5, 7)}
            </span>
          ))}
      </div>
    </div>
  );
}

// ── Donut com legenda e centro ──────────────────────────────────────────────
export function DonutChart({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: { label: string; value: number }[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = Math.max(1, segments.reduce((a, s) => a + s.value, 0));
  const r = 60;
  const c = 2 * Math.PI * r;
  let offset = 0;
  if (segments.every((s) => s.value === 0))
    return <p className="text-sm text-muted">Sem dados no período.</p>;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
      <div className="relative shrink-0">
        <svg viewBox="0 0 150 150" style={{ width: 150, height: 150 }} className="-rotate-90">
          {segments.map((s, i) => {
            const frac = s.value / total;
            const dash = frac * c;
            const seg = (
              <circle
                key={s.label}
                cx="75"
                cy="75"
                r={r}
                fill="none"
                stroke={CHANNEL_COLORS[i % CHANNEL_COLORS.length]}
                strokeWidth="22"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{centerValue}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted">{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }}
            />
            <span className="flex-1 truncate capitalize text-muted">{s.label}</span>
            <span className="font-semibold tabular-nums">{intl(s.value)}</span>
            <span className="w-12 text-right text-xs text-muted tabular-nums">
              {pctFmt(s.value / total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Lista de barras (canais, páginas) ───────────────────────────────────────
export function BarList({
  rows,
  unit,
}: {
  rows: { label: string; value: number }[];
  unit?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0)
    return <p className="text-sm text-muted">Sem dados no período.</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs sm:w-44 sm:text-sm" title={r.label}>
            {r.label}
          </span>
          <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-surface-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(r.value / max) * 100}%` }}
              transition={{ delay: i * 0.04, duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-md bg-gradient-to-r from-brand/70 to-brand"
            />
          </div>
          <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums sm:text-sm">
            {intl(r.value)}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
