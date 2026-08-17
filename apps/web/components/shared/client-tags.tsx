"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { X, Plus } from "lucide-react";
import { fetcher, api } from "@/lib/api/client";
import { Client, Tag } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function ClientTags({ client, editable = true }: { client: Client; editable?: boolean }) {
  const { data: allTags } = useSWR<Tag[]>(editable ? "/tags" : null, fetcher);
  const [adding, setAdding] = React.useState(false);
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function refresh() {
    await mutate(`/clients/${client.id}`);
    await mutate("/clients");
  }

  async function addTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setValue("");
    setAdding(false);
    await api.post(`/clients/${client.id}/tags`, { name: trimmed });
    await refresh();
  }

  async function removeTag(tagId: string) {
    await api.delete(`/clients/${client.id}/tags/${tagId}`);
    await refresh();
  }

  const suggestions = (allTags ?? []).filter(
    (t) =>
      !client.tags.some((ct) => ct.id === t.id) &&
      t.name.toLowerCase().includes(value.toLowerCase()) &&
      value.trim().length > 0,
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {client.tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
        >
          {tag.name}
          {editable && (
            <button
              type="button"
              onClick={() => removeTag(tag.id)}
              className="rounded-full opacity-60 hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      {editable && !adding && (
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-secondary"
        >
          <Plus className="h-3 w-3" /> Tag
        </button>
      )}

      {editable && adding && (
        <div className="relative">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(value);
              }
              if (e.key === "Escape") {
                setAdding(false);
                setValue("");
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setAdding(false);
                setValue("");
              }, 150);
            }}
            placeholder="Nova tag..."
            className="h-6 w-28 rounded-full border border-border bg-transparent px-2 text-xs outline-none focus:border-primary"
          />
          {suggestions.length > 0 && (
            <div className="absolute left-0 top-7 z-10 w-36 overflow-hidden rounded-lg border border-border bg-card shadow-card">
              {suggestions.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(s.name);
                  }}
                  className={cn(
                    "block w-full px-2.5 py-1.5 text-left text-xs hover:bg-secondary",
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
