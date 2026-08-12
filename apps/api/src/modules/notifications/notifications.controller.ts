import { Controller, Get, Param, Patch } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string) {
    return this.service.markRead(id);
  }

  @Patch("read-all")
  markAllRead() {
    return this.service.markAllRead();
  }
}
