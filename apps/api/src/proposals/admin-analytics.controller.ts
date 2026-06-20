import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

const querySchema = z.object({
  // janela em dias; "all" = sem corte
  days: z
    .union([z.coerce.number().int().positive(), z.literal("all")])
    .default(30),
});
type AnalyticsQuery = z.infer<typeof querySchema>;

const VALUE_BRACKETS: { label: string; min: number; max: number | null }[] = [
  { label: "Até R$ 300", min: 0, max: 30000 },
  { label: "R$ 300–700", min: 30000, max: 70000 },
  { label: "R$ 700–1.500", min: 70000, max: 150000 },
  { label: "Acima de R$ 1.500", min: 150000, max: null },
];

type Row = {
  status: string;
  isScrap: boolean;
  calculatedValue: number;
  pickupPoint: string | null;
  createdAt: Date;
  variant: { model: { name: string; category: { name: string } } };
};

@Controller("admin/analytics")
@UseGuards(SupabaseAuthGuard)
export class AdminAnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async analytics(@Query(new ZodValidationPipe(querySchema)) q: AnalyticsQuery) {
    const days = q.days === "all" ? null : q.days;
    const now = new Date();
    const from = days ? new Date(now.getTime() - days * 86_400_000) : null;
    const prevFrom = days
      ? new Date(now.getTime() - 2 * days * 86_400_000)
      : null;

    // Carrega o necessário (volume de leads é baixo) e agrega em JS.
    const rows = (await this.prisma.proposal.findMany({
      where: from ? { createdAt: { gte: prevFrom! } } : {},
      select: {
        status: true,
        isScrap: true,
        calculatedValue: true,
        pickupPoint: true,
        createdAt: true,
        variant: {
          select: { model: { select: { name: true, category: { select: { name: true } } } } },
        },
      },
      orderBy: { createdAt: "asc" },
    })) as Row[];

    const inRange = from ? rows.filter((r) => r.createdAt >= from) : rows;
    const inPrev =
      from && prevFrom
        ? rows.filter((r) => r.createdAt >= prevFrom && r.createdAt < from)
        : [];

    // ── KPIs ────────────────────────────────────────────────────────────────
    const totalLeads = inRange.length;
    const pipelineValue = sum(inRange.map((r) => r.calculatedValue));
    const closed = inRange.filter((r) => r.status === "CLOSED");
    const wonValue = sum(closed.map((r) => r.calculatedValue));
    const avgTicket = totalLeads ? Math.round(pipelineValue / totalLeads) : 0;
    const conversionRate = totalLeads ? closed.length / totalLeads : 0;
    const scrapRate = totalLeads
      ? inRange.filter((r) => r.isScrap).length / totalLeads
      : 0;
    const leadsPrev = inPrev.length;
    const deltaPct =
      leadsPrev > 0
        ? (totalLeads - leadsPrev) / leadsPrev
        : totalLeads > 0
          ? null
          : 0;

    // ── Série temporal (por dia) ───────────────────────────────────────────
    const tsMap = new Map<string, { count: number; value: number }>();
    if (from) {
      for (let d = new Date(from); d <= now; d = new Date(d.getTime() + 86_400_000)) {
        tsMap.set(dayKey(d), { count: 0, value: 0 });
      }
    }
    for (const r of inRange) {
      const k = dayKey(r.createdAt);
      const cur = tsMap.get(k) ?? { count: 0, value: 0 };
      cur.count += 1;
      cur.value += r.calculatedValue;
      tsMap.set(k, cur);
    }
    const timeseries = Array.from(tsMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    // ── Por status ──────────────────────────────────────────────────────────
    const byStatus = groupCountValue(inRange, (r) => r.status).map(([status, v]) => ({
      status,
      ...v,
    }));

    // ── Por categoria ─────────────────────────────────────────────────────────
    const byCategory = groupCountValue(
      inRange,
      (r) => r.variant.model.category.name,
    )
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.value - a.value);

    // ── Top modelos ────────────────────────────────────────────────────────
    const topModels = groupCountValue(
      inRange,
      (r) => `${r.variant.model.category.name}::${r.variant.model.name}`,
    )
      .map(([key, v]) => {
        const [category, model] = key.split("::");
        return { model, category, ...v };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ── Por ponto de coleta ──────────────────────────────────────────────────
    const byPickup = groupCountValue(inRange, (r) => r.pickupPoint ?? "Não informado")
      .map(([label, v]) => ({ label, count: v.count }))
      .sort((a, b) => b.count - a.count);

    // ── Faixas de valor ──────────────────────────────────────────────────────
    const byValueBracket = VALUE_BRACKETS.map((b) => {
      const items = inRange.filter(
        (r) =>
          r.calculatedValue >= b.min &&
          (b.max === null || r.calculatedValue < b.max),
      );
      return {
        label: b.label,
        min: b.min,
        max: b.max,
        count: items.length,
        closed: items.filter((r) => r.status === "CLOSED").length,
      };
    });

    return {
      range: { days, from: from ? from.toISOString() : null },
      kpis: {
        totalLeads,
        pipelineValue,
        wonValue,
        avgTicket,
        conversionRate,
        scrapRate,
        leadsCurrent: totalLeads,
        leadsPrev,
        deltaPct,
      },
      timeseries,
      byStatus,
      byCategory,
      topModels,
      byPickup,
      byValueBracket,
    };
  }
}

function sum(ns: number[]): number {
  return ns.reduce((a, b) => a + b, 0);
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function groupCountValue<T>(
  rows: T[],
  keyFn: (r: T) => string,
): [string, { count: number; value: number }][] {
  const m = new Map<string, { count: number; value: number }>();
  for (const r of rows) {
    const k = keyFn(r);
    const cur = m.get(k) ?? { count: 0, value: 0 };
    cur.count += 1;
    cur.value += (r as unknown as { calculatedValue: number }).calculatedValue;
    m.set(k, cur);
  }
  return Array.from(m.entries());
}
