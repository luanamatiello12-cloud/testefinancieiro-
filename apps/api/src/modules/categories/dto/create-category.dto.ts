import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { TransactionType } from "@sistema-financeiro/database";

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
