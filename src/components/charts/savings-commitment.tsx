import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useStore, EXTERNAL_ORIGIN } from "@/lib/store";
import { futureSavingsByMonth } from "@/lib/finance-math";
import { formatPYG } from "@/lib/format";
import { format, parse } from "date-fns";

export function SavingsCommitment() {
  const savings = useStore((s) => s.programmedSavings);
  // Only account-funded plans draw cash from your accounts.
  const committed = savings.filter(
    (s) => s.active && s.sourceAccountId && s.sourceAccountId !== EXTERNAL_ORIGIN,
  );
  const raw = futureSavingsByMonth(committed, 6);
  const data = raw.map((d) => ({
    month: format(parse(d.month, "yyyy-MM", new Date()), "MMM"),
    ahorro: Math.round(d.amount),
  }));
  const total = data.reduce((a, d) => a + d.ahorro, 0);

  if (total === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        Sin ahorros programados con débito automático. Se proyecta acá lo que deberás destinar al ahorro.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">
        Total próximos 6 meses: <span className="num font-mono font-medium text-foreground">{formatPYG(total)}</span>
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ahorroG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-positive)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-positive)" stopOpacity={0} />
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
            contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 12 }}
          />
          <Area type="monotone" dataKey="ahorro" stroke="var(--color-positive)" strokeWidth={2} fill="url(#ahorroG)" name="Ahorro comprometido" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
