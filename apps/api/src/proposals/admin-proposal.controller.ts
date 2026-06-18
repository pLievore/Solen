import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

const patchStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED", "LOST"]),
});
type PatchStatus = z.infer<typeof patchStatusSchema>;

const listQuerySchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED", "LOST"]).optional(),
  token: z.string().optional(),
  sort: z.enum(["createdAt", "calculatedValue"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
});
type ListQuery = z.infer<typeof listQuerySchema>;

@Controller("admin/proposals")
@UseGuards(SupabaseAuthGuard)
export class AdminProposalController {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /api/admin/proposals — lista paginada com filtros. */
  @Get()
  async list(@Query(new ZodValidationPipe(listQuerySchema)) q: ListQuery) {
    const where: Record<string, unknown> = {};
    if (q.status) where.status = q.status;
    if (q.token) where.token = { contains: q.token.toUpperCase(), mode: "insensitive" };

    const [total, items] = await Promise.all([
      this.prisma.proposal.count({ where }),
      this.prisma.proposal.findMany({
        where,
        orderBy: { [q.sort]: q.order },
        skip: q.skip,
        take: q.take,
        include: {
          variant: {
            include: { model: true },
          },
        },
      }),
    ]);

    return { total, skip: q.skip, take: q.take, items };
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
    return proposal;
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
}
