import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useStore } from "@/lib/store";
import { formatPYG } from "@/lib/format";
import { format, parse } from "date-fns";

export function NetWorthTrend() {
  const netHistory = useStore((s) => s.netHistory);
  const data = netHistory.slice(-6).map((h) => ({
    month: format(parse(h.ym, "yyyy-MM", new Date()), "MMM"),
    net: h.net,
  }));

  if (data.length < 2) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center gap-1 text-center text-xs text-muted-foreground">
        <span>El historial de patrimonio se construye mes a mes.</span>
        <span>{data.length === 1 ? "Ya registramos este mes; volvé el mes que viene para ver la tendencia." : "Aún sin datos."}</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="netG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
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
        <Area type="monotone" dataKey="net" stroke="var(--color-primary)" strokeWidth={2} fill="url(#netG)" name="Patrimonio Neto" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
