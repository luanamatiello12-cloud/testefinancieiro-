import { Controller, Get, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get("summary")
  summary() {
    return this.service.summary();
  }

  @Get("upcoming")
  upcoming() {
    return this.service.upcoming();
  }

  @Get("recent")
  recent() {
    return this.service.recent();
  }

  @Get("charts")
  charts() {
    return this.service.charts();
  }
}

@Controller("search")
export class SearchController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  search(@Query("q") q: string) {
    return this.service.search(q);
  }
}
