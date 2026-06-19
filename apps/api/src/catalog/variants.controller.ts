import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  variantCreateSchema,
  variantUpdateSchema,
  type VariantCreate,
  type VariantUpdate,
} from "@vendy/shared";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

@Controller("admin/variants")
@UseGuards(SupabaseAuthGuard)
export class VariantsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query("modelId") modelId?: string) {
    return this.prisma.variant.findMany({
      where: modelId ? { modelId } : undefined,
      orderBy: { name: "asc" },
      include: { model: { select: { id: true, name: true } } },
    });
  }

  /** Detalhe da versao com precos base e estados detalhados atribuidos. */
  @Get(":id")
  detail(@Param("id") id: string) {
    return this.prisma.variant.findUnique({
      where: { id },
      include: {
        model: { include: { category: true } },
        prices: { include: { conditionState: true } },
        detailedStates: { include: { detailedState: true } },
      },
    });
  }

  @Post()
  create(@Body(new ZodValidationPipe(variantCreateSchema)) dto: VariantCreate) {
    return this.prisma.variant.create({
      data: { ...dto, specs: dto.specs as Prisma.InputJsonValue | undefined },
    });
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(variantUpdateSchema)) dto: VariantUpdate,
  ) {
    return this.prisma.variant.update({
      where: { id },
      data: { ...dto, specs: dto.specs as Prisma.InputJsonValue | undefined },
    });
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.prisma.variant.delete({ where: { id } });
  }
}
