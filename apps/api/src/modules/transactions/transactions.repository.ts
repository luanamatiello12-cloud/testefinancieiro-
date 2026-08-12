import { Injectable } from "@nestjs/common";
import { Prisma } from "@sistema-financeiro/database";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(where: Prisma.TransactionWhereInput) {
    return this.prisma.transaction.findMany({
      where,
      include: { account: true, category: true, attachments: true },
      orderBy: { date: "desc" },
    });
  }

  findById(id: string) {
    return this.prisma.transaction.findFirst({
      where: { id, deletedAt: null },
      include: { account: true, category: true, attachments: true },
    });
  }

  create(data: Prisma.TransactionCreateInput) {
    return this.prisma.transaction.create({ data });
  }

  createMany(data: Prisma.TransactionCreateManyInput[]) {
    return this.prisma.transaction.createMany({ data });
  }

  update(id: string, data: Prisma.TransactionUpdateInput) {
    return this.prisma.transaction.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  addAttachment(transactionId: string, data: { url: string; filename: string; mimetype: string }) {
    return this.prisma.attachment.create({ data: { transactionId, ...data } });
  }

  $transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }
}
