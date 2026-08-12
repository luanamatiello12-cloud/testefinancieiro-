import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TransfersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.transfer.findMany({
      include: { fromAccount: true, toAccount: true },
      orderBy: { date: "desc" },
    });
  }

  findById(id: string) {
    return this.prisma.transfer.findUnique({
      where: { id },
      include: { fromAccount: true, toAccount: true },
    });
  }

  async createWithBalanceUpdate(data: {
    fromAccountId: string;
    toAccountId: string;
    value: number;
    date: Date;
    note?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: data.fromAccountId },
        data: { currentBalance: { decrement: data.value } },
      });
      await tx.account.update({
        where: { id: data.toAccountId },
        data: { currentBalance: { increment: data.value } },
      });
      return tx.transfer.create({
        data,
        include: { fromAccount: true, toAccount: true },
      });
    });
  }

  async removeWithBalanceRevert(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUniqueOrThrow({ where: { id } });
      await tx.account.update({
        where: { id: transfer.fromAccountId },
        data: { currentBalance: { increment: transfer.value } },
      });
      await tx.account.update({
        where: { id: transfer.toAccountId },
        data: { currentBalance: { decrement: transfer.value } },
      });
      return tx.transfer.delete({ where: { id } });
    });
  }
}
