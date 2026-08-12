"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: { name: string; color: string; value: number }[];
}

export function CategoryPieChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Sem despesas neste mês ainda
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={220} className="sm:w-1/2">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 13,
            }}
            formatter={(value: number) => formatCurrency(value)}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="w-full space-y-2 sm:w-1/2">
        {data.slice(0, 6).map((c) => (
          <div key={c.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="truncate text-muted-foreground">{c.name}</span>
            </div>
            <span className="shrink-0 font-medium">{formatCurrency(c.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
