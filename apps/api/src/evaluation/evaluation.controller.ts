import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Perguntas do fluxo de avaliacao para uma versao (publico).
 * NAO expoe os deltas de preco — o calculo acontece server-side em POST /quote.
 */
@Controller("evaluation")
export class EvaluationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("variants/:id/questions")
  async questions(@Param("id") id: string) {
    const variant = await this.prisma.variant.findUnique({
      where: { id },
      include: { model: { include: { category: true } } },
    });
    if (!variant) throw new NotFoundException("Versao nao encontrada");

    const [knockout, conditionStates, assigned] = await Promise.all([
      this.prisma.knockoutQuestion.findMany({
        where: { active: true },
        orderBy: { order: "asc" },
        select: { id: true, question: true, helpText: true, triggerAnswer: true, order: true },
      }),
      this.prisma.conditionState.findMany({
        orderBy: { order: "asc" },
        select: { id: true, key: true, label: true, order: true },
      }),
      this.prisma.variantDetailedState.findMany({
        where: { variantId: id, detailedState: { active: true } },
        include: {
          detailedState: {
            select: { id: true, question: true, helpText: true, answerType: true, order: true },
          },
        },
      }),
    ]);

    const detailedStates = assigned
      .map((a) => a.detailedState)
      .sort((x, y) => x.order - y.order);

    return {
      variant: {
        id: variant.id,
        name: variant.name,
        model: variant.model.name,
        category: variant.model.category.name,
      },
      knockout,
      conditionStates,
      detailedStates,
    };
  }
}
