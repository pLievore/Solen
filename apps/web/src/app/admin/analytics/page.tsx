"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import { Icon } from "@/lib/icons";
import { PageHeader } from "../_components/PageHeader";
import { Panel, brl } from "../_components/charts";
import {
  BarList,
  BrazilBubbleMap,
  DonutChart,
  FunnelChart,
  KpiCard,
  MiniStat,
  SplitBar,
  TrendArea,
  VBars,
  fmtDuration,
  intl,
  pctFmt,
} from "./_viz";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => (h % 3 === 0 ? `${h}h` : ""));

type FunnelStep = { key: string; label: string; count: number };

type AnalyticsData =
  | { configured: false }
  | {
      configured: true;
      range: { days: number };
      totals: {
        pageViews: number;
        users: number;
        sessions: number;
        engagementRate: number;
        newUsers: number;
        avgSessionDuration: number;
        bounceRate: number;
      };
      timeseries: { date: string; count: number; users: number }[];
      byPage: { path: string; views: number; users: number }[];
      funnel: FunnelStep[];
      byDevice: { label: string; value: number }[];
      byChannel: { label: string; value: number }[];
      byHour: number[];
      byWeekday: number[];
      bySource: { label: string; value: number }[];
      byOS: { label: string; value: number }[];
      byLanding: { label: string; value: number }[];
      byCity: { city: string; region: string; value: number }[];
      byRegion: { label: string; value: number }[];
      sales: {
        total: number;
        novas: number;
        emContato: number;
        fechadas: number;
        perdidas: number;
        valorFechado: number;
        ticket: number;
      };
      inventory: {
        scrapRate: number;
        questions: { question: string; yes: number; no: number; total: number }[];
      };
      repairs: {
        total: number;
        avgDays: number;
        byStatus: { label: string; value: number }[];
        byTechnician: { label: string; value: number }[];
      };
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
    const visitantes = data.totals.users;
    const leads = find("lead");
    const conv = visitantes > 0 ? leads / visitantes : 0;

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
    return { visitantes, leads, conv, worstIdx, worstDrop };
  }, [data]);

  const periodLabel = PERIODS.find((p) => p.value === days)?.label ?? `${days} dias`;

  return (
    <>
      {/* Storytelling */}
      <div className="rounded-2xl border border-border bg-surface/60 p-5">
        <p className="text-[15px] leading-relaxed">
          Nos últimos <strong>{periodLabel}</strong>,{" "}
          <strong className="text-brand">{intl(story.visitantes)}</strong> pessoas
          visitaram o site e{" "}
          <strong className="text-brand">{intl(story.leads)}</strong> viraram leads no
          WhatsApp — uma conversão de <strong>{pctFmt(story.conv)}</strong>.
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
        <KpiCard icon="inbox" label="Leads (WhatsApp)" value={intl(story.leads)} sub="visitantes que viraram lead" />
        <KpiCard icon="percent" label="Conversão" value={pctFmt(story.conv)} sub="visitante → lead" highlight />
      </div>

      {/* Funil */}
      <Panel title="Funil de conversão">
        <FunnelChart steps={data.funnel} />
        <p className="mt-3 text-[11px] text-muted">
          Usuários únicos que chegaram pelo menos até cada etapa (no período).
        </p>
      </Panel>

      {/* Da avaliação à venda (banco de propostas) */}
      <Panel title="Da avaliação à venda (propostas)">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <MiniStat label="Propostas recebidas" value={intl(data.sales.total)} />
          <MiniStat label="Em contato" value={intl(data.sales.emContato)} />
          <MiniStat label="Fechadas" value={intl(data.sales.fechadas)} />
          <MiniStat label="Perdidas" value={intl(data.sales.perdidas)} />
          <MiniStat
            label="Taxa de fechamento"
            value={pctFmt(data.sales.total > 0 ? data.sales.fechadas / data.sales.total : 0)}
          />
          <MiniStat label="Valor fechado" value={brl(data.sales.valorFechado)} />
          <MiniStat label="Ticket médio" value={brl(data.sales.ticket)} />
        </div>
        <p className="mt-3 text-[11px] text-muted">
          Fecha o ciclo: do comportamento no site (acima) ao resultado real das
          propostas no período.
        </p>
      </Panel>

      {/* Perfil do estoque */}
      {data.inventory.questions.length > 0 && (
        <Panel title="Perfil do estoque (respostas das avaliações)">
          <p className="mb-4 text-sm">
            <strong className="text-brand">{pctFmt(data.inventory.scrapRate)}</strong> das
            avaliações no período caíram em <strong>sucata</strong>.
          </p>
          <div className="space-y-3">
            {data.inventory.questions.map((q) => (
              <SplitBar key={q.question} label={q.question} yes={q.yes} no={q.no} />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted">
            Distribuição das respostas Sim/Não — o perfil dos aparelhos que chegam.
          </p>
        </Panel>
      )}

      {/* Tendência */}
      <Panel title={`Visitas por dia — ${periodLabel}`}>
        <TrendArea data={data.timeseries} />
      </Panel>

      {/* Engajamento */}
      <Panel title="Engajamento">
        <div className="flex flex-wrap gap-6">
          <MiniStat
            label="Novos visitantes"
            value={pctFmt(data.totals.users > 0 ? data.totals.newUsers / data.totals.users : 0)}
          />
          <MiniStat label="Duração média da sessão" value={fmtDuration(data.totals.avgSessionDuration)} />
          <MiniStat label="Taxa de engajamento" value={pctFmt(data.totals.engagementRate)} />
          <MiniStat label="Taxa de rejeição" value={pctFmt(data.totals.bounceRate)} />
        </div>
      </Panel>

      {/* Picos de acesso */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Acessos por horário">
          <VBars data={data.byHour} labels={HOUR_LABELS} />
        </Panel>
        <Panel title="Acessos por dia da semana">
          <VBars data={data.byWeekday} labels={WEEKDAYS} />
        </Panel>
      </div>

      {/* Dispositivos + Sistema */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Dispositivos">
          <DonutChart
            segments={data.byDevice}
            centerValue={intl(data.byDevice.reduce((a, s) => a + s.value, 0))}
            centerLabel="sessões"
          />
        </Panel>
        <Panel title="Sistema (iPhone × Android)">
          <DonutChart
            segments={data.byOS}
            centerValue={intl(data.byOS.reduce((a, s) => a + s.value, 0))}
            centerLabel="usuários"
          />
        </Panel>
      </div>

      {/* Canais + Origem detalhada */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Canais de aquisição">
          <BarList rows={data.byChannel} unit="ses." />
        </Panel>
        <Panel title="Origem detalhada (fonte / mídia)">
          <BarList rows={data.bySource} unit="ses." />
        </Panel>
      </div>

      {/* Localização */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Usuários por estado">
          <BrazilBubbleMap regions={data.byRegion} />
        </Panel>
        <Panel title="Principais cidades">
          <BarList
            rows={data.byCity.slice(0, 8).map((c) => ({
              label: c.region ? `${c.city} · ${ufShort(c.region)}` : c.city,
              value: c.value,
            }))}
            unit="usu."
          />
        </Panel>
      </div>

      {/* Páginas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Páginas mais visitadas">
          <BarList rows={data.byPage.map((p) => ({ label: p.path, value: p.views }))} />
        </Panel>
        <Panel title="Páginas de entrada">
          <BarList rows={data.byLanding} unit="ses." />
        </Panel>
      </div>

      {/* Assistência técnica */}
      {data.repairs.total > 0 && (
        <Panel title="Assistência técnica">
          <div className="mb-4 flex flex-wrap gap-x-8 gap-y-4">
            <MiniStat label="Aparelhos no período" value={intl(data.repairs.total)} />
            <MiniStat
              label="Tempo médio de reparo"
              value={`${data.repairs.avgDays.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Por status</p>
              <BarList rows={data.repairs.byStatus} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Por técnico</p>
              <BarList rows={data.repairs.byTechnician} />
            </div>
          </div>
        </Panel>
      )}
    </>
  );
}

// "State of Sao Paulo" -> "Sao Paulo" (encurta o rótulo da cidade).
function ufShort(region: string): string {
  return region.replace(/^State of /i, "");
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
