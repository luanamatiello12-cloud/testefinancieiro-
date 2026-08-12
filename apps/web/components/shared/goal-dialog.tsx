"use client";

import * as React from "react";
import { mutate } from "swr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { Goal } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal;
}

const COLOR_OPTIONS = [
  "#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#0ea5e9", "#a855f7", "#ec4899", "#14b8a6",
];

export function GoalDialog({ open, onOpenChange, goal }: Props) {
  const [form, setForm] = React.useState({
    name: goal?.name ?? "",
    targetValue: goal?.targetValue?.toString() ?? "",
    deadline: goal?.deadline?.slice(0, 10) ?? "",
    color: goal?.color ?? COLOR_OPTIONS[0],
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm({
        name: goal?.name ?? "",
        targetValue: goal?.targetValue?.toString() ?? "",
        deadline: goal?.deadline?.slice(0, 10) ?? "",
        color: goal?.color ?? COLOR_OPTIONS[0],
      });
      setError(null);
    }
  }, [open, goal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.targetValue) {
      setError("Preencha os campos obrigatórios.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        targetValue: Number(form.targetValue),
        deadline: form.deadline || undefined,
        color: form.color,
      };
      if (goal) {
        await api.patch(`/goals/${goal.id}`, payload);
      } else {
        await api.post("/goals", payload);
      }
      await mutate("/goals");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar meta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Nova meta"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Viagem, Reserva de emergência..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="targetValue">Valor alvo *</Label>
              <Input id="targetValue" type="number" step="0.01" min="0" value={form.targetValue} onChange={(e) => setForm((f) => ({ ...f, targetValue: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Prazo</Label>
              <Input id="deadline" type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform",
                    form.color === color ? "scale-110 border-foreground" : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Salvando..." : goal ? "Salvar alterações" : "Criar meta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
