import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { useStore, useTotals } from "@/lib/store";
import { formatPYG, formatUSD, formatDate, formatPct } from "@/lib/format";

type BreakdownKind = "liquidity" | "contingent" | "networth" | null;

export function BreakdownSheet({
  kind, onOpenChange,
}: { kind: BreakdownKind; onOpenChange: (v: boolean) => void }) {
  return (
    <Sheet open={!!kind} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {kind === "liquidity" && <LiquidityBreakdown />}
        {kind === "contingent" && <ContingentBreakdown />}
        {kind === "networth" && <NetWorthBreakdown />}
      </SheetContent>
    </Sheet>
  );
}

function LiquidityBreakdown() {
  const accounts = useStore((s) => s.accounts);
  const total = accounts.reduce((a, x) => a + x.balancePYG, 0);
  return (
    <>
      <SheetHeader>
        <SheetTitle>Desglose · Liquidez inmediata</SheetTitle>
        <SheetDescription>Efectivo + cuentas a la vista.</SheetDescription>
      </SheetHeader>
      <table className="mt-4 w-full text-sm">
        <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Cuenta</th>
            <th className="px-3 py-2 text-left font-medium">Tipo</th>
            <th className="px-3 py-2 text-right font-medium">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.id} className="border-t">
              <td className="px-3 py-2">{a.name}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{a.kind === "cash" ? "Efectivo" : "Débito"}</td>
              <td className="num px-3 py-2 text-right font-mono">{formatPYG(a.balancePYG)}</td>
            </tr>
          ))}
          <tr className="border-t bg-muted/40">
            <td className="px-3 py-2 font-semibold" colSpan={2}>Total</td>
            <td className="num px-3 py-2 text-right font-mono font-semibold">{formatPYG(total)}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function ContingentBreakdown() {
  const cards = useStore((s) => s.cards);
  const installments = useStore((s) => s.installments);
  const transactions = useStore((s) => s.transactions);
  const debt = cards.reduce((a, x) => a + x.balancePYG, 0);
  const futureInst = installments.filter((i) => !i.paid);
  const futureTotal = futureInst.reduce((a, x) => a + x.amount, 0);
  return (
    <>
      <SheetHeader>
        <SheetTitle>Desglose · Pasivo contingente</SheetTitle>
        <SheetDescription>Deuda de tarjetas + cuotas futuras no pagadas.</SheetDescription>
      </SheetHeader>

      <div className="mt-4">
        <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Saldo de tarjetas</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Tarjeta</th>
              <th className="px-3 py-2 text-right font-medium">Saldo</th>
              <th className="px-3 py-2 text-right font-medium">Util.</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">{c.name}</td>
                <td className="num px-3 py-2 text-right font-mono">{formatPYG(c.balancePYG)}</td>
                <td className="num px-3 py-2 text-right font-mono text-muted-foreground">{formatPct((c.balancePYG / c.limitPYG) * 100)}</td>
              </tr>
            ))}
            <tr className="border-t bg-muted/40">
              <td className="px-3 py-2 font-semibold">Subtotal tarjetas</td>
              <td className="num px-3 py-2 text-right font-mono font-semibold" colSpan={2}>{formatPYG(debt)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Cuotas futuras por vencer</div>
        {futureInst.length === 0 ? (
          <p className="text-xs text-muted-foreground">No hay cuotas pendientes.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Concepto</th>
                <th className="px-3 py-2 text-right font-medium">Cuota</th>
                <th className="px-3 py-2 text-right font-medium">Vto.</th>
                <th className="px-3 py-2 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody>
              {futureInst.map((i) => {
                const tx = transactions.find((t) => t.id === i.transactionId);
                return (
                  <tr key={i.id} className="border-t">
                    <td className="px-3 py-2 text-xs">{tx?.concept ?? "-"}</td>
                    <td className="num px-3 py-2 text-right font-mono text-xs text-muted-foreground">{i.number}/{i.of}</td>
                    <td className="num px-3 py-2 text-right font-mono text-xs text-muted-foreground">{formatDate(i.dueDate)}</td>
                    <td className="num px-3 py-2 text-right font-mono">{formatPYG(i.amount)}</td>
                  </tr>
                );
              })}
              <tr className="border-t bg-muted/40">
                <td className="px-3 py-2 font-semibold" colSpan={3}>Subtotal cuotas</td>
                <td className="num px-3 py-2 text-right font-mono font-semibold">{formatPYG(futureTotal)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 rounded border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Las cuotas futuras están incluidas dentro del saldo de tarjetas - no se suman por separado.
      </div>
      <div className="mt-2 flex items-center justify-between rounded border bg-muted/60 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider">Total deuda</span>
        <span className="num font-mono text-base font-semibold text-[color:var(--color-negative)]">{formatPYG(debt)}</span>
      </div>
    </>
  );
}

function NetWorthBreakdown() {
  const t = useTotals();
  const rate = useStore((s) => s.exchangeRate);
  const rows = [
    { label: "Cash & Bancos (PYG)", value: t.cashPYG, sign: 1 },
    { label: "CDAs (valor devengado)", value: t.cdasPYG, sign: 1 },
    { label: "Fondos Mutuos", value: t.fundsPYG, sign: 1 },
    { label: "Ahorro Programado (aportado)", value: t.savingsPYG, sign: 1 },
    { label: `Acciones EE.UU. (${formatUSD(t.stocksUSD)} × ${rate.toLocaleString("es-PY")})`, value: t.stocksPYG, sign: 1 },
    { label: `Cripto (${formatUSD(t.cryptoUSD)} × ${rate.toLocaleString("es-PY")})`, value: t.cryptoPYG, sign: 1 },
    { label: "Deuda tarjetas", value: t.debtPYG, sign: -1 },
  ];
  return (
    <>
      <SheetHeader>
        <SheetTitle>Desglose · Patrimonio Neto</SheetTitle>
        <SheetDescription>Activos − pasivos, consolidado en PYG.</SheetDescription>
      </SheetHeader>
      <table className="mt-4 w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t">
              <td className="px-3 py-2">{r.label}</td>
              <td className={`num px-3 py-2 text-right font-mono ${r.sign < 0 ? "text-[color:var(--color-negative)]" : ""}`}>
                {r.sign < 0 ? "-" : ""}{formatPYG(r.value)}
              </td>
            </tr>
          ))}
          <tr className="border-t bg-muted/60">
            <td className="px-3 py-2 font-semibold">Patrimonio Neto</td>
            <td className="num px-3 py-2 text-right font-mono text-base font-semibold text-[color:var(--color-positive)]">{formatPYG(t.net)}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
