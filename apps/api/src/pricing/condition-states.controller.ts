import { Controller, Get, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";

/** Os 4 estados base (fixos). Read-only — alimenta o editor de precos. */
@Controller("admin/condition-states")
@UseGuards(SupabaseAuthGuard)
export class ConditionStatesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.conditionState.findMany({ orderBy: { order: "asc" } });
  }
}
