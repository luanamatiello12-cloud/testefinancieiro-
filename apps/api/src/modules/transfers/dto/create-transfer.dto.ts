import { IsDateString, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateTransferDto {
  @IsString()
  fromAccountId!: string;

  @IsString()
  toAccountId!: string;

  @IsNumber()
  @IsPositive()
  value!: number;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
