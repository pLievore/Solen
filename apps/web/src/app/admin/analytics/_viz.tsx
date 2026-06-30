"use client";

import { motion } from "framer-motion";
import type { IconName } from "@/lib/icons";
import { Icon } from "@/lib/icons";

export const intl = (n: number) => Math.round(n).toLocaleString("pt-BR");
export const pctFmt = (n: number) =>
  `${(n * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
export const fmtDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

// ── Barras verticais (hora / dia da semana) com rótulos ─────────────────────
export function VBars({
  data,
  labels,
}: {
  data: number[];
  labels: string[];
}) {
  const max = Math.max(1, ...data);
  const peak = data.indexOf(max);
  const dense = data.length > 12;
  return (
    <div>
      <div className="flex h-32 items-stretch gap-1">
        {data.map((v, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[9px] tabular-nums text-muted">
              {v > 0 && (!dense || i === peak) ? intl(v) : ""}
            </span>
            <div
              className={`w-full shrink-0 rounded-t ${i === peak ? "bg-brand" : "bg-brand/55"}`}
              style={{ height: `${Math.max((v / max) * 100, v > 0 ? 4 : 0)}%` }}
              title={`${labels[i]}: ${intl(v)}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-muted">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Barra Sim/Não (perfil do estoque) ───────────────────────────────────────
export function SplitBar({ label, yes, no }: { label: string; yes: number; no: number }) {
  const total = Math.max(1, yes + no);
  const yp = (yes / total) * 100;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate" title={label}>
          {label}
        </span>
        <span className="shrink-0 tabular-nums text-muted">
          Sim <strong className="text-brand">{pctFmt(yes / total)}</strong> · Não{" "}
          <strong className="text-red-500">{pctFmt(no / total)}</strong>
        </span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-2">
        <div className="bg-brand" style={{ width: `${yp}%` }} title={`Sim: ${yes}`} />
        <div className="bg-red-400" style={{ width: `${100 - yp}%` }} title={`Não: ${no}`} />
      </div>
    </div>
  );
}

// ── Mini-stat inline ────────────────────────────────────────────────────────
export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

const SERIES_COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

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
      <p className={`text-xs font-semibold uppercase tracking-wide ${highlight ? "text-brand-fg/80" : "text-muted"}`}>
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      {sub && <p className={`mt-1 text-xs ${highlight ? "text-brand-fg/80" : "text-muted"}`}>{sub}</p>}
      {highlight && <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />}
    </motion.div>
  );
}

// ── Funil de conversão ──────────────────────────────────────────────────────
export function FunnelChart({
  steps,
}: {
  steps: { key: string; label: string; count: number }[];
}) {
  const top = steps[0]?.count ?? 0;
  if (top === 0) return <p className="text-sm text-muted">Sem eventos no período ainda.</p>;

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
    <div className="space-y-0">
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1].count : null;
        const stepConv = prev && prev > 0 ? step.count / prev : null;
        const ofTop = step.count / top;
        const isExit = i === worstIdx;
        return (
          <div key={step.key}>
            {i > 0 && (
              <div className="flex items-center gap-3 py-1">
                <span className="w-36 shrink-0 sm:w-44" />
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    isExit ? "bg-red-50 text-red-600 ring-1 ring-red-200" : "bg-surface-2 text-muted"
                  }`}
                >
                  {isExit && <Icon.trendDown size={12} />}
                  {stepConv !== null ? pctFmt(stepConv) : "—"} seguiram
                  {isExit && " · maior saída"}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate text-sm font-medium sm:w-44" title={step.label}>
                {step.label}
              </span>
              <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-surface-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(ofTop * 100, 2)}%` }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
                  className="h-full rounded-lg bg-gradient-to-r from-brand to-brand-dark"
                />
              </div>
              <span className="flex w-24 shrink-0 items-baseline justify-end gap-1.5">
                <span className="text-base font-bold tabular-nums">{intl(step.count)}</span>
                <span className="text-[11px] text-muted">{pctFmt(ofTop)}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Área temporal com eixo, gridlines e rótulos ─────────────────────────────
export function TrendArea({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-muted">Sem dados no período.</p>;

  const W = 760;
  const H = 240;
  const padL = 30;
  const padR = 12;
  const padTop = 24;
  const padBottom = 26;
  const innerW = W - padL - padR;
  const innerH = H - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => d.count));
  const n = data.length;
  const x = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => padTop + innerH - (v / max) * innerH;

  const pts = data.map((d, i) => ({ x: x(i), y: y(d.count), ...d }));
  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `M ${pts[0].x},${padTop + innerH} L ${pts.map((p) => `${p.x},${p.y}`).join(" L ")} L ${pts[n - 1].x},${padTop + innerH} Z`;

  const peakIdx = data.reduce((b, d, i) => (d.count > data[b].count ? i : b), 0);
  // Rótulos sem poluir: todos se poucos pontos; senão a cada N + sempre o pico e o último.
  const every = n <= 12 ? 1 : Math.ceil(n / 8);
  const showLabel = (i: number) => i === peakIdx || i === n - 1 || i % every === 0;
  const gridVals = [0, Math.round(max / 2), max];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines + rótulos do eixo Y */}
        {gridVals.map((v) => (
          <g key={v}>
            <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="currentColor" className="text-border" strokeWidth="1" strokeDasharray={v === 0 ? "0" : "3 3"} />
            <text x={padL - 6} y={y(v) + 3} textAnchor="end" className="fill-muted text-[10px]">
              {intl(v)}
            </text>
          </g>
        ))}
        <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={area} fill="url(#trendFill)" />
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
        {pts.map((p, i) => (
          <g key={p.date}>
            <circle cx={p.x} cy={p.y} r={i === peakIdx ? 4 : 2.5} fill="#16a34a" />
            {showLabel(i) && p.count > 0 && (
              <text x={p.x} y={p.y - 8} textAnchor="middle" className={`text-[10px] ${i === peakIdx ? "fill-fg font-bold" : "fill-muted"}`}>
                {intl(p.count)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[10px] text-muted" style={{ paddingLeft: padL }}>
        {data.filter((_, i) => showLabel(i)).map((d) => (
          <span key={d.date}>
            {d.date.slice(8)}/{d.date.slice(5, 7)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Donut ───────────────────────────────────────────────────────────────────
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
  if (segments.every((s) => s.value === 0)) return <p className="text-sm text-muted">Sem dados no período.</p>;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
      <div className="relative shrink-0">
        <svg viewBox="0 0 150 150" style={{ width: 150, height: 150 }} className="-rotate-90">
          {segments.map((s, i) => {
            const dash = (s.value / total) * c;
            const seg = (
              <circle key={s.label} cx="75" cy="75" r={r} fill="none" stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth="22" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset} />
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
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }} />
            <span className="flex-1 truncate capitalize text-muted">{s.label}</span>
            <span className="font-semibold tabular-nums">{intl(s.value)}</span>
            <span className="w-12 text-right text-xs text-muted tabular-nums">{pctFmt(s.value / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Lista de barras com rótulo ──────────────────────────────────────────────
export function BarList({
  rows,
  unit,
}: {
  rows: { label: string; value: number }[];
  unit?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-muted">Sem dados no período.</p>;
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

// ── Mapa de bolhas por estado (Brasil) ──────────────────────────────────────
type UF = { uf: string; lat: number; lng: number };
const UFS: Record<string, UF> = {
  AC: { uf: "AC", lat: -8.77, lng: -70.55 }, AL: { uf: "AL", lat: -9.62, lng: -36.82 },
  AP: { uf: "AP", lat: 1.41, lng: -51.77 }, AM: { uf: "AM", lat: -3.96, lng: -62.0 },
  BA: { uf: "BA", lat: -12.47, lng: -41.71 }, CE: { uf: "CE", lat: -5.09, lng: -39.33 },
  DF: { uf: "DF", lat: -15.78, lng: -47.93 }, ES: { uf: "ES", lat: -19.57, lng: -40.34 },
  GO: { uf: "GO", lat: -15.93, lng: -49.86 }, MA: { uf: "MA", lat: -4.96, lng: -45.27 },
  MT: { uf: "MT", lat: -12.96, lng: -55.42 }, MS: { uf: "MS", lat: -20.51, lng: -54.54 },
  MG: { uf: "MG", lat: -18.1, lng: -44.38 }, PA: { uf: "PA", lat: -3.79, lng: -52.48 },
  PB: { uf: "PB", lat: -7.12, lng: -36.72 }, PR: { uf: "PR", lat: -24.89, lng: -51.55 },
  PE: { uf: "PE", lat: -8.38, lng: -37.86 }, PI: { uf: "PI", lat: -6.6, lng: -42.28 },
  RJ: { uf: "RJ", lat: -22.25, lng: -42.66 }, RN: { uf: "RN", lat: -5.81, lng: -36.59 },
  RS: { uf: "RS", lat: -30.17, lng: -53.5 }, RO: { uf: "RO", lat: -10.83, lng: -63.34 },
  RR: { uf: "RR", lat: 1.99, lng: -61.33 }, SC: { uf: "SC", lat: -27.45, lng: -50.95 },
  SP: { uf: "SP", lat: -22.19, lng: -48.79 }, SE: { uf: "SE", lat: -10.57, lng: -37.45 },
  TO: { uf: "TO", lat: -9.46, lng: -48.26 },
};

const NAME_TO_UF: Record<string, string> = {
  "sao paulo": "SP", parana: "PR", "rio de janeiro": "RJ", "minas gerais": "MG",
  para: "PA", paraiba: "PB", "rio grande do sul": "RS", "santa catarina": "SC",
  bahia: "BA", ceara: "CE", pernambuco: "PE", goias: "GO", maranhao: "MA",
  "espirito santo": "ES", amazonas: "AM", "mato grosso": "MT", "mato grosso do sul": "MS",
  "distrito federal": "DF", "federal district": "DF", "rio grande do norte": "RN",
  alagoas: "AL", piaui: "PI", sergipe: "SE", rondonia: "RO", tocantins: "TO",
  acre: "AC", amapa: "AP", roraima: "RR",
};

function toUf(region: string): string | null {
  const norm = region
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^state of /, "")
    .trim();
  return NAME_TO_UF[norm] ?? null;
}

// Contorno simplificado do Brasil (lat/lng) só para dar contexto de mapa.
const BR_OUTLINE: [number, number][] = [
  [3.8, -51.2], [1.2, -50.0], [-1.0, -44.3], [-2.9, -41.8], [-5.0, -37.0], [-7.2, -34.8],
  [-12.5, -37.6], [-18.0, -39.5], [-22.9, -42.0], [-25.5, -48.0], [-29.3, -49.7], [-33.7, -53.4],
  [-30.2, -57.6], [-24.0, -54.6], [-22.0, -57.9], [-16.3, -58.0], [-11.0, -65.3], [-9.8, -66.8],
  [-9.0, -73.0], [-4.4, -70.0], [-0.2, -69.5], [1.9, -67.1], [4.5, -60.3], [5.2, -60.7],
  [3.9, -51.6],
];

const MIN_LNG = -74, MAX_LNG = -34, MAX_LAT = 5.5, MIN_LAT = -34;
const MAP_W = 220, MAP_H = 230;
const px = (lng: number) => ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * MAP_W;
const py = (lat: number) => ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * MAP_H;

export function BrazilBubbleMap({
  regions,
}: {
  regions: { label: string; value: number }[];
}) {
  const byUf = new Map<string, number>();
  let outside = 0;
  for (const r of regions) {
    const uf = toUf(r.label);
    if (uf) byUf.set(uf, (byUf.get(uf) ?? 0) + r.value);
    else outside += r.value;
  }
  const bubbles = [...byUf.entries()]
    .map(([uf, value]) => ({ ...UFS[uf], value }))
    .filter((b) => b.lat !== undefined)
    .sort((a, b) => b.value - a.value);

  if (bubbles.length === 0)
    return <p className="text-sm text-muted">Sem localização identificada no período.</p>;

  const max = Math.max(...bubbles.map((b) => b.value));
  const outlinePath = "M " + BR_OUTLINE.map(([lat, lng]) => `${px(lng).toFixed(1)},${py(lat).toFixed(1)}`).join(" L ") + " Z";

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full max-w-[260px] shrink-0">
        <path d={outlinePath} className="fill-surface-2 stroke-border" strokeWidth="1" />
        {bubbles.map((b) => {
          const r = 5 + Math.sqrt(b.value / max) * 16;
          return (
            <g key={b.uf}>
              <circle cx={px(b.lng)} cy={py(b.lat)} r={r} fill="#16a34a" fillOpacity={0.55} stroke="#16a34a" strokeWidth="1">
                <title>{`${b.uf}: ${intl(b.value)} usuários`}</title>
              </circle>
              <text x={px(b.lng)} y={py(b.lat) + 3} textAnchor="middle" className="fill-white text-[9px] font-bold">
                {b.value >= max * 0.18 ? b.uf : ""}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="w-full space-y-1.5 text-sm">
        {bubbles.slice(0, 8).map((b) => (
          <li key={b.uf} className="flex items-center gap-2">
            <span className="w-8 shrink-0 font-mono text-xs font-semibold text-brand">{b.uf}</span>
            <div className="relative h-4 flex-1 overflow-hidden rounded bg-surface-2">
              <div className="h-full rounded bg-brand/70" style={{ width: `${(b.value / max) * 100}%` }} />
            </div>
            <span className="w-10 text-right text-xs font-semibold tabular-nums">{intl(b.value)}</span>
          </li>
        ))}
        {outside > 0 && <li className="pt-1 text-[11px] text-muted">Fora do Brasil / não identificado: {intl(outside)}</li>}
      </ul>
    </div>
  );
}
