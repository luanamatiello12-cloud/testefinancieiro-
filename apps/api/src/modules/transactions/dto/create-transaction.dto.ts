import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from "class-validator";
import { RecurrenceFrequency, TransactionType } from "@sistema-financeiro/database";

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive()
  value!: number;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  accountId!: string;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  costCenterId?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(RecurrenceFrequency)
  recurrenceFrequency?: RecurrenceFrequency;

  @IsOptional()
  @IsInt()
  installmentTotal?: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
