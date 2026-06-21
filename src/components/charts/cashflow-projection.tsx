import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useStore } from "@/lib/store";
import { futureInstallmentsByMonth } from "@/lib/finance-math";
import { formatPYG } from "@/lib/format";
import { format, parse } from "date-fns";

export function CashflowProjection() {
  const installments = useStore((s) => s.installments);
  const raw = futureInstallmentsByMonth(installments, 6);
  const data = raw.map((d) => ({
    month: format(parse(d.month, "yyyy-MM", new Date()), "MMM"),
    cuotas: Math.round(d.amount),
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="cuotasG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-negative)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-negative)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
        <YAxis
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
          width={50}
        />
        <Tooltip
          formatter={(v: number) => formatPYG(v)}
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="cuotas"
          stroke="var(--color-negative)"
          strokeWidth={2}
          fill="url(#cuotasG)"
          name="Cuotas a vencer"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
