"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import { Plus, Camera, Video, Aperture, Check, Trash2, Mail, Phone } from "lucide-react";
import { fetcher, api } from "@/lib/api/client";
import { revalidateFinancialData } from "@/lib/api/revalidate";
import { Client, ClientJob, SERVICE_TYPE_LABELS, ServiceType } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientJobDialog } from "@/components/shared/client-job-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";

const TYPE_ICON: Record<ServiceType, typeof Camera> = {
  PHOTO: Camera,
  VIDEO: Video,
  CAPTURE: Aperture,
};

function JobRow({ job, clientId }: { job: ClientJob; clientId: string }) {
  const [loading, setLoading] = React.useState(false);
  const Icon = TYPE_ICON[job.type];

  async function togglePaid(transactionId: string, isPaid: boolean) {
    setLoading(true);
    try {
      await api.patch(`/transactions/${transactionId}/pay`, { isPaid: !isPaid });
      await mutate((k) => typeof k === "string" && k.startsWith(`/clients/${clientId}/jobs`));
      await revalidateFinancialData();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir o trabalho "${job.description}"? Os lançamentos vinculados também serão removidos.`)) return;
    await api.delete(`/clients/jobs/${job.id}`);
    await mutate((k) => typeof k === "string" && k.startsWith(`/clients/${clientId}/jobs`));
    await revalidateFinancialData();
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
              <p className="truncate text-sm font-medium">{job.description}</p>
              <p className="text-xs text-muted-foreground">{SERVICE_TYPE_LABELS[job.type]} · {formatDate(job.serviceDate)}</p>
            </div>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
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

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;

  const { data: client } = useSWR<Client>(`/clients/${clientId}`, fetcher);
  const { data: jobs } = useSWR<ClientJob[]>(`/clients/${clientId}/jobs`, fetcher);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const aReceber = jobs?.filter((j) => !j.incomeTransaction.isPaid).reduce((s, j) => s + j.incomeTransaction.value, 0) ?? 0;
  const aPagar = jobs
    ?.filter((j) => j.outsourcedTransaction && !j.outsourcedTransaction.isPaid)
    .reduce((s, j) => s + (j.outsourcedTransaction?.value ?? 0), 0) ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{client?.name ?? "Cliente"}</h1>
        <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
          {client?.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {client.email}</span>}
          {client?.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {client.phone}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">A receber</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-success">{formatCurrency(aReceber)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">A pagar (terceiros)</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-destructive">{formatCurrency(aPagar)}</p>
          </CardContent>
        </Card>
      </div>

      <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Novo trabalho</Button>

      <div className="space-y-3">
        {!jobs && <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>}
        {jobs?.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhum trabalho registrado ainda</div>
        )}
        {jobs?.map((job) => (
          <JobRow key={job.id} job={job} clientId={clientId} />
        ))}
      </div>

      <ClientJobDialog open={dialogOpen} onOpenChange={setDialogOpen} clientId={clientId} />
    </div>
  );
}
