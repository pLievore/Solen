import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  knockoutCreateSchema,
  knockoutUpdateSchema,
  type KnockoutCreate,
  type KnockoutUpdate,
} from "@solen/shared";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

/** CRUD das perguntas eliminatorias (knockout -> sucata). */
@Controller("admin/knockout-questions")
@UseGuards(SupabaseAuthGuard)
export class KnockoutController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.knockoutQuestion.findMany({ orderBy: { order: "asc" } });
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(knockoutCreateSchema)) dto: KnockoutCreate,
  ) {
    return this.prisma.knockoutQuestion.create({ data: dto });
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(knockoutUpdateSchema)) dto: KnockoutUpdate,
  ) {
    return this.prisma.knockoutQuestion.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.prisma.knockoutQuestion.delete({ where: { id } });
  }
}
