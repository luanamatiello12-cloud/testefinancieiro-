"use client";

import * as React from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { Camera, Video, Aperture, Check, TrendingUp, TrendingDown } from "lucide-react";
import { fetcher, api } from "@/lib/api/client";
import { revalidateFinancialData } from "@/lib/api/revalidate";
import { ClientJob, SERVICE_TYPE_LABELS, ServiceType } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/shared/stat-card";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const TYPE_ICON: Record<ServiceType, typeof Camera> = {
  PHOTO: Camera,
  VIDEO: Video,
  CAPTURE: Aperture,
};

const ALL = "__all__";

function SaleRow({ job }: { job: ClientJob }) {
  const [loading, setLoading] = React.useState(false);
  const Icon = TYPE_ICON[job.type];

  async function togglePaid(transactionId: string, isPaid: boolean) {
    setLoading(true);
    try {
      await api.patch(`/transactions/${transactionId}/pay`, { isPaid: !isPaid });
      await mutate("/clients/jobs");
      await revalidateFinancialData();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <Link href={`/clientes/${job.clientId}`} className="truncate text-sm font-medium hover:underline">
                {job.client?.name ?? "Cliente"}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {SERVICE_TYPE_LABELS[job.type]} · {job.description} · {formatDate(job.serviceDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Cliente paga · {job.incomeTransaction.account.name}</p>
            <p className="text-sm font-semibold tabular-nums text-success">{formatCurrency(job.incomeTransaction.value)}</p>
            <p className="text-xs text-muted-foreground">
              {job.incomeTransaction.isPaid ? "Pago" : `Vence ${formatDate(job.incomeTransaction.dueDate ?? job.incomeTransaction.date)}`}
            </p>
          </div>
          <Button
            size="sm"
            variant={job.incomeTransaction.isPaid ? "success" : "outline"}
            disabled={loading}
            onClick={() => togglePaid(job.incomeTransaction.id, job.incomeTransaction.isPaid)}
          >
            <Check className="h-3.5 w-3.5" /> {job.incomeTransaction.isPaid ? "Recebido" : "Marcar recebido"}
          </Button>
        </div>

        {job.isOutsourced && job.outsourcedTransaction && (
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Terceirizado: {job.outsourcedTo}</p>
              <p className="text-sm font-semibold tabular-nums text-destructive">{formatCurrency(job.outsourcedTransaction.value)}</p>
              <p className="text-xs text-muted-foreground">
                {job.outsourcedTransaction.isPaid ? "Pago" : `Pagar até ${formatDate(job.outsourcedTransaction.dueDate ?? job.outsourcedTransaction.date)}`}
              </p>
            </div>
            <Button
              size="sm"
              variant={job.outsourcedTransaction.isPaid ? "success" : "outline"}
              disabled={loading}
              onClick={() => togglePaid(job.outsourcedTransaction!.id, job.outsourcedTransaction!.isPaid)}
            >
              <Check className="h-3.5 w-3.5" /> {job.outsourcedTransaction.isPaid ? "Pago" : "Marcar pago"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VendasPage() {
  const { data: jobs } = useSWR<ClientJob[]>("/clients/jobs", fetcher);
  const [statusFilter, setStatusFilter] = React.useState(ALL);
  const [clientFilter, setClientFilter] = React.useState(ALL);

  const clientOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const j of jobs ?? []) {
      if (j.client) map.set(j.client.id, j.client.name);
    }
    return Array.from(map.entries());
  }, [jobs]);

  const filtered = (jobs ?? []).filter((j) => {
    if (clientFilter !== ALL && j.clientId !== clientFilter) return false;
    if (statusFilter === "paid" && !j.incomeTransaction.isPaid) return false;
    if (statusFilter === "pending" && j.incomeTransaction.isPaid) return false;
    return true;
  });

  const aReceber = (jobs ?? []).filter((j) => !j.incomeTransaction.isPaid).reduce((s, j) => s + j.incomeTransaction.value, 0);
  const aPagar = (jobs ?? [])
    .filter((j) => j.outsourcedTransaction && !j.outsourcedTransaction.isPaid)
    .reduce((s, j) => s + (j.outsourcedTransaction?.value ?? 0), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Vendas</h1>
        <p className="text-sm text-muted-foreground">Extrato de todas as vendas, de todos os clientes</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total a receber" value={aReceber} icon={TrendingUp} tone="success" />
        <StatCard label="Total a pagar (terceiros)" value={aPagar} icon={TrendingDown} tone="destructive" />
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Recebidos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os clientes</SelectItem>
              {clientOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {!jobs && <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>}
        {jobs && filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma venda encontrada</div>
        )}
        {filtered.map((job) => (
          <SaleRow key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
