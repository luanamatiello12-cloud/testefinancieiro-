import { IsDateString, IsInt, IsNumber, IsOptional, IsPositive, IsString, MinLength } from "class-validator";

export class CreateCardPurchaseDto {
  @IsNumber()
  @IsPositive()
  value!: number;

  @IsString()
  categoryId!: string;

  @IsString()
  @MinLength(1)
  establishment!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsInt()
  installmentTotal?: number;
}
