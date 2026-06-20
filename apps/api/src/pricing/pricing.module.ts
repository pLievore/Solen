import { Module } from "@nestjs/common";
import { PricesController } from "./prices.controller";
import { ConditionStatesController } from "./condition-states.controller";
import {
  DetailedStatesController,
  VariantDetailedStatesController,
} from "./detailed-states.controller";
import { KnockoutController } from "./knockout.controller";
import { SettingsController } from "./settings.controller";
import { ModelDetailedStatesController } from "./model-detailed-states.controller";
import { PublicSettingsController } from "./public-settings.controller";

@Module({
  controllers: [
    PricesController,
    ConditionStatesController,
    DetailedStatesController,
    VariantDetailedStatesController,
    KnockoutController,
    SettingsController,
    ModelDetailedStatesController,
    PublicSettingsController,
  ],
})
export class PricingModule {}
