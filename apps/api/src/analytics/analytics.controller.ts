import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PrismaService } from "../prisma/prisma.service";
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

// Para relatorios por landingPage, filtra pela propria pagina de entrada.
const EXCLUDE_ADMIN_LANDING = {
  notExpression: {
    filter: {
      fieldName: "landingPage",
      stringFilter: { matchType: "BEGINS_WITH", value: "/admin" },
    },
  },
};

@Controller("admin/ga-analytics")
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly ga4: Ga4Service,
    private readonly prisma: PrismaService,
  ) {}

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
      byHour,
      byWeekday,
      bySource,
      byOS,
      byLanding,
      ...stageReports
    ] = await Promise.all([
        this.ga4.runReport({
          dateRanges,
          metrics: [
            { name: "screenPageViews" },
            { name: "totalUsers" },
            { name: "sessions" },
            { name: "engagementRate" },
            { name: "newUsers" },
            { name: "averageSessionDuration" },
            { name: "bounceRate" },
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
        this.ga4.runReport({
          dateRanges,
          dimensions: [{ name: "hour" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ dimension: { dimensionName: "hour" } }],
          dimensionFilter: EXCLUDE_ADMIN,
        }),
        this.ga4.runReport({
          dateRanges,
          dimensions: [{ name: "dayOfWeek" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ dimension: { dimensionName: "dayOfWeek" } }],
          dimensionFilter: EXCLUDE_ADMIN,
        }),
        this.ga4.runReport({
          dateRanges,
          dimensions: [{ name: "sessionSourceMedium" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          dimensionFilter: EXCLUDE_ADMIN,
          limit: 8,
        }),
        this.ga4.runReport({
          dateRanges,
          dimensions: [{ name: "operatingSystem" }],
          metrics: [{ name: "totalUsers" }],
          orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
          dimensionFilter: EXCLUDE_ADMIN,
          limit: 6,
        }),
        this.ga4.runReport({
          dateRanges,
          dimensions: [{ name: "landingPage" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          dimensionFilter: EXCLUDE_ADMIN_LANDING,
          limit: 8,
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

    // ── Resultado comercial (banco de propostas) ──────────────────────────
    const since = new Date(Date.now() - q.days * 86_400_000);
    const [statusGroups, closedRows, answerRows, detailedStates, repairRows] =
      await Promise.all([
      this.prisma.proposal.groupBy({
        by: ["status"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.proposal.findMany({
        where: { createdAt: { gte: since }, status: "CLOSED" },
        select: { calculatedValue: true, overriddenValue: true },
      }),
      this.prisma.proposal.findMany({
        where: { createdAt: { gte: since } },
        select: { answers: true, isScrap: true },
      }),
      this.prisma.detailedState.findMany({ select: { id: true, question: true } }),
      this.prisma.repairDevice.findMany({
        where: { createdAt: { gte: since } },
        select: { status: true, technicianEmail: true, createdAt: true, updatedAt: true },
      }),
    ]);
    const statusCount = (s: string) =>
      statusGroups.find((g) => g.status === s)?._count._all ?? 0;
    const salesTotal = statusGroups.reduce((a, g) => a + g._count._all, 0);
    const closedValue = closedRows.reduce(
      (a, p) => a + (p.overriddenValue ?? p.calculatedValue),
      0,
    );
    const closedCount = closedRows.length;

    // Perfil do estoque: agrega as respostas detalhadas das avaliacoes.
    const detailedMap = new Map(detailedStates.map((d) => [d.id, d.question]));
    const answerAgg = new Map<string, { question: string; yes: number; no: number }>();
    let scrapCount = 0;
    for (const row of answerRows) {
      if (row.isScrap) scrapCount++;
      const detailed =
        ((row.answers as { detailed?: { questionId: string; answer: string }[] })
          ?.detailed) ?? [];
      for (const ans of detailed) {
        const question = detailedMap.get(ans.questionId);
        if (!question) continue;
        const entry = answerAgg.get(ans.questionId) ?? { question, yes: 0, no: 0 };
        if (ans.answer === "YES") entry.yes++;
        else entry.no++;
        answerAgg.set(ans.questionId, entry);
      }
    }
    const inventoryQuestions = [...answerAgg.values()]
      .map((e) => ({ ...e, total: e.yes + e.no }))
      .sort((a, b) => b.total - a.total);

    // Assistencia tecnica: status, tecnico e tempo medio de reparo.
    const REPAIR_LABELS: Record<string, string> = {
      RECEBIDO: "Recebido",
      EM_REPARO: "Em reparo",
      CONCLUIDO: "Concluído",
      ENTREGUE: "Entregue",
    };
    const repairStatus = new Map<string, number>();
    const repairTech = new Map<string, number>();
    let repairDoneDaysSum = 0;
    let repairDoneCount = 0;
    for (const r of repairRows) {
      repairStatus.set(r.status, (repairStatus.get(r.status) ?? 0) + 1);
      const tech = r.technicianEmail ?? "Sem técnico";
      repairTech.set(tech, (repairTech.get(tech) ?? 0) + 1);
      if (r.status === "CONCLUIDO" || r.status === "ENTREGUE") {
        repairDoneDaysSum +=
          (r.updatedAt.getTime() - r.createdAt.getTime()) / 86_400_000;
        repairDoneCount++;
      }
    }

    return {
      configured: true as const,
      range: { days: q.days },
      totals: {
        pageViews: num(totalRow[0]?.value),
        users: num(totalRow[1]?.value),
        sessions: num(totalRow[2]?.value),
        engagementRate: num(totalRow[3]?.value),
        newUsers: num(totalRow[4]?.value),
        avgSessionDuration: num(totalRow[5]?.value),
        bounceRate: num(totalRow[6]?.value),
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
      byHour: fillSeries(byHour, 24),
      byWeekday: fillSeries(byWeekday, 7),
      bySource: simpleRows(bySource).filter((r) => r.label && r.label !== "(not set)"),
      byOS: simpleRows(byOS),
      byLanding: simpleRows(byLanding).filter((r) => r.label && r.label !== "(not set)"),
      byCity: (byCity.rows ?? [])
        .map((row) => ({
          city: row.dimensionValues?.[0]?.value ?? "—",
          region: row.dimensionValues?.[1]?.value ?? "",
          value: num(row.metricValues?.[0]?.value),
        }))
        .filter((r) => r.city && r.city !== "(not set)"),
      byRegion: simpleRows(byRegion).filter((r) => r.label && r.label !== "(not set)"),
      sales: {
        total: salesTotal,
        novas: statusCount("NEW"),
        emContato: statusCount("CONTACTED"),
        fechadas: closedCount,
        perdidas: statusCount("LOST"),
        valorFechado: closedValue,
        ticket: closedCount > 0 ? Math.round(closedValue / closedCount) : 0,
      },
      inventory: {
        scrapRate: answerRows.length > 0 ? scrapCount / answerRows.length : 0,
        questions: inventoryQuestions,
      },
      repairs: {
        total: repairRows.length,
        avgDays: repairDoneCount > 0 ? repairDoneDaysSum / repairDoneCount : 0,
        byStatus: [...repairStatus.entries()].map(([key, value]) => ({
          label: REPAIR_LABELS[key] ?? key,
          value,
        })),
        byTechnician: [...repairTech.entries()]
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value),
      },
    };
  }
}

function simpleRows(report: GaReport) {
  return (report.rows ?? []).map((row) => ({
    label: row.dimensionValues?.[0]?.value ?? "—",
    value: num(row.metricValues?.[0]?.value),
  }));
}

// Preenche uma serie indexada (hora 0-23 / dia 0-6) com zeros nos buracos.
function fillSeries(report: GaReport, size: number): number[] {
  const map = new Map<number, number>();
  for (const row of report.rows ?? []) {
    map.set(Number(row.dimensionValues?.[0]?.value), num(row.metricValues?.[0]?.value));
  }
  return Array.from({ length: size }, (_, i) => map.get(i) ?? 0);
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
