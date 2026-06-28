import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

const STATUSES = ["RECEBIDO", "EM_REPARO", "CONCLUIDO", "ENTREGUE"] as const;

const nullableText = z.string().trim().max(2000).nullable().optional();

const createSchema = z.object({
  model: z.string().trim().min(1, "Informe o modelo do aparelho").max(200),
  imageUrl: z.string().url().nullable().optional(),
  technicianId: z.string().nullable().optional(),
  technicianEmail: z.string().email().nullable().optional(),
  accessNotes: nullableText,
  priorDefects: nullableText,
  services: nullableText,
  status: z.enum(STATUSES).optional(),
  proposalId: z.string().uuid().nullable().optional(),
});
type CreateDto = z.infer<typeof createSchema>;

const updateSchema = createSchema.partial();
type UpdateDto = z.infer<typeof updateSchema>;

const fromProposalSchema = z.object({
  proposalId: z.string().uuid(),
});
type FromProposalDto = z.infer<typeof fromProposalSchema>;

/** Monta o rótulo de exibição do aparelho a partir da versão/modelo. */
function variantLabel(variant: {
  name: string;
  model: { name: string };
}): string {
  return variant.name.startsWith(variant.model.name)
    ? variant.name
    : `${variant.model.name} ${variant.name}`;
}

const proposalInclude = {
  proposal: { select: { id: true, token: true, sellerName: true } },
} as const;

@Controller("admin/repair-devices")
@UseGuards(SupabaseAuthGuard)
export class RepairDeviceController {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /admin/repair-devices — admin vê todos; técnico vê só os seus. */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.repairDevice.findMany({
      where: user.role !== "admin" ? { technicianId: user.id } : {},
      orderBy: { createdAt: "desc" },
      include: proposalInclude,
    });
  }

  /**
   * GET /admin/repair-devices/linkable-proposals — lista de propostas para
   * vincular a um aparelho. Sem valores (uso na assistência). Admin apenas.
   */
  @Get("linkable-proposals")
  async linkableProposals(@CurrentUser() user: AuthUser) {
    if (user.role !== "admin") {
      throw new ForbiddenException("Sem acesso às propostas");
    }
    const proposals = await this.prisma.proposal.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        token: true,
        sellerName: true,
        sellerWhatsapp: true,
        status: true,
        isScrap: true,
        createdAt: true,
        variant: { select: { name: true, model: { select: { name: true } } } },
        repairDevices: { select: { id: true } },
      },
    });
    // Sem valor: expõe apenas dados operacionais para a vinculação.
    return proposals.map((p) => ({
      id: p.id,
      token: p.token,
      sellerName: p.sellerName,
      sellerWhatsapp: p.sellerWhatsapp,
      status: p.status,
      isScrap: p.isScrap,
      createdAt: p.createdAt,
      deviceLabel: variantLabel(p.variant),
      linkedDeviceId: p.repairDevices[0]?.id ?? null,
    }));
  }

  /** GET /admin/repair-devices/:id — detalhe (técnico só do próprio). */
  @Get(":id")
  async detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const device = await this.prisma.repairDevice.findUnique({
      where: { id },
      include: proposalInclude,
    });
    if (!device) throw new NotFoundException("Aparelho não encontrado");
    if (user.role !== "admin" && device.technicianId !== user.id) {
      throw new ForbiddenException("Sem acesso a este aparelho");
    }
    return device;
  }

  /** POST /admin/repair-devices — cadastra (admin). */
  @Post()
  async create(@Body(new ZodValidationPipe(createSchema)) dto: CreateDto) {
    if (dto.proposalId) await this.assertProposalExists(dto.proposalId);
    return this.prisma.repairDevice.create({
      data: {
        model: dto.model,
        imageUrl: dto.imageUrl ?? null,
        technicianId: dto.technicianId ?? null,
        technicianEmail: dto.technicianEmail ?? null,
        accessNotes: dto.accessNotes ?? null,
        priorDefects: dto.priorDefects ?? null,
        services: dto.services ?? null,
        status: dto.status ?? "RECEBIDO",
        proposalId: dto.proposalId ?? null,
      },
      include: proposalInclude,
    });
  }

  /**
   * POST /admin/repair-devices/from-proposal — envia uma proposta para a
   * assistência, criando o aparelho com o modelo derivado da versão. Admin
   * apenas. Se a proposta já tiver um aparelho vinculado, devolve o existente.
   */
  @Post("from-proposal")
  async fromProposal(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(fromProposalSchema)) dto: FromProposalDto,
  ) {
    if (user.role !== "admin") {
      throw new ForbiddenException("Sem acesso às propostas");
    }
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: dto.proposalId },
      include: {
        variant: { select: { name: true, model: { select: { name: true } } } },
        repairDevices: { select: { id: true }, take: 1 },
      },
    });
    if (!proposal) throw new NotFoundException("Proposta não encontrada");

    // Idempotente: já existe um aparelho para esta proposta.
    if (proposal.repairDevices[0]) {
      return this.prisma.repairDevice.findUnique({
        where: { id: proposal.repairDevices[0].id },
        include: proposalInclude,
      });
    }

    return this.prisma.repairDevice.create({
      data: {
        model: variantLabel(proposal.variant),
        priorDefects: proposal.isScrap ? "Avaliado como sucata no site." : null,
        proposalId: proposal.id,
        status: "RECEBIDO",
      },
      include: proposalInclude,
    });
  }

  /** PATCH /admin/repair-devices/:id — edita (admin). */
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSchema)) dto: UpdateDto,
  ) {
    const exists = await this.prisma.repairDevice.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Aparelho não encontrado");
    if (dto.proposalId) await this.assertProposalExists(dto.proposalId);
    return this.prisma.repairDevice.update({
      where: { id },
      data: dto,
      include: proposalInclude,
    });
  }

  private async assertProposalExists(proposalId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
      select: { id: true },
    });
    if (!proposal) throw new NotFoundException("Proposta não encontrada");
  }

  /** DELETE /admin/repair-devices/:id — remove (admin). */
  @Delete(":id")
  async remove(@Param("id") id: string) {
    const exists = await this.prisma.repairDevice.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Aparelho não encontrado");
    await this.prisma.repairDevice.delete({ where: { id } });
    return { id };
  }
}
