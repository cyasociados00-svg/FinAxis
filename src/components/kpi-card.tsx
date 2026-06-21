import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string;
  hint?: ReactNode;
  tone?: "default" | "positive" | "negative" | "warning";
  icon?: ReactNode;
};

const toneClass = {
  default: "text-foreground",
  positive: "text-[color:var(--color-positive)]",
  negative: "text-[color:var(--color-negative)]",
  warning: "text-amber-600",
};

export function KpiCard({ label, value, hint, tone = "default", icon }: Props) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>{label}</span>
          {icon}
        </div>
        <div className={cn("num mt-2 text-2xl font-semibold tracking-tight", toneClass[tone])}>
          {value}
        </div>
        {hint ? (
          <div className="num mt-1 text-xs text-muted-foreground">{hint}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
