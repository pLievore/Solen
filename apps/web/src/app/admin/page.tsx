"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { BarChart, Donut, HBar, Panel, StatCard, brl, pct, PALETTE } from "./_components/charts";

type Analytics = {
  range: { days: number | null };
  kpis: {
    totalLeads: number;
    pipelineValue: number;
    wonValue: number;
    avgTicket: number;
    conversionRate: number;
    scrapRate: number;
    leadsPrev: number;
    deltaPct: number | null;
  };
  timeseries: { date: string; count: number; value: number }[];
  byStatus: { status: string; count: number; value: number }[];
  byCategory: { category: string; count: number; value: number }[];
  topModels: { model: string; category: string; count: number; value: number }[];
  byPickup: { label: string; count: number }[];
  byValueBracket: {
    label: string;
    min: number;
    max: number | null;
    count: number;
    closed: number;
  }[];
};

const ANALYTICS_CACHE_TTL = 5 * 60_000;
const ANALYTICS_INVALIDATED_AT_KEY = "vendy_admin_analytics_invalidated_at";
const analyticsCache = new Map<string, { data: Analytics; cachedAt: number }>();

const STATUS_LABELS: Record<string, string> = {
  NEW: "Novo",
  CONTACTED: "Em contato",
  CLOSED: "Fechado",
  LOST: "Perdido",
};
const STATUS_COLOR: Record<string, string> = {
  NEW: "#0ea5e9",
  CONTACTED: "#f59e0b",
  CLOSED: "#16a34a",
  LOST: "#ef4444",
};

const PERIODS: { label: string; value: string }[] = [
  { label: "7 dias", value: "7" },
  { label: "30 dias", value: "30" },
  { label: "90 dias", value: "90" },
  { label: "12 meses", value: "365" },
  { label: "Tudo", value: "all" },
];

const MGMT = [
  { href: "/admin/proposals", label: "Propostas" },
  { href: "/admin/import", label: "Importar planilha" },
  { href: "/admin/models", label: "Modelos" },
  { href: "/admin/variants", label: "Versões" },
  { href: "/admin/descontos", label: "Descontos" },
  { href: "/admin/blog", label: "Blog" },
];

export default function AdminDashboard() {
  const [days, setDays] = useState("30");
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const cached = analyticsCache.get(days);
    const invalidatedAt = Number(localStorage.getItem(ANALYTICS_INVALIDATED_AT_KEY) ?? 0);
    if (
      cached &&
      cached.cachedAt > invalidatedAt &&
      Date.now() - cached.cachedAt < ANALYTICS_CACHE_TTL
    ) {
      setData(cached.data);
      setError(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setData(null);
    setError(null);
    adminApi
      .get<Analytics>(`/admin/analytics?days=${days}`)
      .then((next) => {
        if (!active) return;
        analyticsCache.set(days, { data: next, cachedAt: Date.now() });
        setData(next);
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [days]);

  const k = data?.kpis;
  const proposalsHref = (filters: Record<string, string | number>) => {
    const params = new URLSearchParams({ days });
    for (const [key, value] of Object.entries(filters)) {
      params.set(key, String(value));
    }
    return `/admin/proposals?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header + período */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão geral</h1>
          <p className="text-sm text-muted">Desempenho das propostas e da operação.</p>
        </div>
        <div className="flex max-w-full overflow-x-auto rounded-lg border border-border bg-surface p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                days === p.value
                  ? "bg-brand text-brand-fg shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && !data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      )}

      {k && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              title="Leads no período"
              value={String(k.totalLeads)}
              trend={k.deltaPct}
              sub={`vs. ${k.leadsPrev} anterior`}
              accent
            />
            <StatCard title="Pipeline" value={brl(k.pipelineValue)} sub="valor avaliado" />
            <StatCard title="Ticket médio" value={brl(k.avgTicket)} />
            <StatCard
              title="Conversão"
              value={pct(k.conversionRate)}
              sub={`${pct(k.scrapRate)} sucata`}
            />
          </div>

          {/* Série temporal + status */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel title="Leads por dia" className="lg:col-span-2">
              <BarChart data={data!.timeseries} />
            </Panel>
            <Panel title="Por status">
              <Donut
                segments={data!.byStatus.map((s) => ({
                  label: STATUS_LABELS[s.status] ?? s.status,
                  value: s.count,
                  color: STATUS_COLOR[s.status] ?? "#64748b",
                  href: proposalsHref({ status: s.status }),
                }))}
              />
            </Panel>
          </div>

          {/* Categorias + modelos */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Por categoria">
              <HBar
                rows={data!.byCategory.map((c) => ({
                  label: c.category,
                  value: c.count,
                  hint: `${c.count} · ${brl(c.value)}`,
                  href: proposalsHref({ category: c.category }),
                }))}
              />
            </Panel>
            <Panel title="Modelos mais avaliados">
              <HBar
                rows={data!.topModels.map((m) => ({
                  label: m.model,
                  value: m.count,
                  href: proposalsHref({ category: m.category, model: m.model }),
                }))}
              />
            </Panel>
          </div>

          {/* Pickup + faixas de valor */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Ponto de coleta escolhido">
              <Donut
                segments={data!.byPickup.slice(0, 8).map((p, i) => ({
                  label: p.label.replace(/ —.*$/, ""),
                  value: p.count,
                  color: PALETTE[i % PALETTE.length],
                  href: proposalsHref({
                    pickup: p.label === "Não informado" ? "__none__" : p.label,
                  }),
                }))}
              />
            </Panel>
            <Panel title="Faixas de valor (e conversão)">
              <HBar
                rows={data!.byValueBracket.map((b) => ({
                  label: b.label,
                  value: b.count,
                  hint: `${b.count} · ${b.count ? pct(b.closed / b.count) : "0%"} fech.`,
                  href: proposalsHref({
                    minValue: b.min,
                    ...(b.max !== null ? { maxValue: b.max } : {}),
                  }),
                }))}
              />
            </Panel>
          </div>
        </>
      )}

      {/* Atalhos de gestão */}
      <Panel title="Gestão">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {MGMT.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="rounded-lg border border-border bg-surface px-3 py-3 text-center text-sm font-medium transition hover:border-brand hover:shadow-sm"
            >
              {m.label}
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
