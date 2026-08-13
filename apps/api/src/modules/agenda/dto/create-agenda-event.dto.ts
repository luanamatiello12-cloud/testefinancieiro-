import { IsISO8601, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAgendaEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsISO8601()
  date!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
