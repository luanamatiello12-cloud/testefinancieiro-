"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { fetcher } from "@/lib/api/client";
import { api } from "@/lib/api/client";
import { Account, ACCOUNT_TYPE_LABELS } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountDialog } from "@/components/shared/account-dialog";
import { getIcon } from "@/lib/icon-map";
import { formatCurrency } from "@/lib/utils";

export default function ContasPage() {
  const { data: accounts } = useSWR<Account[]>("/accounts", fetcher);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Account | undefined>(undefined);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(account: Account) {
    setEditing(account);
    setDialogOpen(true);
  }

  async function handleDelete(account: Account) {
    if (!confirm(`Excluir a conta "${account.name}"?`)) return;
    await api.delete(`/accounts/${account.id}`);
    await mutate("/accounts");
  }

  const total = accounts?.reduce((sum, a) => sum + a.currentBalance, 0) ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Contas</h1>
          <p className="text-sm text-muted-foreground">Saldo total: {formatCurrency(total)}</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nova conta</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts?.map((account) => {
          const Icon = getIcon(account.icon);
          return (
            <Card key={account.id} className="group relative">
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${account.color}22`, color: account.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{account.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ACCOUNT_TYPE_LABELS[account.type]}{account.bank ? ` · ${account.bank}` : ""}
                    </p>
                    <p className="mt-2 text-lg font-semibold tabular-nums">{formatCurrency(account.currentBalance)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(account)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(account)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {accounts?.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
            Nenhuma conta cadastrada ainda
          </div>
        )}
      </div>

      <AccountDialog open={dialogOpen} onOpenChange={setDialogOpen} account={editing} />
    </div>
  );
}
