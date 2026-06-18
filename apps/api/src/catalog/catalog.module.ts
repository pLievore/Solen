import { Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller";
import { ModelsController } from "./models.controller";
import { VariantsController } from "./variants.controller";
import { PublicCatalogController } from "./public-catalog.controller";

@Module({
  controllers: [
    CategoriesController,
    ModelsController,
    VariantsController,
    PublicCatalogController,
  ],
})
export class CatalogModule {}
