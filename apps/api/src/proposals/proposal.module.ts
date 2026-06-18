import { Module } from "@nestjs/common";
import { ProposalController } from "./proposal.controller";
import { ProposalService } from "./proposal.service";
import { AdminProposalController } from "./admin-proposal.controller";
import { EvaluationModule } from "../evaluation/evaluation.module";

@Module({
  imports: [EvaluationModule],
  controllers: [ProposalController, AdminProposalController],
  providers: [ProposalService],
})
export class ProposalModule {}
