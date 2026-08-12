import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { StorageModule } from "./common/storage/storage.module";
import { AccountsModule } from "./modules/accounts/accounts.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { CardsModule } from "./modules/cards/cards.module";
import { TransfersModule } from "./modules/transfers/transfers.module";
import { GoalsModule } from "./modules/goals/goals.module";
import { CashFlowModule } from "./modules/cash-flow/cash-flow.module";
import { AgendaModule } from "./modules/agenda/agenda.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { AssistantModule } from "./modules/assistant/assistant.module";
import { ClientsModule } from "./modules/clients/clients.module";

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    DashboardModule,
    CardsModule,
    TransfersModule,
    GoalsModule,
    CashFlowModule,
    AgendaModule,
    NotificationsModule,
    SettingsModule,
    AssistantModule,
    ClientsModule,
  ],
})
export class AppModule {}
