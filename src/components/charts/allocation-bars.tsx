import { useTotals } from "@/lib/store";
import { formatPYG } from "@/lib/format";

const COLORS: Record<string, string> = {
  "Renta Variable": "oklch(0.55 0.13 240)",
  "Renta Fija / Ahorro": "oklch(0.62 0.17 152)",
  Cripto: "oklch(0.7 0.15 80)",
  Cash: "oklch(0.5 0.05 257)",
};

export function AllocationBars() {
  const t = useTotals();
  const items = [
    { name: "Renta Variable", value: Math.max(0, Math.round(t.stocksPYG)) },
    { name: "Renta Fija / Ahorro", value: Math.max(0, Math.round(t.cdasPYG + t.fundsPYG + t.savingsPYG)) },
    { name: "Cripto", value: Math.max(0, Math.round(t.cryptoPYG)) },
    { name: "Cash", value: Math.max(0, Math.round(t.cashPYG)) },
  ];
  const total = items.reduce((a, i) => a + i.value, 0);

  if (total === 0) {
    return <div className="py-8 text-center text-xs text-muted-foreground">Sin activos para mostrar todavía.</div>;
  }

  return (
    <div className="space-y-3 py-1">
      {items.map((it) => {
        const pct = total > 0 ? (it.value / total) * 100 : 0;
        return (
          <div key={it.name}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">{it.name}</span>
              <span className="num font-mono">
                {formatPYG(it.value)} <span className="text-muted-foreground">· {pct.toFixed(0)}%</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: COLORS[it.name] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
