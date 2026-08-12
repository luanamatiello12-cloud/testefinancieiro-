import { Injectable } from "@nestjs/common";
import { Prisma } from "@sistema-financeiro/database";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCardDto } from "./dto/create-card.dto";
import { UpdateCardDto } from "./dto/update-card.dto";

@Injectable()
export class CardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.creditCard.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  }

  findById(id: string) {
    return this.prisma.creditCard.findFirst({ where: { id, deletedAt: null } });
  }

  create(data: CreateCardDto) {
    return this.prisma.creditCard.create({ data });
  }

  update(id: string, data: UpdateCardDto) {
    return this.prisma.creditCard.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.creditCard.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  createPurchases(data: Prisma.CardPurchaseCreateManyInput[]) {
    return this.prisma.cardPurchase.createMany({ data });
  }

  purchasesByInvoiceMonth(cardId: string, month: string) {
    return this.prisma.cardPurchase.findMany({
      where: { cardId, invoiceMonth: month, deletedAt: null },
      include: { category: true },
      orderBy: { date: "asc" },
    });
  }

  futurePurchases(cardId: string, afterMonth: string) {
    return this.prisma.cardPurchase.findMany({
      where: { cardId, invoiceMonth: { gt: afterMonth }, deletedAt: null },
      include: { category: true },
      orderBy: { invoiceMonth: "asc" },
    });
  }

  softDeletePurchase(id: string) {
    return this.prisma.cardPurchase.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  findPurchaseById(id: string) {
    return this.prisma.cardPurchase.findFirst({ where: { id, deletedAt: null } });
  }

  sumSpentSince(cardId: string, sinceMonth: string) {
    return this.prisma.cardPurchase.aggregate({
      where: { cardId, deletedAt: null, invoiceMonth: { gte: sinceMonth } },
      _sum: { value: true },
    });
  }

  findInvoice(cardId: string, month: string) {
    return this.prisma.cardInvoice.findUnique({ where: { cardId_month: { cardId, month } } });
  }

  upsertInvoicePaid(cardId: string, month: string, paid: boolean) {
    return this.prisma.cardInvoice.upsert({
      where: { cardId_month: { cardId, month } },
      update: { paid, paidAt: paid ? new Date() : null },
      create: { cardId, month, paid, paidAt: paid ? new Date() : null },
    });
  }
}
