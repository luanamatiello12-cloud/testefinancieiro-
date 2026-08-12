import { Injectable, NotFoundException } from "@nestjs/common";
import { AccountsRepository } from "./accounts.repository";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";

@Injectable()
export class AccountsService {
  constructor(private readonly repository: AccountsRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException("Conta não encontrada");
    return account;
  }

  create(data: CreateAccountDto) {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateAccountDto) {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.softDelete(id);
  }
}
