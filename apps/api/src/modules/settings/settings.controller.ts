import { Body, Controller, Get, Patch } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

@Controller("settings")
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @Patch()
  update(@Body() dto: UpdateSettingsDto) {
    return this.service.update(dto);
  }
}
