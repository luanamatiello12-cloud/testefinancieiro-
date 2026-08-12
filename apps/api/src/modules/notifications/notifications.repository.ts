import { Injectable } from "@nestjs/common";
import { NotificationType, Prisma } from "@sistema-financeiro/database";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  unpaidTransactionsWithDueDate() {
    return this.prisma.transaction.findMany({
      where: { deletedAt: null, isPaid: false, dueDate: { not: null } },
    });
  }

  accounts() {
    return this.prisma.account.findMany({ where: { deletedAt: null } });
  }

  cards() {
    return this.prisma.creditCard.findMany({ where: { deletedAt: null } });
  }

  cardSpendSince(cardId: string, sinceMonth: string) {
    return this.prisma.cardPurchase.aggregate({
      where: { cardId, deletedAt: null, invoiceMonth: { gte: sinceMonth } },
      _sum: { value: true },
    });
  }

  goals() {
    return this.prisma.goal.findMany({ where: { deletedAt: null } });
  }

  findAllRaw() {
    return this.prisma.notification.findMany();
  }

  deleteByIds(ids: string[]) {
    if (ids.length === 0) return Promise.resolve({ count: 0 });
    return this.prisma.notification.deleteMany({ where: { id: { in: ids } } });
  }

  createMany(data: Prisma.NotificationCreateManyInput[]) {
    if (data.length === 0) return Promise.resolve({ count: 0 });
    return this.prisma.notification.createMany({ data });
  }

  findAll() {
    return this.prisma.notification.findMany({
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take: 50,
    });
  }

  markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  markAllRead() {
    return this.prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
  }

  countUnread() {
    return this.prisma.notification.count({ where: { isRead: false } });
  }
}
