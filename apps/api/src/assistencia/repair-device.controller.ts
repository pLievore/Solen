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
});
type CreateDto = z.infer<typeof createSchema>;

const updateSchema = createSchema.partial();
type UpdateDto = z.infer<typeof updateSchema>;

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
    });
  }

  /** GET /admin/repair-devices/:id — detalhe (técnico só do próprio). */
  @Get(":id")
  async detail(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const device = await this.prisma.repairDevice.findUnique({ where: { id } });
    if (!device) throw new NotFoundException("Aparelho não encontrado");
    if (user.role !== "admin" && device.technicianId !== user.id) {
      throw new ForbiddenException("Sem acesso a este aparelho");
    }
    return device;
  }

  /** POST /admin/repair-devices — cadastra (admin). */
  @Post()
  create(@Body(new ZodValidationPipe(createSchema)) dto: CreateDto) {
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
      },
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
    return this.prisma.repairDevice.update({ where: { id }, data: dto });
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
