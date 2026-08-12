import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";

@Injectable()
export class AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.account.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  }

  findById(id: string) {
    return this.prisma.account.findFirst({ where: { id, deletedAt: null } });
  }

  create(data: CreateAccountDto) {
    const initialBalance = data.initialBalance ?? 0;
    return this.prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        bank: data.bank,
        color: data.color,
        icon: data.icon,
        initialBalance,
        currentBalance: initialBalance,
      },
    });
  }

  update(id: string, data: UpdateAccountDto) {
    return this.prisma.account.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.account.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  adjustBalance(id: string, delta: number) {
    return this.prisma.account.update({
      where: { id },
      data: { currentBalance: { increment: delta } },
    });
  }
}
