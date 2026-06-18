import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { variantPricesSchema, type VariantPrices } from "@solen/shared";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

/** Precos base por Versao x Estado (os 4 estados sao fixos; so o preco muda). */
@Controller("admin/variants")
@UseGuards(SupabaseAuthGuard)
export class PricesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(":id/prices")
  list(@Param("id") id: string) {
    return this.prisma.variantPrice.findMany({
      where: { variantId: id },
      include: { conditionState: true },
      orderBy: { conditionState: { order: "asc" } },
    });
  }

  @Put(":id/prices")
  async set(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(variantPricesSchema)) dto: VariantPrices,
  ) {
    await this.prisma.$transaction(
      dto.prices.map((p) =>
        this.prisma.variantPrice.upsert({
          where: {
            variantId_conditionStateId: {
              variantId: id,
              conditionStateId: p.conditionStateId,
            },
          },
          update: { price: p.price },
          create: {
            variantId: id,
            conditionStateId: p.conditionStateId,
            price: p.price,
          },
        }),
      ),
    );
    return this.list(id);
  }
}
