"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import { Icon } from "@/lib/icons";
import { PageHeader } from "../_components/PageHeader";
import { Panel } from "../_components/charts";
import {
  BarList,
  DonutChart,
  FunnelChart,
  KpiCard,
  TrendArea,
  intl,
  pctFmt,
} from "./_viz";

type FunnelStep = { key: string; label: string; count: number };

type AnalyticsData =
  | { configured: false }
  | {
      configured: true;
      range: { days: number };
      totals: { pageViews: number; users: number; sessions: number; engagementRate: number };
      timeseries: { date: string; count: number; users: number }[];
      byPage: { path: string; views: number; users: number }[];
      funnel: FunnelStep[];
      byDevice: { label: string; value: number }[];
      byChannel: { label: string; value: number }[];
    };

const PERIODS = [
  { value: 7, label: "7 dias" },
  { value: 28, label: "28 dias" },
  { value: 90, label: "90 dias" },
  { value: 365, label: "12 meses" },
];

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
        subtitle="Tráfego do site e funil de avaliação — sem contar o painel admin."
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
        <Dashboard data={data} days={days} />
      )}
    </div>
  );
}

function Dashboard({
  data,
  days,
}: {
  data: Extract<AnalyticsData, { configured: true }>;
  days: number;
}) {
  const story = useMemo(() => {
    const find = (k: string) => data.funnel.find((s) => s.key === k)?.count ?? 0;
    const visits = data.totals.pageViews;
    const leads = find("lead");
    const conv = visits > 0 ? leads / visits : 0;

    let worstIdx = -1;
    let worstDrop = 0;
    for (let i = 1; i < data.funnel.length; i++) {
      const prev = data.funnel[i - 1].count;
      if (prev > 0) {
        const drop = (prev - data.funnel[i].count) / prev;
        if (drop > worstDrop) {
          worstDrop = drop;
          worstIdx = i;
        }
      }
    }
    return { visits, leads, conv, worstIdx, worstDrop };
  }, [data]);

  const periodLabel = PERIODS.find((p) => p.value === days)?.label ?? `${days} dias`;

  return (
    <>
      {/* Storytelling */}
      <div className="rounded-2xl border border-border bg-surface/60 p-5">
        <p className="text-[15px] leading-relaxed">
          Nos últimos <strong>{periodLabel}</strong>, o site recebeu{" "}
          <strong className="text-brand">{intl(story.visits)}</strong> visitas que geraram{" "}
          <strong className="text-brand">{intl(story.leads)}</strong> leads no WhatsApp —{" "}
          uma conversão de <strong>{pctFmt(story.conv)}</strong>.
          {story.worstIdx > 0 && (
            <>
              {" "}
              O maior gargalo está entre{" "}
              <strong>{data.funnel[story.worstIdx - 1].label}</strong> e{" "}
              <strong>{data.funnel[story.worstIdx].label}</strong>, onde{" "}
              <strong className="text-red-600">{pctFmt(story.worstDrop)}</strong> desistem.
            </>
          )}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon="trendUp" label="Visitas" value={intl(data.totals.pageViews)} sub={`${intl(data.totals.sessions)} sessões`} />
        <KpiCard icon="user" label="Usuários" value={intl(data.totals.users)} sub={`${pctFmt(data.totals.engagementRate)} engajamento`} />
        <KpiCard icon="inbox" label="Leads (WhatsApp)" value={intl(story.leads)} sub="enviados pelo fluxo" />
        <KpiCard icon="percent" label="Conversão" value={pctFmt(story.conv)} sub="visita → lead" highlight />
      </div>

      {/* Funil */}
      <Panel title="Funil de conversão">
        <FunnelChart steps={data.funnel} />
        <p className="mt-3 text-[11px] text-muted">
          Contagens de eventos (não usuários únicos). “Avançou etapa” soma os
          sub-passos do questionário, por isso pode superar a etapa anterior.
        </p>
      </Panel>

      {/* Tendência */}
      <Panel title={`Visitas por dia — ${periodLabel}`}>
        <TrendArea data={data.timeseries} />
      </Panel>

      {/* Dispositivos + Canais */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Dispositivos">
          <DonutChart
            segments={data.byDevice}
            centerValue={intl(data.byDevice.reduce((a, s) => a + s.value, 0))}
            centerLabel="sessões"
          />
        </Panel>
        <Panel title="Canais de aquisição">
          <BarList rows={data.byChannel} unit="ses." />
        </Panel>
      </div>

      {/* Páginas */}
      <Panel title="Páginas mais visitadas">
        <BarList rows={data.byPage.map((p) => ({ label: p.path, value: p.views }))} />
      </Panel>
    </>
  );
}

function NotConfigured() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
      <p className="font-semibold">Analytics ainda não configurado.</p>
      <p className="mt-1">
        Defina <code className="rounded bg-amber-100 px-1">GA4_PROPERTY_ID</code> e{" "}
        <code className="rounded bg-amber-100 px-1">GA_SA_KEY_BASE64</code> no serviço da API
        (Render) e confirme o acesso <strong>Leitor</strong> da service account na propriedade
        do GA4. Depois recarregue.
      </p>
    </div>
  );
}
