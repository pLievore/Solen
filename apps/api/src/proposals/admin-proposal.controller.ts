import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

const patchStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED", "LOST"]),
});
type PatchStatus = z.infer<typeof patchStatusSchema>;

const patchValueSchema = z.object({
  // centavos; null limpa o ajuste e volta ao valor original
  value: z.number().int().min(0).nullable(),
});
type PatchValue = z.infer<typeof patchValueSchema>;

const filtersQuerySchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED", "LOST"]).optional(),
  token: z.string().optional(),
  category: z.string().optional(),
  model: z.string().optional(),
  pickup: z.string().optional(),
  minValue: z.coerce.number().int().min(0).optional(),
  maxValue: z.coerce.number().int().positive().optional(),
  days: z
    .union([z.coerce.number().int().positive(), z.literal("all")])
    .default("all"),
  sort: z.enum(["createdAt", "calculatedValue"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

const listQuerySchema = filtersQuerySchema.extend({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
});
type ListQuery = z.infer<typeof listQuerySchema>;
type FiltersQuery = z.infer<typeof filtersQuerySchema>;

@Controller("admin/proposals")
@UseGuards(SupabaseAuthGuard)
export class AdminProposalController {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /api/admin/proposals — lista paginada com filtros. */
  @Get()
  async list(@Query(new ZodValidationPipe(listQuerySchema)) q: ListQuery) {
    const where = proposalWhere(q);

    const [total, items, aggregate, closed, categories, pickups] = await Promise.all([
      this.prisma.proposal.count({ where }),
      this.prisma.proposal.findMany({
        where,
        orderBy: { [q.sort]: q.order },
        skip: q.skip,
        take: q.take,
        include: {
          variant: {
            include: { model: { include: { category: true } } },
          },
        },
      }),
      this.prisma.proposal.aggregate({
        where,
        _sum: { calculatedValue: true },
        _avg: { calculatedValue: true },
      }),
      this.prisma.proposal.count({ where: { AND: [where, { status: "CLOSED" }] } }),
      this.prisma.category.findMany({
        where: {
          models: {
            some: {
              variants: {
                some: { proposals: { some: {} } },
              },
            },
          },
        },
        select: { name: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
      this.prisma.proposal.findMany({
        distinct: ["pickupPoint"],
        select: { pickupPoint: true },
        orderBy: { pickupPoint: "asc" },
      }),
    ]);

    return {
      total,
      skip: q.skip,
      take: q.take,
      items,
      summary: {
        totalValue: aggregate._sum.calculatedValue ?? 0,
        avgTicket: Math.round(aggregate._avg.calculatedValue ?? 0),
        closed,
        conversionRate: total ? closed / total : 0,
      },
      filters: {
        categories: categories.map((category) => category.name),
        pickupPoints: pickups.map(({ pickupPoint }) => ({
          value: pickupPoint ?? "__none__",
          label: pickupPoint ?? "Não informado",
        })),
      },
    };
  }

  /** GET /api/admin/proposals/export — exporta todas as propostas filtradas. */
  @Get("export")
  async export(@Query(new ZodValidationPipe(filtersQuerySchema)) q: FiltersQuery) {
    const items = await this.prisma.proposal.findMany({
      where: proposalWhere(q),
      orderBy: { [q.sort]: q.order },
      include: {
        variant: {
          include: { model: { include: { category: true } } },
        },
      },
    });

    const header = [
      "Token",
      "Data",
      "Status",
      "Categoria",
      "Modelo",
      "Versão",
      "Valor (R$)",
      "Sucata",
      "Vendedor",
      "WhatsApp",
      "Cidade",
      "Bairro",
      "CEP",
      "Ponto de coleta",
    ];
    const rows = items.map((proposal) => [
      proposal.token,
      proposal.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      proposal.status,
      proposal.variant.model.category.name,
      proposal.variant.model.name,
      proposal.variant.name,
      (proposal.calculatedValue / 100).toFixed(2).replace(".", ","),
      proposal.isScrap ? "Sim" : "Não",
      proposal.sellerName,
      proposal.sellerWhatsapp,
      proposal.city,
      proposal.neighborhood,
      proposal.cep,
      proposal.pickupPoint ?? "Não informado",
    ]);
    const csv = `\uFEFF${[header, ...rows]
      .map((row) => row.map(csvCell).join(";"))
      .join("\r\n")}`;
    const date = new Date().toISOString().slice(0, 10);

    return { csv, filename: `propostas-${date}.csv`, total: items.length };
  }

  /** GET /api/admin/proposals/:id — detalhe completo. */
  @Get(":id")
  async detail(@Param("id") id: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: {
        variant: {
          include: {
            model: { include: { category: true } },
          },
        },
      },
    });
    if (!proposal) throw new NotFoundException("Proposta não encontrada");

    // Resolve os ids das perguntas para o texto real (em vez do hash).
    const answers = (proposal.answers ?? {}) as {
      knockout?: { questionId: string; answer: string }[];
      detailed?: { questionId: string; answer: string }[];
    };
    const knockoutAnswers = answers.knockout ?? [];
    const detailedAnswers = answers.detailed ?? [];

    const [knockoutQuestions, detailedQuestions] = await Promise.all([
      this.prisma.knockoutQuestion.findMany({
        where: { id: { in: knockoutAnswers.map((a) => a.questionId) } },
        select: { id: true, question: true },
      }),
      this.prisma.detailedState.findMany({
        where: { id: { in: detailedAnswers.map((a) => a.questionId) } },
        select: { id: true, question: true },
      }),
    ]);
    const knockoutMap = new Map(knockoutQuestions.map((q) => [q.id, q.question]));
    const detailedMap = new Map(detailedQuestions.map((q) => [q.id, q.question]));

    return {
      ...proposal,
      answers: {
        knockout: knockoutAnswers.map((a) => ({
          ...a,
          question: knockoutMap.get(a.questionId) ?? a.questionId,
        })),
        detailed: detailedAnswers.map((a) => ({
          ...a,
          question: detailedMap.get(a.questionId) ?? a.questionId,
        })),
      },
    };
  }

  /** PATCH /api/admin/proposals/:id — atualiza status. */
  @Patch(":id")
  async updateStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(patchStatusSchema)) dto: PatchStatus,
  ) {
    const exists = await this.prisma.proposal.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("Proposta não encontrada");
    return this.prisma.proposal.update({
      where: { id },
      data: { status: dto.status },
      select: { id: true, status: true },
    });
  }

  /** PATCH /api/admin/proposals/:id/value — ajusta o valor (preserva o original). */
  @Patch(":id/value")
  async updateValue(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(patchValueSchema)) dto: PatchValue,
  ) {
    const exists = await this.prisma.proposal.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Proposta não encontrada");
    return this.prisma.proposal.update({
      where: { id },
      data: { overriddenValue: dto.value },
      select: { id: true, calculatedValue: true, overriddenValue: true },
    });
  }

  /** DELETE /api/admin/proposals/:id — exclui uma proposta. */
  @Delete(":id")
  async remove(@Param("id") id: string) {
    const exists = await this.prisma.proposal.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Proposta não encontrada");

    await this.prisma.proposal.delete({ where: { id } });
    return { id };
  }
}

function proposalWhere(q: FiltersQuery): Prisma.ProposalWhereInput {
  const where: Prisma.ProposalWhereInput = {};
  if (q.status) where.status = q.status;
  if (q.token) {
    where.token = { contains: q.token.trim().toUpperCase(), mode: "insensitive" };
  }
  if (q.category || q.model) {
    where.variant = {
      model: {
        ...(q.model ? { name: q.model } : {}),
        ...(q.category ? { category: { name: q.category } } : {}),
      },
    };
  }
  if (q.pickup) {
    where.pickupPoint = q.pickup === "__none__" ? null : q.pickup;
  }
  if (q.minValue !== undefined || q.maxValue !== undefined) {
    where.calculatedValue = {
      ...(q.minValue !== undefined ? { gte: q.minValue } : {}),
      ...(q.maxValue !== undefined ? { lt: q.maxValue } : {}),
    };
  }
  if (q.days !== "all") {
    where.createdAt = {
      gte: new Date(Date.now() - q.days * 86_400_000),
    };
  }
  return where;
}

function csvCell(value: string | null | undefined): string {
  const text = value ?? "";
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
