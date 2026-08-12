import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AgendaRepository {
  constructor(private readonly prisma: PrismaService) {}

  transactionsDueInRange(from: Date, to: Date) {
    return this.prisma.transaction.findMany({
      where: { deletedAt: null, isPaid: false, dueDate: { gte: from, lte: to } },
      include: { account: true, category: true },
      orderBy: { dueDate: "asc" },
    });
  }

  cardPurchasesForInvoiceMonth(invoiceMonth: string) {
    return this.prisma.cardPurchase.findMany({
      where: { invoiceMonth, deletedAt: null },
      include: { card: true },
    });
  }
}
