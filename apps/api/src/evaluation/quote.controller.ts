import { Body, Controller, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { quoteRequestSchema, type QuoteRequest } from "@vendy/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { QuoteService } from "./quote.service";

/** Calculo publico da proposta (sem auth). */
@Controller("quote")
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  quote(
    @Body(new ZodValidationPipe(quoteRequestSchema)) dto: QuoteRequest,
  ) {
    return this.quoteService.quote(dto);
  }
}
