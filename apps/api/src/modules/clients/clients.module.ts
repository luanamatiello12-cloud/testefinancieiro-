import { Module } from "@nestjs/common";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { ClientsRepository } from "./clients.repository";
import { TransactionsModule } from "../transactions/transactions.module";
import { TagsModule } from "../tags/tags.module";

@Module({
  imports: [TransactionsModule, TagsModule],
  controllers: [ClientsController],
  providers: [ClientsService, ClientsRepository],
  exports: [ClientsService],
})
export class ClientsModule {}
