import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Ga4Service, type GaReport } from "./ga4.service";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(28),
});
type AnalyticsQuery = z.infer<typeof querySchema>;

// Funil canonico (ordem do fluxo). page_view e automatico do GA4.
// Cada etapa soma o nome novo + os antigos equivalentes, para o historico
// (anterior a padronizacao dos eventos) aparecer junto.
const FUNNEL_STEPS: { key: string; label: string; events: string[] }[] = [
  { key: "page_view", label: "Visitas ao site", events: ["page_view"] },
  {
    key: "iniciou_avaliacao",
    label: "Iniciou avaliação",
    events: ["iniciou_avaliacao", "category_selected"],
  },
  {
    key: "selecionou_modelo",
    label: "Selecionou modelo",
    events: ["selecionou_modelo", "model_selected"],
  },
  {
    key: "avancou_etapa",
    label: "Avançou etapa",
    events: ["avancou_etapa", "variant_selected", "evaluation_started", "lead_form_started"],
  },
  {
    key: "enviou_avaliacao",
    label: "Enviou avaliação",
    events: ["enviou_avaliacao", "quote_generated"],
  },
  { key: "lead", label: "Lead (WhatsApp)", events: ["lead", "whatsapp_redirect"] },
];

const FUNNEL_EVENT_NAMES = [...new Set(FUNNEL_STEPS.flatMap((s) => s.events))];

// Exclui todo o trafego do painel administrativo (/admin) das metricas.
const EXCLUDE_ADMIN = {
  notExpression: {
    filter: {
      fieldName: "pagePath",
      stringFilter: { matchType: "BEGINS_WITH", value: "/admin" },
    },
  },
};

@Controller("admin/ga-analytics")
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(private readonly ga4: Ga4Service) {}

  /** GET /admin/ga-analytics — visao geral do trafego e funil (GA4). */
  @Get()
  async overview(@Query(new ZodValidationPipe(querySchema)) q: AnalyticsQuery) {
    if (!this.ga4.configured) {
      return { configured: false as const };
    }

    const dateRanges = [{ startDate: `${q.days}daysAgo`, endDate: "today" }];

    const [totals, timeseries, byPage, funnel, byDevice, byChannel] =
      await Promise.all([
        this.ga4.runReport({
          dateRanges,
          metrics: [
            { name: "screenPageViews" },
            { name: "totalUsers" },
            { name: "sessions" },
            { name: "engagementRate" },
          ],
          dimensionFilter: EXCLUDE_ADMIN,
        }),
        this.ga4.runReport({
          dateRanges,
          dimensions: [{ name: "date" }],
          metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
          orderBys: [{ dimension: { dimensionName: "date" } }],
          dimensionFilter: EXCLUDE_ADMIN,
        }),
        this.ga4.runReport({
          dateRanges,
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          dimensionFilter: EXCLUDE_ADMIN,
          limit: 12,
        }),
        this.ga4.runReport({
          dateRanges,
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }],
          dimensionFilter: {
            andGroup: {
              expressions: [
                {
                  filter: {
                    fieldName: "eventName",
                    inListFilter: { values: FUNNEL_EVENT_NAMES },
                  },
                },
                EXCLUDE_ADMIN,
              ],
            },
          },
        }),
        this.ga4.runReport({
          dateRanges,
          dimensions: [{ name: "deviceCategory" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          dimensionFilter: EXCLUDE_ADMIN,
        }),
        this.ga4.runReport({
          dateRanges,
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          dimensionFilter: EXCLUDE_ADMIN,
          limit: 6,
        }),
      ]);

    const totalRow = totals.rows?.[0]?.metricValues ?? [];

    return {
      configured: true as const,
      range: { days: q.days },
      totals: {
        pageViews: num(totalRow[0]?.value),
        users: num(totalRow[1]?.value),
        sessions: num(totalRow[2]?.value),
        engagementRate: num(totalRow[3]?.value),
      },
      timeseries: (timeseries.rows ?? []).map((row) => ({
        date: formatDate(row.dimensionValues?.[0]?.value ?? ""),
        count: num(row.metricValues?.[0]?.value),
        users: num(row.metricValues?.[1]?.value),
      })),
      byPage: (byPage.rows ?? []).map((row) => ({
        path: row.dimensionValues?.[0]?.value ?? "—",
        views: num(row.metricValues?.[0]?.value),
        users: num(row.metricValues?.[1]?.value),
      })),
      funnel: buildFunnel(funnel),
      byDevice: simpleRows(byDevice),
      byChannel: simpleRows(byChannel),
    };
  }
}

function buildFunnel(report: GaReport) {
  const counts = new Map<string, number>();
  for (const row of report.rows ?? []) {
    const event = row.dimensionValues?.[0]?.value ?? "";
    counts.set(event, num(row.metricValues?.[0]?.value));
  }
  return FUNNEL_STEPS.map((step) => ({
    key: step.key,
    label: step.label,
    count: step.events.reduce((sum, name) => sum + (counts.get(name) ?? 0), 0),
  }));
}

function simpleRows(report: GaReport) {
  return (report.rows ?? []).map((row) => ({
    label: row.dimensionValues?.[0]?.value ?? "—",
    value: num(row.metricValues?.[0]?.value),
  }));
}

function num(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// GA4 devolve datas no formato YYYYMMDD.
function formatDate(raw: string): string {
  if (raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}
