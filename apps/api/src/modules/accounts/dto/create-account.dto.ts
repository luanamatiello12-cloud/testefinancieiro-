import { IsEnum, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import { AccountType } from "@sistema-financeiro/database";

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(AccountType)
  type!: AccountType;

  @IsOptional()
  @IsString()
  bank?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  initialBalance?: number;
}
