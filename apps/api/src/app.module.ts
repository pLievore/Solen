import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { CatalogModule } from "./catalog/catalog.module";
import { PricingModule } from "./pricing/pricing.module";
import { StorageModule } from "./storage/storage.module";
import { EvaluationModule } from "./evaluation/evaluation.module";
import { ProposalModule } from "./proposals/proposal.module";
import { BlogModule } from "./blog/blog.module";
import { UsersModule } from "./users/users.module";
import { AssistenciaModule } from "./assistencia/assistencia.module";
import { AnalyticsModule } from "./analytics/analytics.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Em dev usamos o .env da raiz do monorepo; em produção as vars vêm da plataforma.
      envFilePath: ["../../.env", ".env"],
    }),
    // Rate limiting global: 60 req/min por IP (endpoints sensíveis têm limites mais restritos)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    HealthModule,
    CatalogModule,
    PricingModule,
    StorageModule,
    EvaluationModule,
    ProposalModule,
    BlogModule,
    UsersModule,
    AssistenciaModule,
    AnalyticsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
