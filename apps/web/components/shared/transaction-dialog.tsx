"use client";

import * as React from "react";
import useSWR from "swr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetcher, api } from "@/lib/api/client";
import { revalidateFinancialData } from "@/lib/api/revalidate";
import { Account, Category, Transaction, TransactionType } from "@/lib/api/types";
import { cn, todayLocalISODate } from "@/lib/utils";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  defaultType?: TransactionType;
}

function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function TransactionDialog({ open, onOpenChange, transaction, defaultType }: TransactionDialogProps) {
  const { data: accounts } = useSWR<Account[]>("/accounts", fetcher);
  const [type, setType] = React.useState<TransactionType>(transaction?.type ?? defaultType ?? "EXPENSE");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data: categories } = useSWR<Category[]>(`/categories?type=${type}`, fetcher);

  const [form, setForm] = React.useState({
    value: transaction?.value?.toString() ?? "",
    date: toDateInput(transaction?.date) || todayLocalISODate(),
    dueDate: toDateInput(transaction?.dueDate),
    accountId: transaction?.accountId ?? "",
    categoryId: transaction?.categoryId ?? "",
    description: transaction?.description ?? "",
    note: transaction?.note ?? "",
    installmentTotal: "",
    isRecurring: transaction?.isRecurring ?? false,
    isPaid: transaction?.isPaid ?? false,
  });

  React.useEffect(() => {
    if (open) {
      setType(transaction?.type ?? defaultType ?? "EXPENSE");
      setForm({
        value: transaction?.value?.toString() ?? "",
        date: toDateInput(transaction?.date) || todayLocalISODate(),
        dueDate: toDateInput(transaction?.dueDate),
        accountId: transaction?.accountId ?? "",
        categoryId: transaction?.categoryId ?? "",
        description: transaction?.description ?? "",
        note: transaction?.note ?? "",
        installmentTotal: "",
        isRecurring: transaction?.isRecurring ?? false,
        isPaid: transaction?.isPaid ?? false,
      });
      setError(null);
    }
  }, [open, transaction, defaultType]);

  React.useEffect(() => {
    if (!transaction && accounts && accounts.length > 0 && !form.accountId) {
      setForm((f) => ({ ...f, accountId: accounts[0].id }));
    }
  }, [accounts, transaction, form.accountId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.accountId || !form.categoryId || !form.value || !form.description) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        value: Number(form.value),
        type,
        date: form.date,
        description: form.description,
        note: form.note || undefined,
        accountId: form.accountId,
        categoryId: form.categoryId,
        isRecurring: form.isRecurring,
        isPaid: form.isPaid,
      };

      if (type === "EXPENSE" && form.dueDate) payload.dueDate = form.dueDate;
      if (type === "EXPENSE" && form.installmentTotal && Number(form.installmentTotal) > 1) {
        payload.installmentTotal = Number(form.installmentTotal);
      }

      if (transaction) {
        await api.patch(`/transactions/${transaction.id}`, payload);
      } else {
        await api.post("/transactions", payload);
      }

      await revalidateFinancialData();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar lançamento");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
        </DialogHeader>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType("INCOME")}
            className={cn(
              "rounded-lg border py-2 text-sm font-medium transition-colors",
              type === "INCOME"
                ? "border-success bg-success/10 text-success"
                : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            A Receber
          </button>
          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={cn(
              "rounded-lg border py-2 text-sm font-medium transition-colors",
              type === "EXPENSE"
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            A Pagar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="value">Valor *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          {type === "EXPENSE" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              {!transaction && (
                <div className="space-y-1.5">
                  <Label htmlFor="installments">Parcelas</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={form.installmentTotal}
                    onChange={(e) => setForm((f) => ({ ...f, installmentTotal: e.target.value }))}
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Conta *</Label>
              <Select value={form.accountId} onValueChange={(v) => setForm((f) => ({ ...f, accountId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria *</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Ex: Supermercado, Salário..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Observação</Label>
            <Input
              id="note"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Opcional"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="isRecurring" className="cursor-pointer">Recorrente</Label>
            <Switch
              id="isRecurring"
              checked={form.isRecurring}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isRecurring: v }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="isPaid" className="cursor-pointer">
              {type === "INCOME" ? "Recebido" : "Pago"}
            </Label>
            <Switch
              id="isPaid"
              checked={form.isPaid}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isPaid: v }))}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting} variant={type === "INCOME" ? "success" : "default"}>
            {submitting ? "Salvando..." : transaction ? "Salvar alterações" : "Adicionar lançamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
