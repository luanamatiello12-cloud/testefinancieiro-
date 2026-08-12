"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { Plus, Pencil, Trash2, Target } from "lucide-react";
import { fetcher, api } from "@/lib/api/client";
import { Goal } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoalDialog } from "@/components/shared/goal-dialog";
import { getIcon } from "@/lib/icon-map";
import { cn, formatCurrency } from "@/lib/utils";

function daysUntil(deadline: string | null) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function GoalCard({ goal, onEdit }: { goal: Goal; onEdit: () => void }) {
  const [amount, setAmount] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const Icon = getIcon(goal.icon);
  const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  const days = daysUntil(goal.deadline);

  async function contribute() {
    if (!amount) return;
    setSubmitting(true);
    try {
      await api.patch(`/goals/${goal.id}/contribute`, { amount: Number(amount) });
      await mutate("/goals");
      setAmount("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir a meta "${goal.name}"?`)) return;
    await api.delete(`/goals/${goal.id}`);
    await mutate("/goals");
  }

  return (
    <Card className="group relative">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${goal.color}22`, color: goal.color }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{goal.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {days !== null ? (days >= 0 ? `${days} dias restantes` : "Prazo vencido") : "Sem prazo definido"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-semibold tabular-nums">{formatCurrency(goal.currentValue)}</span>
            <span className="text-muted-foreground">de {formatCurrency(goal.targetValue)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{pct}% concluído</p>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            step="0.01"
            placeholder="Adicionar valor"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9"
          />
          <Button size="sm" onClick={contribute} disabled={submitting || !amount}>
            Adicionar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MetasPage() {
  const { data: goals } = useSWR<Goal[]>("/goals", fetcher);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Goal | undefined>(undefined);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(goal: Goal) {
    setEditing(goal);
    setDialogOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Metas</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus objetivos financeiros</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nova meta</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals?.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onEdit={() => openEdit(goal)} />
        ))}
        {goals?.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
            Nenhuma meta cadastrada ainda
          </div>
        )}
      </div>

      <GoalDialog open={dialogOpen} onOpenChange={setDialogOpen} goal={editing} />
    </div>
  );
}
