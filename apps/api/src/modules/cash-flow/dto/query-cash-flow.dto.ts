import { IsDateString, IsIn, IsOptional } from "class-validator";

export type CashFlowGranularity = "day" | "week" | "month" | "year";

export class QueryCashFlowDto {
  @IsIn(["day", "week", "month", "year"])
  granularity!: CashFlowGranularity;

  @IsOptional()
  @IsDateString()
  referenceDate?: string;
}
