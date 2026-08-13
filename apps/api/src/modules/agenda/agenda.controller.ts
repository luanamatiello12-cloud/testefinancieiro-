import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { AgendaService } from "./agenda.service";
import { CreateAgendaEventDto } from "./dto/create-agenda-event.dto";

@Controller("agenda")
export class AgendaController {
  constructor(private readonly service: AgendaService) {}

  @Get()
  getMonth(@Query("month") month?: string) {
    return this.service.getMonth(month);
  }

  @Post("events")
  createEvent(@Body() dto: CreateAgendaEventDto) {
    return this.service.createEvent(dto);
  }

  @Delete("events/:id")
  deleteEvent(@Param("id") id: string) {
    return this.service.deleteEvent(id);
  }
}
