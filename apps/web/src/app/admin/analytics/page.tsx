"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import { Icon } from "@/lib/icons";
import { PageHeader } from "../_components/PageHeader";
import { BarChart, HBar, Panel, StatCard } from "../_components/charts";

type FunnelStep = { key: string; label: string; count: number };

type AnalyticsData =
  | { configured: false }
  | {
      configured: true;
      range: { days: number };
      totals: { pageViews: number; users: number; sessions: number };
      timeseries: { date: string; count: number }[];
      byPage: { path: string; views: number; users: number }[];
      funnel: FunnelStep[];
    };

const PERIODS = [
  { value: 7, label: "7 dias" },
  { value: 28, label: "28 dias" },
  { value: 90, label: "90 dias" },
  { value: 365, label: "12 meses" },
];

function intl(n: number) {
  return n.toLocaleString("pt-BR");
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(28);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminApi.get<AnalyticsData>(`/admin/ga-analytics?days=${days}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Tráfego, funil de avaliação e onde os visitantes saem (Google Analytics)."
        icon={<Icon.trendUp size={20} />}
        actions={
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className={cls.input + " w-auto"}
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        }
      />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-muted">Carregando dados do GA4…</p>}

      {!loading && data && data.configured === false && <NotConfigured />}

      {!loading && data && data.configured && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard title="Visualizações de página" value={intl(data.totals.pageViews)} accent />
            <StatCard title="Usuários" value={intl(data.totals.users)} />
            <StatCard title="Sessões" value={intl(data.totals.sessions)} />
          </div>

          <Panel title="Visualizações por dia">
            {data.timeseries.length > 0 ? (
              <BarChart data={data.timeseries} />
            ) : (
              <p className="text-sm text-muted">Sem dados no período.</p>
            )}
          </Panel>

          <Panel title="Funil de avaliação — onde os visitantes saem">
            <Funnel steps={data.funnel} />
          </Panel>

          <Panel title="Páginas mais vistas">
            <HBar
              rows={data.byPage.map((p) => ({
                label: p.path,
                value: p.views,
                hint: `${intl(p.views)} views`,
              }))}
            />
          </Panel>
        </>
      )}
    </div>
  );
}

// ── Funil com conversão e maior ponto de saída ──────────────────────────────
function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = steps[0]?.count ?? 0;
  if (top === 0) {
    return <p className="text-sm text-muted">Sem eventos registrados no período ainda.</p>;
  }

  // Identifica a maior queda relativa entre etapas consecutivas (onde mais sai).
  let worstIdx = -1;
  let worstDrop = 0;
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1].count;
    const drop = prev > 0 ? (prev - steps[i].count) / prev : 0;
    if (prev > 0 && drop > worstDrop) {
      worstDrop = drop;
      worstIdx = i;
    }
  }

  return (
    <div className="space-y-2.5">
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1].count : null;
        const fromTop = top > 0 ? step.count / top : 0;
        const stepConv = prev && prev > 0 ? step.count / prev : null;
        const isExit = i === worstIdx;
        return (
          <div key={step.key} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm" title={step.label}>
              {step.label}
            </span>
            <div className="relative h-7 flex-1 overflow-hidden rounded bg-surface-2">
              <div
                className="h-full rounded bg-brand/80 transition-all"
                style={{ width: `${Math.max(fromTop * 100, 1.5)}%` }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center text-xs font-semibold tabular-nums text-fg">
                {intl(step.count)}
              </span>
            </div>
            <span className="w-28 shrink-0 text-right text-xs tabular-nums">
              {stepConv !== null ? (
                <span className={isExit ? "font-semibold text-red-600" : "text-muted"}>
                  {(stepConv * 100).toFixed(0)}% da etapa
                  {isExit && " ⚠"}
                </span>
              ) : (
                <span className="text-muted">topo</span>
              )}
            </span>
          </div>
        );
      })}
      {worstIdx > 0 && (
        <p className="pt-1 text-xs text-muted">
          ⚠ Maior saída entre <strong>{steps[worstIdx - 1].label}</strong> e{" "}
          <strong>{steps[worstIdx].label}</strong> ({(worstDrop * 100).toFixed(0)}% saíram).
        </p>
      )}
      <p className="pt-1 text-[11px] text-muted">
        Contagens são de eventos (não usuários únicos). “Avançou etapa” inclui os
        sub-passos do questionário, por isso pode ser maior que a etapa anterior.
      </p>
    </div>
  );
}

// ── Estado não configurado ──────────────────────────────────────────────────
function NotConfigured() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
      <p className="font-semibold">Analytics ainda não configurado.</p>
      <p className="mt-1">
        Defina as variáveis <code className="rounded bg-amber-100 px-1">GA4_PROPERTY_ID</code> e{" "}
        <code className="rounded bg-amber-100 px-1">GA_SA_KEY_BASE64</code> no serviço da API
        (Render) e confirme que a service account tem acesso <strong>Leitor</strong> na
        propriedade do GA4. Depois recarregue esta página.
      </p>
    </div>
  );
}
