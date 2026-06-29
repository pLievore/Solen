import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Ga4Service, type GaReport } from "./ga4.service";

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(28),
});
type AnalyticsQuery = z.infer<typeof querySchema>;

// Etapas do funil (raso -> profundo). Cada nome novo soma os antigos
// equivalentes (historico anterior a padronizacao). O funil e medido por
// USUARIOS UNICOS que chegaram PELO MENOS ate cada etapa (uniao cumulativa
// dos eventos a partir dela) — garante um funil sempre decrescente, mesmo
// com quem entra direto numa pagina mais funda (deep link).
const FUNNEL_STAGES: { key: string; label: string; events: string[] }[] = [
  {
    key: "selecionou_modelo",
    label: "Escolheu aparelho",
    events: ["selecionou_modelo", "model_selected"],
  },
  {
    key: "avancou_etapa",
    label: "Avançou no formulário",
    events: ["avancou_etapa", "variant_selected", "evaluation_started", "lead_form_started"],
  },
  {
    key: "enviou_avaliacao",
    label: "Enviou avaliação",
    events: ["enviou_avaliacao", "quote_generated"],
  },
  { key: "lead", label: "Lead (WhatsApp)", events: ["lead", "whatsapp_redirect"] },
];

// Para cada etapa, a uniao cumulativa de eventos dela e das seguintes.
const FUNNEL_UNIONS = FUNNEL_STAGES.map((_, i) =>
  FUNNEL_STAGES.slice(i).flatMap((s) => s.events),
);

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

    const [
      totals,
      timeseries,
      byPage,
      byDevice,
      byChannel,
      byCity,
      byRegion,
      ...stageReports
    ] = await Promise.all([
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
        this.ga4.runReport({
          dateRanges,
          dimensions: [{ name: "city" }, { name: "region" }],
          metrics: [{ name: "totalUsers" }],
          orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
          dimensionFilter: EXCLUDE_ADMIN,
          limit: 15,
        }),
        this.ga4.runReport({
          dateRanges,
          dimensions: [{ name: "region" }],
          metrics: [{ name: "totalUsers" }],
          orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
          dimensionFilter: EXCLUDE_ADMIN,
          limit: 20,
        }),
        // Etapas do funil: usuarios unicos por uniao cumulativa de eventos.
        ...FUNNEL_UNIONS.map((events) =>
          this.ga4.runReport({
            dateRanges,
            metrics: [{ name: "totalUsers" }],
            dimensionFilter: {
              andGroup: {
                expressions: [
                  {
                    filter: {
                      fieldName: "eventName",
                      inListFilter: { values: events },
                    },
                  },
                  EXCLUDE_ADMIN,
                ],
              },
            },
          }),
        ),
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
      funnel: [
        { key: "visitantes", label: "Visitantes", count: num(totalRow[1]?.value) },
        ...FUNNEL_STAGES.map((stage, i) => ({
          key: stage.key,
          label: stage.label,
          count: num(stageReports[i]?.rows?.[0]?.metricValues?.[0]?.value),
        })),
      ],
      byDevice: simpleRows(byDevice),
      byChannel: simpleRows(byChannel),
      byCity: (byCity.rows ?? [])
        .map((row) => ({
          city: row.dimensionValues?.[0]?.value ?? "—",
          region: row.dimensionValues?.[1]?.value ?? "",
          value: num(row.metricValues?.[0]?.value),
        }))
        .filter((r) => r.city && r.city !== "(not set)"),
      byRegion: simpleRows(byRegion).filter((r) => r.label && r.label !== "(not set)"),
    };
  }
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
