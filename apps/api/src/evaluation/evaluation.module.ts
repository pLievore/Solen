import { Module } from "@nestjs/common";
import { QuoteService } from "./quote.service";
import { QuoteController } from "./quote.controller";
import { EvaluationController } from "./evaluation.controller";

@Module({
  controllers: [QuoteController, EvaluationController],
  providers: [QuoteService],
  exports: [QuoteService],
})
export class EvaluationModule {}
