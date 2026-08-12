import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@sistema-financeiro/database";
import { randomUUID } from "crypto";
import { CardsRepository } from "./cards.repository";
import { CreateCardDto } from "./dto/create-card.dto";
import { UpdateCardDto } from "./dto/update-card.dto";
import { CreateCardPurchaseDto } from "./dto/create-card-purchase.dto";
import { monthKey, utcToday } from "../../common/date-utils";

function currentMonthKey() {
  return monthKey(utcToday());
}

function addMonths(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return monthKey(date);
}

function invoiceMonthFor(date: Date, closingDay: number) {
  const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  return date.getUTCDate() > closingDay ? addMonths(key, 1) : key;
}

@Injectable()
export class CardsService {
  constructor(private readonly repository: CardsRepository) {}

  findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const card = await this.repository.findById(id);
    if (!card) throw new NotFoundException("Cartão não encontrado");
    return card;
  }

  create(data: CreateCardDto) {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateCardDto) {
    await this.findById(id);
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.softDelete(id);
  }

  async availableLimit(id: string) {
    const card = await this.findById(id);
    const spent = await this.repository.sumSpentSince(id, currentMonthKey());
    const used = spent._sum.value ?? 0;
    return { limit: card.limit, used, available: Math.max(0, card.limit - used) };
  }

  async addPurchase(cardId: string, dto: CreateCardPurchaseDto) {
    const card = await this.findById(cardId);
    const purchaseDate = new Date(dto.date);
    const baseInvoiceMonth = invoiceMonthFor(purchaseDate, card.closingDay);
    const installmentTotal = dto.installmentTotal && dto.installmentTotal > 1 ? dto.installmentTotal : 1;
    const installmentValue = Math.round((dto.value / installmentTotal) * 100) / 100;
    const installmentGroupId = installmentTotal > 1 ? randomUUID() : undefined;

    const purchases: Prisma.CardPurchaseCreateManyInput[] = Array.from(
      { length: installmentTotal },
      (_, i) => ({
        cardId,
        value: installmentValue,
        categoryId: dto.categoryId,
        establishment:
          installmentTotal > 1 ? `${dto.establishment} (${i + 1}/${installmentTotal})` : dto.establishment,
        note: dto.note,
        date: purchaseDate,
        invoiceMonth: addMonths(baseInvoiceMonth, i),
        installmentGroupId,
        installmentNumber: installmentTotal > 1 ? i + 1 : undefined,
        installmentTotal: installmentTotal > 1 ? installmentTotal : undefined,
      }),
    );

    await this.repository.createPurchases(purchases);
    return this.repository.purchasesByInvoiceMonth(cardId, baseInvoiceMonth);
  }

  async removePurchase(purchaseId: string) {
    const purchase = await this.repository.findPurchaseById(purchaseId);
    if (!purchase) throw new NotFoundException("Compra não encontrada");
    return this.repository.softDeletePurchase(purchaseId);
  }

  async invoice(cardId: string, month?: string) {
    await this.findById(cardId);
    const targetMonth = month ?? currentMonthKey();

    const purchases = await this.repository.purchasesByInvoiceMonth(cardId, targetMonth);
    const futureInstallments = await this.repository.futurePurchases(cardId, targetMonth);
    const invoice = await this.repository.findInvoice(cardId, targetMonth);

    const total = round(purchases.reduce((sum, p) => sum + p.value, 0));
    const paid = invoice?.paid ?? false;

    return {
      month: targetMonth,
      total,
      paid: paid ? total : 0,
      open: paid ? 0 : total,
      purchases,
      futureInstallments,
    };
  }

  async setInvoicePaid(cardId: string, month: string, paid: boolean) {
    await this.findById(cardId);
    return this.repository.upsertInvoicePaid(cardId, month, paid);
  }
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
