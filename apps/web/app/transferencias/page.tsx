"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { ArrowRight, Trash2 } from "lucide-react";
import { fetcher, api } from "@/lib/api/client";
import { Account, Transfer } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { revalidateFinancialData } from "@/lib/api/revalidate";
import { formatCurrency, formatDate, todayLocalISODate } from "@/lib/utils";

export default function TransferenciasPage() {
  const { data: accounts } = useSWR<Account[]>("/accounts", fetcher);
  const { data: transfers } = useSWR<Transfer[]>("/transfers", fetcher);

  const [form, setForm] = React.useState({
    fromAccountId: "",
    toAccountId: "",
    value: "",
    date: todayLocalISODate(),
    note: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (accounts && accounts.length > 0 && !form.fromAccountId) {
      setForm((f) => ({ ...f, fromAccountId: accounts[0].id }));
    }
  }, [accounts, form.fromAccountId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fromAccountId || !form.toAccountId || !form.value) {
      setError("Preencha os campos obrigatórios.");
      return;
    }
    if (form.fromAccountId === form.toAccountId) {
      setError("Conta de origem e destino devem ser diferentes.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/transfers", {
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        value: Number(form.value),
        date: form.date,
        note: form.note || undefined,
      });
      await mutate("/transfers");
      await revalidateFinancialData();
      setForm((f) => ({ ...f, value: "", note: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao transferir");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta transferência? O saldo das contas será revertido.")) return;
    await api.delete(`/transfers/${id}`);
    await mutate("/transfers");
    await revalidateFinancialData();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transferências</h1>
        <p className="text-sm text-muted-foreground">Mova dinheiro entre suas contas</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div className="space-y-1.5">
                <Label>De</Label>
                <Select value={form.fromAccountId} onValueChange={(v) => setForm((f) => ({ ...f, fromAccountId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Conta de origem" /></SelectTrigger>
                  <SelectContent>
                    {accounts?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block sm:translate-y-[-8px]" />
              <div className="space-y-1.5">
                <Label>Para</Label>
                <Select value={form.toAccountId} onValueChange={(v) => setForm((f) => ({ ...f, toAccountId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Conta de destino" /></SelectTrigger>
                  <SelectContent>
                    {accounts?.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="value">Valor *</Label>
                <Input id="value" type="number" step="0.01" min="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Data *</Label>
                <Input id="date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note">Observação</Label>
              <Input id="note" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Opcional" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting}>{submitting ? "Transferindo..." : "Transferir"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-0.5 p-3">
          <h2 className="px-2 pb-2 pt-1 text-sm font-medium text-muted-foreground">Histórico</h2>
          {transfers?.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma transferência ainda</div>
          )}
          {transfers?.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-secondary">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {t.fromAccount.name} <ArrowRight className="inline h-3 w-3" /> {t.toAccount.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">{formatDate(t.date)}{t.note ? ` · ${t.note}` : ""}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(t.value)}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(t.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
