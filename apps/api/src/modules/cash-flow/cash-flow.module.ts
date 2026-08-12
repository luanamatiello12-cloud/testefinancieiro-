import { Module } from "@nestjs/common";
import { CashFlowController } from "./cash-flow.controller";
import { CashFlowService } from "./cash-flow.service";
import { CashFlowRepository } from "./cash-flow.repository";

@Module({
  controllers: [CashFlowController],
  providers: [CashFlowService, CashFlowRepository],
})
export class CashFlowModule {}
