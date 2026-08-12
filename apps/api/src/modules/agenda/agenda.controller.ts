import { Controller, Get, Query } from "@nestjs/common";
import { AgendaService } from "./agenda.service";

@Controller("agenda")
export class AgendaController {
  constructor(private readonly service: AgendaService) {}

  @Get()
  getMonth(@Query("month") month?: string) {
    return this.service.getMonth(month);
  }
}
