import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CashFlowRepository {
  constructor(private readonly prisma: PrismaService) {}

  paidTransactionsInRange(from: Date, to: Date) {
    return this.prisma.transaction.findMany({
      where: { deletedAt: null, isPaid: true, date: { gte: from, lte: to } },
      include: { category: true, account: true },
      orderBy: { date: "asc" },
    });
  }
}
