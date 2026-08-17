"use client";

import * as React from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { Plus, Pencil, Trash2, Mail, Phone } from "lucide-react";
import { fetcher, api } from "@/lib/api/client";
import { Client } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientDialog } from "@/components/shared/client-dialog";

export default function ClientesPage() {
  const { data: clients } = useSWR<Client[]>("/clients", fetcher);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Client | undefined>(undefined);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(e: React.MouseEvent, client: Client) {
    e.preventDefault();
    e.stopPropagation();
    setEditing(client);
    setDialogOpen(true);
  }

  async function handleDelete(e: React.MouseEvent, client: Client) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Excluir o cliente "${client.name}"?`)) return;
    await api.delete(`/clients/${client.id}`);
    await mutate("/clients");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Foto, vídeo e captação — quem te deve e o que foi terceirizado</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Novo cliente</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients?.map((client) => (
          <Link key={client.id} href={`/clientes/${client.id}`}>
            <Card className="group relative h-full transition-colors hover:border-primary/40">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {client.name.slice(0, 2).toUpperCase()}
                    </span>
                    <p className="truncate font-medium">{client.name}</p>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => openEdit(e, client)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(e, client)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {client.email && (
                    <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {client.email}</p>
                  )}
                  {client.phone && (
                    <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {client.phone}</p>
                  )}
                </div>
                {client.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {client.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
        {clients?.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
            Nenhum cliente cadastrado ainda
          </div>
        )}
      </div>

      <ClientDialog open={dialogOpen} onOpenChange={setDialogOpen} client={editing} />
    </div>
  );
}
