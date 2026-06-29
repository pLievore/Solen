import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { Ga4Service } from "./ga4.service";

@Module({
  controllers: [AnalyticsController],
  providers: [Ga4Service],
})
export class AnalyticsModule {}
