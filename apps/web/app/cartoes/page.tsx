"use client";

import * as React from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { fetcher, api } from "@/lib/api/client";
import { CreditCard } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardDialog } from "@/components/shared/card-dialog";
import { getIcon } from "@/lib/icon-map";
import { formatCurrency } from "@/lib/utils";

function CardLimitBar({ cardId }: { cardId: string }) {
  const { data } = useSWR<{ limit: number; used: number; available: number }>(`/cards/${cardId}/limit`, fetcher);
  if (!data) return <div className="h-2 rounded-full bg-secondary" />;
  const pct = Math.min(100, (data.used / data.limit) * 100);
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {formatCurrency(data.available)} disponível de {formatCurrency(data.limit)}
      </p>
    </div>
  );
}

export default function CartoesPage() {
  const { data: cards } = useSWR<CreditCard[]>("/cards", fetcher);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CreditCard | undefined>(undefined);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(e: React.MouseEvent, card: CreditCard) {
    e.preventDefault();
    e.stopPropagation();
    setEditing(card);
    setDialogOpen(true);
  }

  async function handleDelete(e: React.MouseEvent, card: CreditCard) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Excluir o cartão "${card.name}"?`)) return;
    await api.delete(`/cards/${card.id}`);
    await mutate("/cards");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cartões</h1>
          <p className="text-sm text-muted-foreground">Cartões de crédito e faturas</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo cartão</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards?.map((card) => {
          const Icon = getIcon(card.icon);
          return (
            <Link key={card.id} href={`/cartoes/${card.id}`}>
              <Card className="group relative h-full transition-colors hover:border-primary/40">
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${card.color}22`, color: card.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{card.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {card.bank ? `${card.bank} · ` : ""}fecha dia {card.closingDay}, vence dia {card.dueDay}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => openEdit(e, card)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(e, card)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardLimitBar cardId={card.id} />
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {cards?.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
            Nenhum cartão cadastrado ainda
          </div>
        )}
      </div>

      <CardDialog open={dialogOpen} onOpenChange={setDialogOpen} card={editing} />
    </div>
  );
}
