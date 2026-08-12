"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { TransactionDialog } from "@/components/shared/transaction-dialog";

export function QuickAddButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card transition-transform hover:scale-105 active:scale-95"
        aria-label="Novo lançamento"
      >
        <Plus className="h-6 w-6" />
      </button>
      <TransactionDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
