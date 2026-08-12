"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetcher, api } from "@/lib/api/client";
import { Category } from "@/lib/api/types";
import { todayLocalISODate } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
}

export function CardPurchaseDialog({ open, onOpenChange, cardId }: Props) {
  const { data: categories } = useSWR<Category[]>("/categories?type=EXPENSE", fetcher);
  const [form, setForm] = React.useState({
    value: "",
    categoryId: "",
    establishment: "",
    note: "",
    date: todayLocalISODate(),
    installmentTotal: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm({
        value: "",
        categoryId: "",
        establishment: "",
        note: "",
        date: todayLocalISODate(),
        installmentTotal: "",
      });
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.value || !form.categoryId || !form.establishment) {
      setError("Preencha os campos obrigatórios.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/cards/${cardId}/purchases`, {
        value: Number(form.value),
        categoryId: form.categoryId,
        establishment: form.establishment,
        note: form.note || undefined,
        date: form.date,
        installmentTotal: form.installmentTotal ? Number(form.installmentTotal) : undefined,
      });
      await mutate((k) => typeof k === "string" && k.startsWith(`/cards/${cardId}`));
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar compra");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova compra</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="establishment">Estabelecimento *</Label>
            <Input id="establishment" value={form.establishment} onChange={(e) => setForm((f) => ({ ...f, establishment: e.target.value }))} placeholder="Ex: Amazon, Posto Ipiranga..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria *</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="installments">Parcelas</Label>
              <Input id="installments" type="number" min="1" placeholder="1" value={form.installmentTotal} onChange={(e) => setForm((f) => ({ ...f, installmentTotal: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Observação</Label>
            <Input id="note" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Opcional" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Salvando..." : "Adicionar compra"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
