import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { monthlyIncomeExpense } from "@/lib/finance-math";
import { useStore } from "@/lib/store";
import { formatPYG } from "@/lib/format";

export function IncomeExpenseBar() {
  const transactions = useStore((s) => s.transactions);
  const data = monthlyIncomeExpense(transactions, 6);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="incomeFixed" stackId="in" fill="var(--color-positive)" name="Ing. Dep." />
        <Bar dataKey="incomeIndep" stackId="in" fill="oklch(0.72 0.15 152)" name="Ing. Indep." />
        <Bar dataKey="expenseFixed" stackId="out" fill="var(--color-negative)" name="Gasto Fijo" />
        <Bar dataKey="expenseVar" stackId="out" fill="oklch(0.7 0.18 27)" name="Gasto Var." />
      </BarChart>
    </ResponsiveContainer>
  );
}
