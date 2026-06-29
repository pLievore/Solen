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
const FUNNEL_STEPS: { key: string; label: string }[] = [
  { key: "page_view", label: "Visitas (page_view)" },
  { key: "iniciou_avaliacao", label: "Iniciou avaliacao" },
  { key: "selecionou_modelo", label: "Selecionou modelo" },
  { key: "avancou_etapa", label: "Avancou etapa" },
  { key: "enviou_avaliacao", label: "Enviou avaliacao" },
  { key: "lead", label: "Lead (WhatsApp)" },
];

@Controller("admin/analytics")
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(private readonly ga4: Ga4Service) {}

  /** GET /admin/analytics — visao geral do trafego e funil (GA4). */
  @Get()
  async overview(@Query(new ZodValidationPipe(querySchema)) q: AnalyticsQuery) {
    if (!this.ga4.configured) {
      return { configured: false as const };
    }

    const dateRanges = [{ startDate: `${q.days}daysAgo`, endDate: "today" }];

    const [totals, timeseries, byPage, funnel] = await Promise.all([
      this.ga4.runReport({
        dateRanges,
        metrics: [
          { name: "screenPageViews" },
          { name: "totalUsers" },
          { name: "sessions" },
        ],
      }),
      this.ga4.runReport({
        dateRanges,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      this.ga4.runReport({
        dateRanges,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 20,
      }),
      this.ga4.runReport({
        dateRanges,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: { values: FUNNEL_STEPS.map((s) => s.key) },
          },
        },
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
      },
      timeseries: (timeseries.rows ?? []).map((row) => ({
        date: formatDate(row.dimensionValues?.[0]?.value ?? ""),
        count: num(row.metricValues?.[0]?.value),
      })),
      byPage: (byPage.rows ?? []).map((row) => ({
        path: row.dimensionValues?.[0]?.value ?? "—",
        views: num(row.metricValues?.[0]?.value),
        users: num(row.metricValues?.[1]?.value),
      })),
      funnel: buildFunnel(funnel),
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
    count: counts.get(step.key) ?? 0,
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
