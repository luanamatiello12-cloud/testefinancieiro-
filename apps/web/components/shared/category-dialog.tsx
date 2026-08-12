"use client";

import * as React from "react";
import { mutate } from "swr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { Category, TransactionType } from "@/lib/api/types";
import { ICON_OPTIONS, getIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  defaultType?: TransactionType;
}

const COLOR_OPTIONS = [
  "#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#0ea5e9", "#a855f7", "#ec4899", "#14b8a6",
];

export function CategoryDialog({ open, onOpenChange, category, defaultType }: Props) {
  const [form, setForm] = React.useState({
    name: category?.name ?? "",
    type: category?.type ?? defaultType ?? ("EXPENSE" as TransactionType),
    color: category?.color ?? COLOR_OPTIONS[0],
    icon: category?.icon ?? "tag",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm({
        name: category?.name ?? "",
        type: category?.type ?? defaultType ?? "EXPENSE",
        color: category?.color ?? COLOR_OPTIONS[0],
        icon: category?.icon ?? "tag",
      });
      setError(null);
    }
  }, [open, category, defaultType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      setError("Informe um nome para a categoria.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (category) {
        await api.patch(`/categories/${category.id}`, form);
      } else {
        await api.post("/categories", form);
      }
      await mutate((k) => typeof k === "string" && k.startsWith("/categories"));
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar categoria");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "INCOME" }))}
              className={cn(
                "rounded-lg border py-2 text-sm font-medium transition-colors",
                form.type === "INCOME" ? "border-success bg-success/10 text-success" : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "EXPENSE" }))}
              className={cn(
                "rounded-lg border py-2 text-sm font-medium transition-colors",
                form.type === "EXPENSE" ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              Despesa
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Mercado, Salário..." />
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

          <div className="space-y-1.5">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((icon) => {
                const Icon = getIcon(icon);
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon }))}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                      form.icon === icon ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Salvando..." : category ? "Salvar alterações" : "Criar categoria"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
