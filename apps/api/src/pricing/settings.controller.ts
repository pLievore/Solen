import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { settingUpdateSchema, type SettingUpdate } from "@solen/shared";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

/** Configuracoes chave/valor (whatsapp, sucata, tema, textos...). */
@Controller("admin/settings")
@UseGuards(SupabaseAuthGuard)
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.setting.findMany({ orderBy: { key: "asc" } });
  }

  @Get(":key")
  get(@Param("key") key: string) {
    return this.prisma.setting.findUnique({ where: { key } });
  }

  @Put(":key")
  set(
    @Param("key") key: string,
    @Body(new ZodValidationPipe(settingUpdateSchema)) dto: SettingUpdate,
  ) {
    const value = dto.value as Prisma.InputJsonValue;
    return this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
