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

  eventsInRange(from: Date, to: Date) {
    return this.prisma.agendaEvent.findMany({
      where: { deletedAt: null, date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });
  }

  createEvent(data: { title: string; date: Date; note?: string }) {
    return this.prisma.agendaEvent.create({ data });
  }

  deleteEvent(id: string) {
    return this.prisma.agendaEvent.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
