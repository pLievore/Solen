import { Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller";
import { ModelsController } from "./models.controller";
import { VariantsController } from "./variants.controller";
import { PublicCatalogController } from "./public-catalog.controller";
import { CatalogImportController } from "./catalog-import.controller";
import { CatalogImportService } from "./catalog-import.service";

@Module({
  controllers: [
    CategoriesController,
    ModelsController,
    VariantsController,
    PublicCatalogController,
    CatalogImportController,
  ],
  providers: [CatalogImportService],
})
export class CatalogModule {}
