import { Module } from "@nestjs/common";
import { DashboardController, SearchController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DashboardRepository } from "./dashboard.repository";

@Module({
  controllers: [DashboardController, SearchController],
  providers: [DashboardService, DashboardRepository],
})
export class DashboardModule {}
