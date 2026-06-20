import { BadRequestException, Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { CatalogImportService } from "./catalog-import.service";

@Controller("admin/catalog")
@UseGuards(SupabaseAuthGuard)
export class CatalogImportController {
  constructor(private readonly service: CatalogImportService) {}

  /** Baixa o CSV do catalogo atual (template para editar e reimportar). */
  @Get("export")
  async export() {
    const csv = await this.service.export();
    return { csv, filename: "catalogo-vendy.csv" };
  }

  /** Importa o CSV (cria/atualiza modelos, versoes e precos). */
  @Post("import")
  async import(@Body() body: { csv?: string }) {
    if (typeof body?.csv !== "string" || !body.csv.trim()) {
      throw new BadRequestException("Envie o conteudo da planilha no campo 'csv'.");
    }
    return this.service.import(body.csv);
  }
}
