import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ThrottlerGuard, Throttle } from "@nestjs/throttler";
import { createProposalSchema, type CreateProposal } from "@vendy/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { ProposalService } from "./proposal.service";

/** Criação pública de propostas/leads — com rate limit por IP. */
@Controller("proposals")
@UseGuards(ThrottlerGuard)
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  /** POST /api/proposals — cria lead, gera token e retorna URL do WhatsApp. */
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(
    @Body(new ZodValidationPipe(createProposalSchema)) dto: CreateProposal,
  ) {
    return this.proposalService.create(dto);
  }
}
