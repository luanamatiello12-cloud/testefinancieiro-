import { Module } from "@nestjs/common";
import { AssistantController } from "./assistant.controller";
import { AssistantService } from "./assistant.service";
import { ChatMessageRepository } from "./chat-message.repository";
import { GeminiClient } from "./gemini.client";
import { SettingsModule } from "../settings/settings.module";
import { AccountsModule } from "../accounts/accounts.module";
import { CategoriesModule } from "../categories/categories.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { AgendaModule } from "../agenda/agenda.module";
import { ClientsModule } from "../clients/clients.module";
import { DashboardModule } from "../dashboard/dashboard.module";

@Module({
  imports: [
    SettingsModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    AgendaModule,
    ClientsModule,
    DashboardModule,
  ],
  controllers: [AssistantController],
  providers: [AssistantService, ChatMessageRepository, GeminiClient],
})
export class AssistantModule {}
