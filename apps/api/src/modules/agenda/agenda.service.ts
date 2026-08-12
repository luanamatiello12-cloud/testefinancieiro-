import { Injectable } from "@nestjs/common";
import { AgendaRepository } from "./agenda.repository";
import { monthKey, utcMonthRange, utcToday } from "../../common/date-utils";

export interface AgendaEvent {
  date: string;
  type: "expense_due" | "income_expected" | "card_due";
  title: string;
  value: number;
  entityId: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

@Injectable()
export class AgendaService {
  constructor(private readonly repository: AgendaRepository) {}

  async getMonth(monthStr?: string) {
    const [year, month] = (monthStr ?? monthKey(utcToday())).split("-").map(Number);
    const { start: from, end: to } = utcMonthRange(year, month - 1);

    const transactions = await this.repository.transactionsDueInRange(from, to);
    const events: AgendaEvent[] = transactions.map((t) => ({
      date: t.dueDate!.toISOString().slice(0, 10),
      type: t.type === "EXPENSE" ? "expense_due" : "income_expected",
      title: t.description,
      value: t.value,
      entityId: t.id,
    }));

    const invoiceMonth = `${year}-${pad(month)}`;
    const purchases = await this.repository.cardPurchasesForInvoiceMonth(invoiceMonth);
    const byCard = new Map<string, { name: string; dueDay: number; total: number }>();
    for (const p of purchases) {
      const existing = byCard.get(p.cardId) ?? { name: p.card.name, dueDay: p.card.dueDay, total: 0 };
      existing.total += p.value;
      byCard.set(p.cardId, existing);
    }

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (const [cardId, info] of byCard) {
      const day = Math.min(info.dueDay, daysInMonth);
      events.push({
        date: `${year}-${pad(month)}-${pad(day)}`,
        type: "card_due",
        title: `Fatura ${info.name}`,
        value: Math.round(info.total * 100) / 100,
        entityId: cardId,
      });
    }

    events.sort((a, b) => a.date.localeCompare(b.date));
    return { month: `${year}-${pad(month)}`, events };
  }
}
