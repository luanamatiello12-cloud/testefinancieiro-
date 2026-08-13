import { Controller, Get, Headers, Param, Patch, UnauthorizedException } from "@nestjs/common";
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

  @Get("check")
  runScheduledCheck(@Headers("authorization") authorization?: string) {
    const secret = process.env.CRON_SECRET;
    if (secret && authorization !== `Bearer ${secret}`) {
      throw new UnauthorizedException();
    }
    return this.service.runScheduledCheck();
  }
}
