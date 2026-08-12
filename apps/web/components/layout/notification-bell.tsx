"use client";

import * as React from "react";
import useSWR, { mutate } from "swr";
import { Bell, AlertTriangle, Clock, CreditCard, TrendingDown, Target, CheckCheck } from "lucide-react";
import { fetcher, api } from "@/lib/api/client";
import { Notification, NotificationsData, NotificationType } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

const TYPE_META: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  DUE_SOON: { icon: Clock, color: "hsl(var(--primary))" },
  OVERDUE: { icon: AlertTriangle, color: "hsl(var(--destructive))" },
  CARD_CLOSING: { icon: CreditCard, color: "hsl(var(--primary))" },
  LIMIT_ALMOST_REACHED: { icon: CreditCard, color: "hsl(38 92% 50%)" },
  NEGATIVE_BALANCE: { icon: TrendingDown, color: "hsl(var(--destructive))" },
  GOAL_REACHED: { icon: Target, color: "hsl(var(--success))" },
};

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { data } = useSWR<NotificationsData>("/notifications", fetcher, { refreshInterval: 60000 });

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(n: Notification) {
    if (n.isRead) return;
    await api.patch(`/notifications/${n.id}/read`);
    await mutate("/notifications");
  }

  async function markAllRead() {
    await api.patch("/notifications/read-all");
    await mutate("/notifications");
  }

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div ref={containerRef} className="relative">
      <Button variant="ghost" size="icon" aria-label="Notificações" onClick={() => setOpen((o) => !o)} className="relative">
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-80 max-h-96 overflow-y-auto rounded-lg border border-border bg-popover shadow-card animate-slide-up sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <span className="text-sm font-medium">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="p-1.5">
            {!data && <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>}
            {data?.notifications.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma notificação por aqui 🎉</div>
            )}
            {data?.notifications.map((n) => {
              const meta = TYPE_META[n.type];
              const Icon = meta.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors hover:bg-secondary",
                    !n.isRead && "bg-primary/5",
                  )}
                >
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", !n.isRead && "font-medium")}>{n.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
