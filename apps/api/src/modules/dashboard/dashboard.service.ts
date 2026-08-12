import { Injectable } from "@nestjs/common";
import { DashboardRepository } from "./dashboard.repository";
import { addUTCMonths, monthKey, utcMonthRange, utcToday } from "../../common/date-utils";

const ACCOUNT_GROUP: Record<string, "contas" | "carteira" | "investido"> = {
  CHECKING: "contas",
  SAVINGS: "contas",
  DIGITAL: "contas",
  CASH: "contas",
  WALLET: "carteira",
  INVESTMENT: "investido",
};

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async summary() {
    const accounts = await this.repository.accounts();

    const balances = { total: 0, contas: 0, carteira: 0, investido: 0 };
    for (const account of accounts) {
      balances.total += account.currentBalance;
      const group = ACCOUNT_GROUP[account.type] ?? "contas";
      balances[group] += account.currentBalance;
    }

    const today = utcToday();
    const { start, end } = utcMonthRange(today.getUTCFullYear(), today.getUTCMonth());
    const monthTransactions = await this.repository.paidTransactionsInRange(start, end);

    const totalReceitas = monthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.value, 0);
    const totalDespesas = monthTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.value, 0);

    return {
      saldoTotal: round(balances.total),
      saldoContas: round(balances.contas),
      saldoCarteira: round(balances.carteira),
      saldoInvestido: round(balances.investido),
      totalReceitas: round(totalReceitas),
      totalDespesas: round(totalDespesas),
      lucroMes: round(totalReceitas - totalDespesas),
    };
  }

  async upcoming() {
    const today = utcToday();

    const all = await this.repository.upcoming(today);
    const aVencer = all.filter((t) => t.dueDate! >= today).slice(0, 15);
    const atrasadas = all.filter((t) => t.dueDate! < today);

    return { aVencer, atrasadas };
  }

  recent() {
    return this.repository.recent(15);
  }

  async charts() {
    const today = utcToday();
    const sixMonthsAgo = addUTCMonths(
      new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
      -5,
    );

    const transactions = await this.repository.transactionsSince(sixMonthsAgo);

    const monthlyMap = new Map<string, { receitas: number; despesas: number }>();
    for (let i = 0; i < 6; i++) {
      const d = addUTCMonths(sixMonthsAgo, i);
      monthlyMap.set(monthKey(d), { receitas: 0, despesas: 0 });
    }

    const categoryMap = new Map<string, { name: string; color: string; value: number }>();
    const currentMonthKey = monthKey(today);

    for (const t of transactions) {
      const key = monthKey(t.date);
      const bucket = monthlyMap.get(key);
      if (bucket) {
        if (t.type === "INCOME") bucket.receitas += t.value;
        else bucket.despesas += t.value;
      }

      if (t.type === "EXPENSE" && key === currentMonthKey) {
        const existing = categoryMap.get(t.categoryId) ?? {
          name: t.category.name,
          color: t.category.color,
          value: 0,
        };
        existing.value += t.value;
        categoryMap.set(t.categoryId, existing);
      }
    }

    const receitaXDespesa = Array.from(monthlyMap.entries()).map(([key, v]) => ({
      month: key,
      receitas: round(v.receitas),
      despesas: round(v.despesas),
    }));

    const gastosPorCategoria = Array.from(categoryMap.values())
      .map((c) => ({ ...c, value: round(c.value) }))
      .sort((a, b) => b.value - a.value);

    return { receitaXDespesa, gastosPorCategoria };
  }

  search(query: string) {
    if (!query || query.trim().length === 0) return [];
    return this.repository.search(query.trim());
  }
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
