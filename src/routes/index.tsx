import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncomeExpenseBar } from "@/components/charts/income-expense-bar";
import { AllocationDonut } from "@/components/charts/allocation-donut";
import { CashflowProjection } from "@/components/charts/cashflow-projection";
import { useStore, useTotals } from "@/lib/store";
import { formatPYG, formatUSD } from "@/lib/format";
import { Wallet, Droplet, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { BreakdownSheet } from "@/components/breakdown-sheet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resumen - FinAxis" },
      { name: "description", content: "Balance consolidado y liquidez." },
    ],
  }),
  component: Dashboard,
});

type Kind = "liquidity" | "contingent" | "networth" | null;

function Dashboard() {
  const t = useTotals();
  const exchangeRate = useStore((s) => s.exchangeRate);
  const [kind, setKind] = useState<Kind>(null);

  return (
    <AppShell title="Resumen" subtitle="Balance consolidado y liquidez">
      <div className="grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() => setKind("networth")}
          className="text-left rounded-lg transition hover:ring-2 hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <KpiCard
            label="Patrimonio Neto · ver desglose â†’"
            value={formatPYG(t.net)}
            tone="positive"
            icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
            hint={`Activos USD: ${formatUSD(t.stocksUSD + t.cryptoUSD)} · TC ${exchangeRate.toLocaleString("es-PY")}`}
          />
        </button>
        <button
          type="button"
          onClick={() => setKind("liquidity")}
          className="text-left rounded-lg transition hover:ring-2 hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <KpiCard
            label="Liquidez Inmediata · ver desglose â†’"
            value={formatPYG(t.liquid)}
            icon={<Droplet className="h-4 w-4 text-muted-foreground" />}
            hint="Efectivo + cuentas a la vista"
          />
        </button>
        <button
          type="button"
          onClick={() => setKind("contingent")}
          className="text-left rounded-lg transition hover:ring-2 hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <KpiCard
            label="Pasivos Contingentes · ver desglose â†’"
            value={formatPYG(t.contingent)}
            tone="negative"
            icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
            hint={`Saldo tarjetas ${formatPYG(t.debtPYG)} (incl. ${formatPYG(t.futureInstallments)} en cuotas)`}
          />
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estado de Resultados - ultimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent><IncomeExpenseBar /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent><AllocationDonut /></CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Proyeccion de cuotas a vencer - proximos 6 meses
            </CardTitle>
          </CardHeader>
          <CardContent><CashflowProjection /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Composición del Patrimonio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Cash & Bancos (PYG)" value={formatPYG(t.cashPYG)} />
            <Row label="CDAs devengados" value={formatPYG(t.cdasPYG)} />
            <Row label="Fondos Mutuos" value={formatPYG(t.fundsPYG)} />
            <Row label="Acciones EE.UU." value={formatPYG(t.stocksPYG)} sub={formatUSD(t.stocksUSD)} />
            <Row label="Cripto" value={formatPYG(t.cryptoPYG)} sub={formatUSD(t.cryptoUSD)} />
            <div className="my-2 border-t" />
            <Row label="Deuda tarjetas" value={`- ${formatPYG(t.debtPYG)}`} negative />
            <div className="my-2 border-t" />
            <Row label="Patrimonio Neto" value={formatPYG(t.net)} bold />
          </CardContent>
        </Card>
      </div>

      <BreakdownSheet kind={kind} onOpenChange={(v) => !v && setKind(null)} />
    </AppShell>
  );
}

function Row({
  label, value, sub, bold, negative,
}: { label: string; value: string; sub?: string; bold?: boolean; negative?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={`text-muted-foreground ${bold ? "font-semibold text-foreground" : ""}`}>{label}</span>
      <span className={`num font-mono ${bold ? "text-base font-semibold" : "text-sm"} ${negative ? "text-[color:var(--color-negative)]" : ""}`}>
        {value}
        {sub ? <span className="ml-2 text-xs text-muted-foreground">({sub})</span> : null}
      </span>
    </div>
  );
}
