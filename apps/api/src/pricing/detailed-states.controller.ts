import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  detailedStateCreateSchema,
  detailedStateUpdateSchema,
  variantDetailedStatesSchema,
  type DetailedStateCreate,
  type DetailedStateUpdate,
  type VariantDetailedStates,
} from "@vendy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

/** CRUD dos estados detalhados (perguntas de desconto), globais. */
@Controller("admin/detailed-states")
@UseGuards(SupabaseAuthGuard)
export class DetailedStatesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.detailedState.findMany({ orderBy: { order: "asc" } });
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(detailedStateCreateSchema))
    dto: DetailedStateCreate,
  ) {
    return this.prisma.detailedState.create({ data: dto });
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(detailedStateUpdateSchema))
    dto: DetailedStateUpdate,
  ) {
    return this.prisma.detailedState.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.prisma.detailedState.delete({ where: { id } });
  }
}

/** Atribuicao de estados detalhados a uma versao (substitui o conjunto). */
@Controller("admin/variants")
@UseGuards(SupabaseAuthGuard)
export class VariantDetailedStatesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(":id/detailed-states")
  list(@Param("id") id: string) {
    return this.prisma.variantDetailedState.findMany({
      where: { variantId: id },
      include: { detailedState: true },
    });
  }

  @Put(":id/detailed-states")
  async assign(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(variantDetailedStatesSchema))
    dto: VariantDetailedStates,
  ) {
    await this.prisma.$transaction([
      this.prisma.variantDetailedState.deleteMany({ where: { variantId: id } }),
      ...dto.items.map((it) =>
        this.prisma.variantDetailedState.create({
          data: {
            variantId: id,
            detailedStateId: it.detailedStateId,
            yesDeltaOverride: it.yesDeltaOverride ?? null,
            noDeltaOverride: it.noDeltaOverride ?? null,
          },
        }),
      ),
    ]);
    return this.list(id);
  }
}
