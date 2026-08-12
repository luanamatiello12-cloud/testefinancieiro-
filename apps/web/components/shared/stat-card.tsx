import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "default" | "success" | "destructive" | "primary";
  className?: string;
}

const TONE_CLASSES: Record<string, string> = {
  default: "bg-secondary text-foreground",
  success: "bg-success/15 text-success",
  destructive: "bg-destructive/15 text-destructive",
  primary: "bg-primary/15 text-primary",
};

export function StatCard({ label, value, icon: Icon, tone = "default", className }: StatCardProps) {
  return (
    <Card className={cn("animate-slide-up", className)}>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-xl font-semibold tabular-nums">{formatCurrency(value)}</p>
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", TONE_CLASSES[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
