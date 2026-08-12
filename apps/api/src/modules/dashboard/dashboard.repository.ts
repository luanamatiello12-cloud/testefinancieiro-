import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  accounts() {
    return this.prisma.account.findMany({ where: { deletedAt: null } });
  }

  paidTransactionsInRange(from: Date, to: Date) {
    return this.prisma.transaction.findMany({
      where: { deletedAt: null, isPaid: true, date: { gte: from, lte: to } },
      include: { category: true },
    });
  }

  upcoming(today: Date) {
    return this.prisma.transaction.findMany({
      where: { deletedAt: null, isPaid: false, dueDate: { not: null } },
      include: { account: true, category: true, attachments: true },
      orderBy: { dueDate: "asc" },
    });
  }

  recent(limit: number) {
    return this.prisma.transaction.findMany({
      where: { deletedAt: null },
      include: { account: true, category: true, attachments: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  }

  transactionsSince(from: Date) {
    return this.prisma.transaction.findMany({
      where: { deletedAt: null, isPaid: true, date: { gte: from } },
      include: { category: true },
    });
  }

  search(query: string) {
    return this.prisma.transaction.findMany({
      where: {
        deletedAt: null,
        OR: [
          { description: { contains: query } },
          { note: { contains: query } },
          { category: { name: { contains: query } } },
          { account: { name: { contains: query } } },
        ],
      },
      include: { account: true, category: true },
      orderBy: { date: "desc" },
      take: 30,
    });
  }
}
