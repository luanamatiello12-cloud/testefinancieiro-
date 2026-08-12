"use client";

import * as React from "react";
import useSWR from "swr";
import { Plus } from "lucide-react";
import { fetcher } from "@/lib/api/client";
import { revalidateFinancialData } from "@/lib/api/revalidate";
import { Account, Category, Transaction, TransactionType } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TransactionRow } from "@/components/shared/transaction-row";
import { TransactionDialog } from "@/components/shared/transaction-dialog";

const ALL = "__all__";

export default function LancamentosPage() {
  const [type, setType] = React.useState<string>(ALL);
  const [accountId, setAccountId] = React.useState<string>(ALL);
  const [categoryId, setCategoryId] = React.useState<string>(ALL);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [defaultType, setDefaultType] = React.useState<TransactionType>("EXPENSE");
  const [editing, setEditing] = React.useState<Transaction | undefined>(undefined);

  const { data: accounts } = useSWR<Account[]>("/accounts", fetcher);
  const { data: categories } = useSWR<Category[]>("/categories", fetcher);

  const query = new URLSearchParams();
  if (type !== ALL) query.set("type", type);
  if (accountId !== ALL) query.set("accountId", accountId);
  if (categoryId !== ALL) query.set("categoryId", categoryId);
  if (from) query.set("from", from);
  if (to) query.set("to", to);

  const { data: transactions } = useSWR<Transaction[]>(`/transactions?${query.toString()}`, fetcher);

  function openCreate(t: TransactionType) {
    setEditing(undefined);
    setDefaultType(t);
    setDialogOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditing(t);
    setDialogOpen(true);
  }

  async function handleDialogChange(open: boolean) {
    setDialogOpen(open);
    if (!open) await revalidateFinancialData();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Lançamentos</h1>
          <p className="text-sm text-muted-foreground">Receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="success" onClick={() => openCreate("INCOME")}>
            <Plus className="h-4 w-4" /> Receita
          </Button>
          <Button variant="destructive" onClick={() => openCreate("EXPENSE")}>
            <Plus className="h-4 w-4" /> Despesa
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os tipos</SelectItem>
              <SelectItem value="INCOME">Receitas</SelectItem>
              <SelectItem value="EXPENSE">Despesas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger><SelectValue placeholder="Conta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as contas</SelectItem>
              {accounts?.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as categorias</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="De" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Até" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-0.5 p-3">
          {!transactions && <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>}
          {transactions?.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">Nenhum lançamento encontrado</div>
          )}
          {transactions?.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              showDueDate={t.type === "EXPENSE"}
              onClick={() => openEdit(t)}
              onDelete={() => {}}
            />
          ))}
        </CardContent>
      </Card>

      <TransactionDialog open={dialogOpen} onOpenChange={handleDialogChange} transaction={editing} defaultType={defaultType} />
    </div>
  );
}
