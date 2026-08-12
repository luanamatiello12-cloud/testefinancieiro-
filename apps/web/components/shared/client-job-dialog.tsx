"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetcher, api } from "@/lib/api/client";
import { revalidateFinancialData } from "@/lib/api/revalidate";
import { Account, SERVICE_TYPE_LABELS, ServiceType } from "@/lib/api/types";
import { cn, todayLocalISODate } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export function ClientJobDialog({ open, onOpenChange, clientId }: Props) {
  const { data: accounts } = useSWR<Account[]>("/accounts", fetcher);

  const [type, setType] = React.useState<ServiceType>("PHOTO");
  const [form, setForm] = React.useState({
    description: "",
    serviceDate: todayLocalISODate(),
    value: "",
    accountId: "",
    dueDate: todayLocalISODate(),
    isPaid: false,
    isOutsourced: false,
    outsourcedTo: "",
    outsourcedValue: "",
    outsourcedAccountId: "",
    outsourcedDueDate: todayLocalISODate(),
    outsourcedIsPaid: false,
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setType("PHOTO");
      setForm({
        description: "",
        serviceDate: todayLocalISODate(),
        value: "",
        accountId: accounts?.[0]?.id ?? "",
        dueDate: todayLocalISODate(),
        isPaid: false,
        isOutsourced: false,
        outsourcedTo: "",
        outsourcedValue: "",
        outsourcedAccountId: accounts?.[0]?.id ?? "",
        outsourcedDueDate: todayLocalISODate(),
        outsourcedIsPaid: false,
      });
      setError(null);
    }
  }, [open, accounts]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.value || !form.accountId || !form.dueDate) {
      setError("Preencha os campos obrigatórios.");
      return;
    }
    if (form.isOutsourced && (!form.outsourcedTo || !form.outsourcedValue || !form.outsourcedAccountId || !form.outsourcedDueDate)) {
      setError("Preencha os dados da terceirização.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/clients/${clientId}/jobs`, {
        type,
        description: form.description,
        serviceDate: form.serviceDate,
        value: Number(form.value),
        accountId: form.accountId,
        dueDate: form.dueDate,
        isPaid: form.isPaid,
        isOutsourced: form.isOutsourced,
        ...(form.isOutsourced
          ? {
              outsourcedTo: form.outsourcedTo,
              outsourcedValue: Number(form.outsourcedValue),
              outsourcedAccountId: form.outsourcedAccountId,
              outsourcedDueDate: form.outsourcedDueDate,
              outsourcedIsPaid: form.outsourcedIsPaid,
            }
          : {}),
      });
      await mutate((k) => typeof k === "string" && k.startsWith(`/clients/${clientId}/jobs`));
      await revalidateFinancialData();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar trabalho");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo trabalho</DialogTitle>
        </DialogHeader>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-lg border py-2 text-sm font-medium transition-colors",
                type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {SERVICE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição *</Label>
            <Input id="description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Ex: Ensaio de casamento" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="value">Valor cobrado *</Label>
              <Input id="value" type="number" step="0.01" min="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="serviceDate">Data do serviço *</Label>
              <Input id="serviceDate" type="date" value={form.serviceDate} onChange={(e) => setForm((f) => ({ ...f, serviceDate: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Conta de recebimento *</Label>
              <Select value={form.accountId} onValueChange={(v) => setForm((f) => ({ ...f, accountId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Cliente paga até *</Label>
              <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="isPaid" className="cursor-pointer">Cliente já pagou</Label>
            <Switch id="isPaid" checked={form.isPaid} onCheckedChange={(v) => setForm((f) => ({ ...f, isPaid: v }))} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="isOutsourced" className="cursor-pointer">Terceirizei esse trabalho</Label>
            <Switch id="isOutsourced" checked={form.isOutsourced} onCheckedChange={(v) => setForm((f) => ({ ...f, isOutsourced: v }))} />
          </div>

          {form.isOutsourced && (
            <div className="space-y-4 rounded-lg border border-dashed border-border p-3">
              <div className="space-y-1.5">
                <Label htmlFor="outsourcedTo">Terceirizado para *</Label>
                <Input id="outsourcedTo" value={form.outsourcedTo} onChange={(e) => setForm((f) => ({ ...f, outsourcedTo: e.target.value }))} placeholder="Nome de quem fez o trabalho" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="outsourcedValue">Valor a pagar *</Label>
                  <Input id="outsourcedValue" type="number" step="0.01" min="0" value={form.outsourcedValue} onChange={(e) => setForm((f) => ({ ...f, outsourcedValue: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="outsourcedDueDate">Pagar até *</Label>
                  <Input id="outsourcedDueDate" type="date" value={form.outsourcedDueDate} onChange={(e) => setForm((f) => ({ ...f, outsourcedDueDate: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Conta de pagamento *</Label>
                <Select value={form.outsourcedAccountId} onValueChange={(v) => setForm((f) => ({ ...f, outsourcedAccountId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {accounts?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <Label htmlFor="outsourcedIsPaid" className="cursor-pointer">Já paguei ele</Label>
                <Switch id="outsourcedIsPaid" checked={form.outsourcedIsPaid} onCheckedChange={(v) => setForm((f) => ({ ...f, outsourcedIsPaid: v }))} />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Salvando..." : "Adicionar trabalho"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
