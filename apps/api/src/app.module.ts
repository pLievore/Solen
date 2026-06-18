import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Em dev usamos o .env da raiz do monorepo; em produção as vars vêm da plataforma.
      envFilePath: ["../../.env", ".env"],
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    AdminModule,
  ],
})
export class AppModule {}
