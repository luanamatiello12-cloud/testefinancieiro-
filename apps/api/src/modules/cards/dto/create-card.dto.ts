import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, Min, MinLength } from "class-validator";

export class CreateCardDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  bank?: string;

  @IsNumber()
  @IsPositive()
  limit!: number;

  @IsInt()
  @Min(1)
  @Max(31)
  closingDay!: number;

  @IsInt()
  @Min(1)
  @Max(31)
  dueDay!: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
