import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
  ValidateIf,
} from "class-validator";
import { ServiceType } from "@sistema-financeiro/database";

export class CreateClientJobDto {
  @IsEnum(ServiceType)
  type!: ServiceType;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsDateString()
  serviceDate!: string;

  @IsNumber()
  @IsPositive()
  value!: number;

  @IsString()
  accountId!: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsBoolean()
  isOutsourced?: boolean;

  @ValidateIf((o) => o.isOutsourced)
  @IsString()
  @MinLength(1)
  outsourcedTo?: string;

  @ValidateIf((o) => o.isOutsourced)
  @IsNumber()
  @IsPositive()
  outsourcedValue?: number;

  @ValidateIf((o) => o.isOutsourced)
  @IsString()
  outsourcedAccountId?: string;

  @ValidateIf((o) => o.isOutsourced)
  @IsDateString()
  outsourcedDueDate?: string;

  @IsOptional()
  @IsBoolean()
  outsourcedIsPaid?: boolean;
}
