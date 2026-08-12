"use client";

import * as React from "react";
import useSWR from "swr";
import { Search } from "lucide-react";
import { fetcher } from "@/lib/api/client";
import { Transaction } from "@/lib/api/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export function GlobalSearch() {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { data: results } = useSWR<Transaction[]>(
    query.trim().length > 1 ? `/search?q=${encodeURIComponent(query.trim())}` : null,
    fetcher,
  );

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar lançamentos, categorias, contas..."
        className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {open && query.trim().length > 1 && (
        <div className="absolute left-0 right-0 top-12 z-40 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover p-1.5 shadow-card animate-slide-up">
          {!results && <div className="p-3 text-sm text-muted-foreground">Buscando...</div>}
          {results && results.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">Nenhum resultado encontrado</div>
          )}
          {results?.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm hover:bg-secondary"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{t.description}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.category.name} · {t.account.name} · {formatDate(t.date)}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold",
                  t.type === "INCOME" ? "text-success" : "text-destructive",
                )}
              >
                {t.type === "INCOME" ? "+" : "-"}
                {formatCurrency(t.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
