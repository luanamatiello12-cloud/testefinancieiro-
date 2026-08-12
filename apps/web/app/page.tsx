"use client";

import useSWR from "swr";
import { Wallet, Landmark, PiggyBank, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { fetcher } from "@/lib/api/client";
import { DashboardSummary, DashboardUpcoming, DashboardCharts, Transaction } from "@/lib/api/types";
import { StatCard } from "@/components/shared/stat-card";
import { TransactionRow } from "@/components/shared/transaction-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";

export default function DashboardPage() {
  const { data: summary } = useSWR<DashboardSummary>("/dashboard/summary", fetcher);
  const { data: upcoming } = useSWR<DashboardUpcoming>("/dashboard/upcoming", fetcher);
  const { data: recent } = useSWR<Transaction[]>("/dashboard/recent", fetcher);
  const { data: charts } = useSWR<DashboardCharts>("/dashboard/charts", fetcher);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral das suas finanças</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saldo Total" value={summary?.saldoTotal ?? 0} icon={Wallet} tone="primary" />
        <StatCard label="Saldo em Contas" value={summary?.saldoContas ?? 0} icon={Landmark} />
        <StatCard label="Saldo em Carteira" value={summary?.saldoCarteira ?? 0} icon={DollarSign} />
        <StatCard label="Saldo Investido" value={summary?.saldoInvestido ?? 0} icon={PiggyBank} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Receitas do mês" value={summary?.totalReceitas ?? 0} icon={TrendingUp} tone="success" />
        <StatCard label="Despesas do mês" value={summary?.totalDespesas ?? 0} icon={TrendingDown} tone="destructive" />
        <StatCard
          label="Lucro do mês"
          value={summary?.lucroMes ?? 0}
          icon={DollarSign}
          tone={((summary?.lucroMes ?? 0) >= 0) ? "success" : "destructive"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Receita x Despesa (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {charts ? <IncomeExpenseChart data={charts.receitaXDespesa} /> : <ChartSkeleton />}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Gastos por categoria (mês atual)</CardTitle>
          </CardHeader>
          <CardContent>
            {charts ? <CategoryPieChart data={charts.gastosPorCategoria} /> : <ChartSkeleton />}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Próximas a vencer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5">
            <ListState items={upcoming?.aVencer} emptyText="Nenhuma conta a vencer" showDueDate />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Contas atrasadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5">
            <ListState items={upcoming?.atrasadas} emptyText="Nenhuma conta atrasada 🎉" showDueDate />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas movimentações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5">
            <ListState items={recent} emptyText="Nenhuma movimentação ainda" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ListState({
  items,
  emptyText,
  showDueDate,
}: {
  items?: Transaction[];
  emptyText: string;
  showDueDate?: boolean;
}) {
  if (!items) {
    return <div className="py-6 text-center text-sm text-muted-foreground">Carregando...</div>;
  }
  if (items.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">{emptyText}</div>;
  }
  return (
    <>
      {items.slice(0, 6).map((t) => (
        <TransactionRow key={t.id} transaction={t} showDueDate={showDueDate} />
      ))}
    </>
  );
}

function ChartSkeleton() {
  return <div className="h-64 animate-pulse rounded-lg bg-secondary" />;
}
