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
  categoryCreateSchema,
  categoryUpdateSchema,
  type CategoryCreate,
  type CategoryUpdate,
} from "@vendy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

@Controller("admin/categories")
@UseGuards(SupabaseAuthGuard)
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.category.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { models: true } } },
    });
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(categoryCreateSchema)) dto: CategoryCreate,
  ) {
    return this.prisma.category.create({ data: dto });
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(categoryUpdateSchema)) dto: CategoryUpdate,
  ) {
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
