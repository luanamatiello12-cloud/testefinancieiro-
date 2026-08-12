"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CashFlowBucket } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";

export function CashFlowChart({ data }: { data: CashFlowBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} barGap={4}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          tickFormatter={(v) => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)}
          width={40}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--secondary))" }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 13,
          }}
          formatter={(value: number) => formatCurrency(value)}
        />
        <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
        <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
        <Line
          type="monotone"
          dataKey="saldo"
          name="Saldo acumulado"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
