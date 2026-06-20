import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    let db = "down";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = "up";
    } catch {
      db = "down";
    }

    const result = {
      status: db === "up" ? "ok" : "degraded",
      service: "vendy-api",
      db,
      timestamp: new Date().toISOString(),
    };
    if (db !== "up") {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }
}
