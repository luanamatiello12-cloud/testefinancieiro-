import { Module } from "@nestjs/common";
import { AssistantController } from "./assistant.controller";
import { AssistantService } from "./assistant.service";
import { ChatMessageRepository } from "./chat-message.repository";
import { GeminiClient } from "./gemini.client";
import { SettingsModule } from "../settings/settings.module";
import { AccountsModule } from "../accounts/accounts.module";
import { CategoriesModule } from "../categories/categories.module";
import { TransactionsModule } from "../transactions/transactions.module";

@Module({
  imports: [SettingsModule, AccountsModule, CategoriesModule, TransactionsModule],
  controllers: [AssistantController],
  providers: [AssistantService, ChatMessageRepository, GeminiClient],
})
export class AssistantModule {}
