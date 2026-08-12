"use client";

import * as React from "react";
import { Check, Paperclip, Trash2 } from "lucide-react";
import { Transaction } from "@/lib/api/types";
import { api } from "@/lib/api/client";
import { revalidateFinancialData } from "@/lib/api/revalidate";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  transaction: Transaction;
  onClick?: () => void;
  showDueDate?: boolean;
  onDelete?: () => void;
}

export function TransactionRow({ transaction, onClick, showDueDate, onDelete }: Props) {
  const [loading, setLoading] = React.useState(false);
  const isIncome = transaction.type === "INCOME";

  async function togglePaid(e: React.MouseEvent) {
    e.stopPropagation();
    setLoading(true);
    try {
      await api.patch(`/transactions/${transaction.id}/pay`, { isPaid: !transaction.isPaid });
      await revalidateFinancialData();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Excluir este lançamento?")) return;
    setLoading(true);
    try {
      await api.delete(`/transactions/${transaction.id}`);
      await revalidateFinancialData();
      onDelete?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-secondary cursor-pointer"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{ backgroundColor: `${transaction.category.color}22`, color: transaction.category.color }}
      >
        {transaction.category.name.slice(0, 2).toUpperCase()}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{transaction.description}</p>
        <p className="truncate text-xs text-muted-foreground">
          {transaction.category.name} · {transaction.account.name} ·{" "}
          {showDueDate && transaction.dueDate ? `vence ${formatDate(transaction.dueDate)}` : formatDate(transaction.date)}
          {transaction.attachments?.length > 0 && (
            <Paperclip className="ml-1 inline h-3 w-3 align-text-top" />
          )}
        </p>
      </div>

      <span className={cn("shrink-0 text-sm font-semibold tabular-nums", isIncome ? "text-success" : "text-destructive")}>
        {isIncome ? "+" : "-"}
        {formatCurrency(transaction.value)}
      </span>

      <Button
        size="icon"
        variant={transaction.isPaid ? "success" : "outline"}
        className="h-7 w-7 shrink-0"
        onClick={togglePaid}
        disabled={loading}
        title={transaction.isPaid ? "Pago" : "Marcar como pago"}
      >
        <Check className="h-3.5 w-3.5" />
      </Button>

      {onDelete !== undefined && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={loading}
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
