import { Controller, Get, Query } from "@nestjs/common";
import { CashFlowService } from "./cash-flow.service";
import { QueryCashFlowDto } from "./dto/query-cash-flow.dto";

@Controller("cash-flow")
export class CashFlowController {
  constructor(private readonly service: CashFlowService) {}

  @Get()
  get(@Query() query: QueryCashFlowDto) {
    return this.service.get(query.granularity, query.referenceDate);
  }
}
