import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("config")
export class PublicSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get() {
    const headline = await this.prisma.setting.findUnique({
      where: { key: "home.headline" },
      select: { value: true },
    });

    return {
      homeHeadline:
        typeof headline?.value === "string"
          ? headline.value
          : "Venda seus usados na hora",
    };
  }
}
