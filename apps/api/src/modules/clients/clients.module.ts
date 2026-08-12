import { Module } from "@nestjs/common";
import { ClientsController } from "./clients.controller";
import { ClientsService } from "./clients.service";
import { ClientsRepository } from "./clients.repository";
import { TransactionsModule } from "../transactions/transactions.module";

@Module({
  imports: [TransactionsModule],
  controllers: [ClientsController],
  providers: [ClientsService, ClientsRepository],
})
export class ClientsModule {}
