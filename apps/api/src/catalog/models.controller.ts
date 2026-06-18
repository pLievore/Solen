import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  modelCreateSchema,
  modelUpdateSchema,
  type ModelCreate,
  type ModelUpdate,
} from "@solen/shared";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

@Controller("admin/models")
@UseGuards(SupabaseAuthGuard)
export class ModelsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query("categoryId") categoryId?: string) {
    return this.prisma.deviceModel.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: [{ categoryId: "asc" }, { order: "asc" }],
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { variants: true } },
      },
    });
  }

  @Post()
  create(@Body(new ZodValidationPipe(modelCreateSchema)) dto: ModelCreate) {
    return this.prisma.deviceModel.create({ data: dto });
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(modelUpdateSchema)) dto: ModelUpdate,
  ) {
    return this.prisma.deviceModel.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.prisma.deviceModel.delete({ where: { id } });
  }
}
