import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { QuoteRequest, QuoteResponse } from "@solen/shared";
import { PrismaService } from "../prisma/prisma.service";
import { computeQuote, type BreakdownItem } from "./pricing.engine";

@Injectable()
export class QuoteService {
  constructor(private readonly prisma: PrismaService) {}

  private async scrapDefault(): Promise<number> {
    const s = await this.prisma.setting.findUnique({
      where: { key: "scrap.defaultValue" },
    });
    return typeof s?.value === "number" ? s.value : 0;
  }

  async quote(input: QuoteRequest): Promise<QuoteResponse> {
    const variant = await this.prisma.variant.findUnique({
      where: { id: input.variantId },
    });
    if (!variant) throw new NotFoundException("Versao nao encontrada");

    // 1. Knockout tem prioridade absoluta
    const knockouts = await this.prisma.knockoutQuestion.findMany({
      where: { active: true },
    });
    const triggered = input.knockoutAnswers.some((a) => {
      const q = knockouts.find((k) => k.id === a.questionId);
      return q != null && q.triggerAnswer === a.answer;
    });
    if (triggered) {
      const scrapValue = variant.scrapPrice ?? (await this.scrapDefault());
      return computeQuote({ isScrap: true, scrapValue });
    }

    // 2. Preco base (Versao x Estado)
    if (!input.conditionStateId) {
      throw new BadRequestException("Selecione o estado do aparelho.");
    }
    const vp = await this.prisma.variantPrice.findUnique({
      where: {
        variantId_conditionStateId: {
          variantId: input.variantId,
          conditionStateId: input.conditionStateId,
        },
      },
      include: { conditionState: true },
    });
    if (!vp) {
      throw new BadRequestException("Preco nao cadastrado para este estado.");
    }

    // 3. Deltas dos estados detalhados atribuidos a esta versao
    const assigned = await this.prisma.variantDetailedState.findMany({
      where: { variantId: input.variantId },
      include: { detailedState: true },
    });
    const deltas: BreakdownItem[] = [];
    for (const a of input.detailedAnswers) {
      const vds = assigned.find((x) => x.detailedStateId === a.questionId);
      if (!vds) continue; // pergunta nao atribuida e ignorada
      const yes = vds.yesDeltaOverride ?? vds.detailedState.yesDelta;
      const no = vds.noDeltaOverride ?? vds.detailedState.noDelta;
      const amount = a.answer === "YES" ? yes : no;
      if (amount !== 0) {
        deltas.push({
          type: "delta",
          label: vds.detailedState.question,
          amount,
        });
      }
    }

    return computeQuote({
      isScrap: false,
      base: { label: vp.conditionState.label, amount: vp.price },
      deltas,
    });
  }
}
