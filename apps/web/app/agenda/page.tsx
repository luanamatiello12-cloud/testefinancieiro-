"use client";

import * as React from "react";
import useSWR from "swr";
import { ChevronLeft, ChevronRight, CreditCard, TrendingDown, TrendingUp } from "lucide-react";
import { fetcher } from "@/lib/api/client";
import { AgendaData, AgendaEvent, AgendaEventType } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, todayLocalISODate } from "@/lib/utils";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const EVENT_META: Record<AgendaEventType, { label: string; color: string; icon: typeof TrendingDown }> = {
  expense_due: { label: "Despesa", color: "hsl(var(--destructive))", icon: TrendingDown },
  income_expected: { label: "Receita", color: "hsl(var(--success))", icon: TrendingUp },
  card_due: { label: "Fatura", color: "hsl(var(--primary))", icon: CreditCard },
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export default function AgendaPage() {
  const [cursor, setCursor] = React.useState(() => new Date(todayLocalISODate()));
  const [selectedDay, setSelectedDay] = React.useState(todayLocalISODate());

  const key = monthKey(cursor);
  const { data } = useSWR<AgendaData>(`/agenda?month=${key}`, fetcher);

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const e of data?.events ?? []) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [data]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstDay.getDay();

  const cells: (string | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`),
  ];

  const selectedEvents = eventsByDay.get(selectedDay) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agenda Financeira</h1>
        <p className="text-sm text-muted-foreground">Contas a vencer, recebimentos e faturas de cartão</p>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium capitalize">
          {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(cursor)}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1.5">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={`blank-${i}`} />;
              const events = eventsByDay.get(dateStr) ?? [];
              const isToday = dateStr === todayLocalISODate();
              const isSelected = dateStr === selectedDay;
              const dayNum = Number(dateStr.slice(8, 10));

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDay(dateStr)}
                  className={cn(
                    "flex h-16 flex-col items-start gap-1 rounded-lg border p-1.5 text-left transition-colors sm:h-20",
                    isSelected ? "border-primary bg-primary/5" : "border-transparent hover:bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      isToday ? "bg-primary text-primary-foreground font-semibold" : "text-foreground",
                    )}
                  >
                    {dayNum}
                  </span>
                  <div className="flex flex-wrap gap-0.5">
                    {events.slice(0, 3).map((e, idx) => (
                      <span
                        key={idx}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: EVENT_META[e.type].color }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1 p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(
              new Date(selectedDay),
            )}
          </h2>
          {selectedEvents.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhum evento neste dia</p>
          )}
          {selectedEvents.map((e, idx) => {
            const meta = EVENT_META[e.type];
            const Icon = meta.icon;
            return (
              <div key={idx} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-secondary">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{meta.label}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(e.value)}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
