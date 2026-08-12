import { Injectable } from "@nestjs/common";
import { Prisma } from "@sistema-financeiro/database";
import { NotificationsRepository } from "./notifications.repository";
import { utcToday, daysBetweenUTC } from "../../common/date-utils";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  private async regenerate() {
    const today = utcToday();
    const live: Prisma.NotificationCreateManyInput[] = [];

    const transactions = await this.repository.unpaidTransactionsWithDueDate();
    for (const t of transactions) {
      const due = new Date(t.dueDate!);
      const diff = daysBetweenUTC(today, due);
      const verb = t.type === "INCOME" ? "recebimento" : "pagamento";

      if (diff < 0) {
        live.push({
          type: "OVERDUE",
          title: `${t.description} está atrasado`,
          message: `${verb === "recebimento" ? "Recebimento" : "Pagamento"} de ${t.description} venceu há ${Math.abs(diff)} dia(s).`,
          relatedEntityType: "Transaction",
          relatedEntityId: t.id,
        });
      } else if (diff <= 3) {
        live.push({
          type: "DUE_SOON",
          title: `${t.description} vence em breve`,
          message: diff === 0 ? `Vence hoje.` : `Vence em ${diff} dia(s).`,
          relatedEntityType: "Transaction",
          relatedEntityId: t.id,
        });
      }
    }

    const accounts = await this.repository.accounts();
    for (const a of accounts) {
      if (a.currentBalance < 0) {
        live.push({
          type: "NEGATIVE_BALANCE",
          title: `Saldo negativo em ${a.name}`,
          message: `A conta ${a.name} está com saldo negativo.`,
          relatedEntityType: "Account",
          relatedEntityId: a.id,
        });
      }
    }

    const cards = await this.repository.cards();
    for (const c of cards) {
      const closingDiff = c.closingDay - today.getUTCDate();
      if (closingDiff >= 0 && closingDiff <= 3) {
        live.push({
          type: "CARD_CLOSING",
          title: `Fatura do ${c.name} fecha em breve`,
          message: closingDiff === 0 ? "Fecha hoje." : `Fecha em ${closingDiff} dia(s).`,
          relatedEntityType: "CreditCard",
          relatedEntityId: c.id,
        });
      }

      const spend = await this.repository.cardSpendSince(c.id, currentMonthKey());
      const used = spend._sum.value ?? 0;
      if (c.limit > 0 && used / c.limit >= 0.8) {
        live.push({
          type: "LIMIT_ALMOST_REACHED",
          title: `Limite do ${c.name} quase no fim`,
          message: `Você já usou ${Math.round((used / c.limit) * 100)}% do limite.`,
          relatedEntityType: "CreditCard",
          relatedEntityId: c.id,
        });
      }
    }

    const goals = await this.repository.goals();
    for (const g of goals) {
      if (g.currentValue >= g.targetValue) {
        live.push({
          type: "GOAL_REACHED",
          title: `Meta "${g.name}" alcançada!`,
          message: `Parabéns, você atingiu o valor alvo de ${g.targetValue}.`,
          relatedEntityType: "Goal",
          relatedEntityId: g.id,
        });
      }
    }

    const key = (type: string, entityId: string | null | undefined) => `${type}:${entityId}`;
    const liveKeys = new Set(live.map((n) => key(n.type, n.relatedEntityId)));

    const existing = await this.repository.findAllRaw();
    const existingKeys = new Set(existing.map((n) => key(n.type, n.relatedEntityId)));

    const staleIds = existing
      .filter((n) => !liveKeys.has(key(n.type, n.relatedEntityId)))
      .map((n) => n.id);
    await this.repository.deleteByIds(staleIds);

    const toCreate = live.filter((n) => !existingKeys.has(key(n.type, n.relatedEntityId)));
    await this.repository.createMany(toCreate);
  }

  async findAll() {
    await this.regenerate();
    const [notifications, unreadCount] = await Promise.all([
      this.repository.findAll(),
      this.repository.countUnread(),
    ]);
    return { notifications, unreadCount };
  }

  markRead(id: string) {
    return this.repository.markRead(id);
  }

  markAllRead() {
    return this.repository.markAllRead();
  }
}
