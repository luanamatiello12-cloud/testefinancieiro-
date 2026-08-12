import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, MinLength } from "class-validator";

export class CreateGoalDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsNumber()
  @IsPositive()
  targetValue!: number;

  @IsOptional()
  @IsNumber()
  currentValue?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
