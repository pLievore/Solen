import { Body, Controller, Param, Patch, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  createProposalSchema,
  updateProposalPickupSchema,
  type CreateProposal,
  type UpdateProposalPickup,
} from "@vendy/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { ProposalService } from "./proposal.service";

/** Criação pública de propostas/leads — com rate limit por IP. */
@Controller("proposals")
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

  /** PATCH /api/proposals/:token/pickup — grava o ponto de coleta escolhido. */
  @Patch(":token/pickup")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  updatePickup(
    @Param("token") token: string,
    @Body(new ZodValidationPipe(updateProposalPickupSchema))
    dto: UpdateProposalPickup,
  ) {
    return this.proposalService.updatePickup(token, dto.pickupPointId);
  }
}
