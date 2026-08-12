"use client";

import * as React from "react";
import { mutate } from "swr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api/client";
import { Account, ACCOUNT_TYPE_LABELS, AccountType } from "@/lib/api/types";
import { ICON_OPTIONS, getIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
}

const COLOR_OPTIONS = [
  "#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#0ea5e9", "#a855f7", "#ec4899", "#14b8a6",
];

export function AccountDialog({ open, onOpenChange, account }: Props) {
  const [form, setForm] = React.useState({
    name: account?.name ?? "",
    type: account?.type ?? ("CHECKING" as AccountType),
    bank: account?.bank ?? "",
    color: account?.color ?? COLOR_OPTIONS[0],
    icon: account?.icon ?? "wallet",
    initialBalance: account?.initialBalance?.toString() ?? "0",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm({
        name: account?.name ?? "",
        type: account?.type ?? "CHECKING",
        bank: account?.bank ?? "",
        color: account?.color ?? COLOR_OPTIONS[0],
        icon: account?.icon ?? "wallet",
        initialBalance: account?.initialBalance?.toString() ?? "0",
      });
      setError(null);
    }
  }, [open, account]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      setError("Informe um nome para a conta.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        bank: form.bank || undefined,
        color: form.color,
        icon: form.icon,
        ...(account ? {} : { initialBalance: Number(form.initialBalance) || 0 }),
      };
      if (account) {
        await api.patch(`/accounts/${account.id}`, payload);
      } else {
        await api.post("/accounts", payload);
      }
      await mutate("/accounts");
      await mutate((k) => typeof k === "string" && k.startsWith("/dashboard"));
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar conta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? "Editar conta" : "Nova conta"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Nubank, Carteira..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as AccountType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank">Banco</Label>
              <Input id="bank" value={form.bank} onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>

          {!account && (
            <div className="space-y-1.5">
              <Label htmlFor="initialBalance">Saldo inicial</Label>
              <Input
                id="initialBalance"
                type="number"
                step="0.01"
                value={form.initialBalance}
                onChange={(e) => setForm((f) => ({ ...f, initialBalance: e.target.value }))}
              />
            </div>
          )}

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
              {ICON_OPTIONS.slice(0, 8).map((icon) => {
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
            {submitting ? "Salvando..." : account ? "Salvar alterações" : "Criar conta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
