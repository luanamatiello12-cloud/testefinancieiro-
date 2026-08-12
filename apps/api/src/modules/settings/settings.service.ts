import { Injectable } from "@nestjs/common";
import { SettingsRepository } from "./settings.repository";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

@Injectable()
export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  async get() {
    const settings = await this.repository.get();
    return this.toPublic(settings);
  }

  async update(dto: UpdateSettingsDto) {
    const settings = await this.repository.update(dto);
    return this.toPublic(settings);
  }

  /** Raw settings including the unmasked API key, for internal use only (e.g. the Assistant module). */
  getRaw() {
    return this.repository.get();
  }

  private toPublic(settings: { geminiApiKey: string | null; geminiModel: string }) {
    return {
      geminiModel: settings.geminiModel,
      hasGeminiKey: Boolean(settings.geminiApiKey),
      geminiKeyPreview: settings.geminiApiKey ? `••••${settings.geminiApiKey.slice(-4)}` : null,
    };
  }
}
