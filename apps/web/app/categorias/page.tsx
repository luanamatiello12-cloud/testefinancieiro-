"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { fetcher, api } from "@/lib/api/client";
import { Category } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryDialog } from "@/components/shared/category-dialog";
import { getIcon } from "@/lib/icon-map";

export default function CategoriasPage() {
  const { data: categories } = useSWR<Category[]>("/categories", fetcher);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | undefined>(undefined);

  const income = categories?.filter((c) => c.type === "INCOME") ?? [];
  const expense = categories?.filter((c) => c.type === "EXPENSE") ?? [];

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setDialogOpen(true);
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Excluir a categoria "${category.name}"?`)) return;
    await api.delete(`/categories/${category.id}`);
    await mutate((k) => typeof k === "string" && k.startsWith("/categories"));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Categorias</h1>
          <p className="text-sm text-muted-foreground">Organize receitas e despesas</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nova categoria</Button>
      </div>

      <CategoryGroup title="Receitas" categories={income} onEdit={openEdit} onDelete={handleDelete} />
      <CategoryGroup title="Despesas" categories={expense} onEdit={openEdit} onDelete={handleDelete} />

      <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} />
    </div>
  );
}

function CategoryGroup({
  title,
  categories,
  onEdit,
  onDelete,
}: {
  title: string;
  categories: Category[];
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="mb-3 px-1 text-sm font-medium text-muted-foreground">{title}</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {categories.map((category) => {
            const Icon = getIcon(category.icon);
            return (
              <div
                key={category.id}
                className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-secondary"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${category.color}22`, color: category.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="truncate text-sm font-medium">{category.name}</span>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(category)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(category)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
          {categories.length === 0 && (
            <div className="col-span-full py-4 text-center text-sm text-muted-foreground">Nenhuma categoria</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
