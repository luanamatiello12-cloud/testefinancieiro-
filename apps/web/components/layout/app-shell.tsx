"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearch } from "./global-search";
import { QuickAddButton } from "./quick-add-button";
import { NotificationBell } from "./notification-bell";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <GlobalSearch />
          </div>

          <NotificationBell />
          <ThemeToggle />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <QuickAddButton />
    </div>
  );
}
