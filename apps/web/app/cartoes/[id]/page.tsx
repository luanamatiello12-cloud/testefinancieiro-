"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { fetcher, api } from "@/lib/api/client";
import { CardInvoiceView, CreditCard } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardPurchaseDialog } from "@/components/shared/card-purchase-dialog";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

function monthLabel(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, m - 1, 1));
}

function addMonths(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function CardInvoicePage() {
  const params = useParams<{ id: string }>();
  const cardId = params.id;
  const [month, setMonth] = React.useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { data: card } = useSWR<CreditCard>(`/cards/${cardId}`, fetcher);
  const { data: invoice } = useSWR<CardInvoiceView>(`/cards/${cardId}/invoice?month=${month}`, fetcher);

  async function togglePaid() {
    if (!invoice) return;
    await api.patch(`/cards/${cardId}/invoice/${month}/pay`, { paid: invoice.open > 0 });
    await mutate(`/cards/${cardId}/invoice?month=${month}`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{card?.name ?? "Cartão"}</h1>
        <p className="text-sm text-muted-foreground">Fatura</p>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium capitalize">{monthLabel(month)}</span>
        <Button variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(invoice?.total ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pago</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-success">{formatCurrency(invoice?.paid ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Em aberto</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-destructive">{formatCurrency(invoice?.open ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Nova compra</Button>
        {invoice && invoice.total > 0 && (
          <Button variant={invoice.open > 0 ? "success" : "outline"} onClick={togglePaid}>
            {invoice.open > 0 ? "Marcar fatura como paga" : "Desmarcar pagamento"}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="space-y-0.5 p-3">
          <h2 className="px-2 pb-2 pt-1 text-sm font-medium text-muted-foreground">Compras desta fatura</h2>
          {!invoice && <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>}
          {invoice?.purchases.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma compra nesta fatura</div>
          )}
          {invoice?.purchases.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-secondary">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${p.category.color}22`, color: p.category.color }}
              >
                {p.category.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.establishment}</p>
                <p className="truncate text-xs text-muted-foreground">{p.category.name} · {formatDate(p.date)}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-destructive">
                -{formatCurrency(p.value)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {invoice && invoice.futureInstallments.length > 0 && (
        <Card>
          <CardContent className="space-y-0.5 p-3">
            <h2 className="px-2 pb-2 pt-1 text-sm font-medium text-muted-foreground">Parcelas futuras</h2>
            {invoice.futureInstallments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.establishment}</p>
                  <p className="truncate text-xs text-muted-foreground">{monthLabel(p.invoiceMonth)}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                  {formatCurrency(p.value)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <CardPurchaseDialog open={dialogOpen} onOpenChange={setDialogOpen} cardId={cardId} />
    </div>
  );
}
