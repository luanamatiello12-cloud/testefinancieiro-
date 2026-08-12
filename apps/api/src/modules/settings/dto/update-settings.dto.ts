import { IsOptional, IsString } from "class-validator";

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  geminiApiKey?: string;

  @IsOptional()
  @IsString()
  geminiModel?: string;
}
