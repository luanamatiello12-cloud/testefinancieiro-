"use client";

import * as React from "react";
import useSWR from "swr";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { fetcher } from "@/lib/api/client";
import { CashFlowData, CashFlowGranularity } from "@/lib/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { StatCard } from "@/components/shared/stat-card";
import { TransactionRow } from "@/components/shared/transaction-row";
import { cn, todayLocalISODate } from "@/lib/utils";

const GRANULARITY_OPTIONS: { value: CashFlowGranularity; label: string }[] = [
  { value: "day", label: "Diário" },
  { value: "week", label: "Semanal" },
  { value: "month", label: "Mensal" },
  { value: "year", label: "Anual" },
];

function shiftReference(date: Date, granularity: CashFlowGranularity, direction: 1 | -1) {
  const d = new Date(date);
  if (granularity === "day" || granularity === "week") {
    d.setMonth(d.getMonth() + direction);
  } else if (granularity === "month") {
    d.setFullYear(d.getFullYear() + direction);
  } else {
    d.setFullYear(d.getFullYear() + direction * 5);
  }
  return d;
}

function periodLabel(granularity: CashFlowGranularity, date: Date) {
  if (granularity === "day" || granularity === "week" || granularity === "month") {
    const fmt = granularity === "month" ? { year: "numeric" as const } : { month: "long" as const, year: "numeric" as const };
    return new Intl.DateTimeFormat("pt-BR", fmt).format(date);
  }
  return `${date.getFullYear() - 4} – ${date.getFullYear()}`;
}

export default function FluxoCaixaPage() {
  const [granularity, setGranularity] = React.useState<CashFlowGranularity>("month");
  const [referenceDate, setReferenceDate] = React.useState(() => new Date(todayLocalISODate()));

  const refStr = referenceDate.toISOString().slice(0, 10);
  const { data } = useSWR<CashFlowData>(
    `/cash-flow?granularity=${granularity}&referenceDate=${refStr}`,
    fetcher,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fluxo de Caixa</h1>
        <p className="text-sm text-muted-foreground">Entradas e saídas realizadas ao longo do tempo</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {GRANULARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGranularity(opt.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                granularity === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setReferenceDate((d) => shiftReference(d, granularity, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-36 text-center text-sm font-medium capitalize">
            {periodLabel(granularity, referenceDate)}
          </span>
          <Button variant="outline" size="icon" onClick={() => setReferenceDate((d) => shiftReference(d, granularity, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Receitas no período" value={data?.totalReceitas ?? 0} icon={TrendingUp} tone="success" />
        <StatCard label="Despesas no período" value={data?.totalDespesas ?? 0} icon={TrendingDown} tone="destructive" />
        <StatCard
          label="Saldo do período"
          value={data?.saldoPeriodo ?? 0}
          icon={Wallet}
          tone={(data?.saldoPeriodo ?? 0) >= 0 ? "success" : "destructive"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimentação por período</CardTitle>
        </CardHeader>
        <CardContent>
          {data ? <CashFlowChart data={data.series} /> : <div className="h-72 animate-pulse rounded-lg bg-secondary" />}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-0.5 p-3">
          <h2 className="px-2 pb-2 pt-1 text-sm font-medium text-muted-foreground">Lançamentos do período</h2>
          {!data && <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>}
          {data?.transactions.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">Nenhum lançamento pago neste período</div>
          )}
          {data?.transactions
            .slice()
            .reverse()
            .map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
