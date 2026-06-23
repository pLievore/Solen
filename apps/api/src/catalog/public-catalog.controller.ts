import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Leitura publica do catalogo (sem auth) — alimenta a home e a selecao
 * de aparelho no site (Fase 2). Retorna apenas itens ativos.
 */
@Controller("catalog")
export class PublicCatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("categories")
  categories() {
    return this.prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, iconUrl: true, updatedAt: true },
    });
  }

  @Get("categories/:slug/models")
  async models(@Param("slug") slug: string) {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) throw new NotFoundException("Categoria nao encontrada");
    return this.prisma.deviceModel.findMany({
      where: { categoryId: category.id, active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, imageUrl: true },
    });
  }

  @Get("models/:id/variants")
  variants(@Param("id") id: string) {
    return this.prisma.variant.findMany({
      where: { modelId: id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, storage: true, slug: true, specs: true },
    });
  }
}
