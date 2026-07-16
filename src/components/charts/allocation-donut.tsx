import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTotals } from "@/lib/store";
import { formatPYG } from "@/lib/format";

const COLORS = [
  "oklch(0.55 0.13 240)", // RV - azul
  "oklch(0.62 0.17 152)", // RF - verde
  "oklch(0.7 0.15 80)",   // Cripto - dorado
  "oklch(0.5 0.05 257)",  // Cash - slate
];

export function AllocationDonut() {
  const t = useTotals();
  const data = [
    { name: "Renta Variable", value: Math.round(t.stocksPYG) },
    { name: "Renta Fija / Ahorro", value: Math.round(t.cdasPYG + t.fundsPYG + t.savingsPYG) },
    { name: "Cripto", value: Math.round(t.cryptoPYG) },
    { name: "Cash", value: Math.round(t.cashPYG) },
  ];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i]} stroke="var(--color-card)" strokeWidth={2} />
          ))}
        </Pie>
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
      </PieChart>
    </ResponsiveContainer>
  );
}
