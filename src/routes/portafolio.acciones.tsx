import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore, type StockPosition } from "@/lib/store";
import { formatPYG, formatUSD, formatPct } from "@/lib/format";
import { fetchStockPrice } from "@/lib/finnhub";
import { RefreshCw, Pencil, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { StockDialog } from "@/components/forms/position-dialog";
import { ConfirmDelete } from "@/components/forms/confirm-delete";

export const Route = createFileRoute("/portafolio/acciones")({ component: Acciones });

function Acciones() {
  const stocks = useStore((s) => s.stocks);
  const updateStockPrice = useStore((s) => s.updateStockPrice);
  const deleteStock = useStore((s) => s.deleteStock);
  const rate = useStore((s) => s.exchangeRate);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StockPosition | null>(null);
  const [toDelete, setToDelete] = useState<StockPosition | null>(null);

  const refresh = async () => {
    setLoading(true);
    await Promise.all(stocks.map(async (s) => {
      const p = await fetchStockPrice(s.symbol, s.currentPriceUSD);
      updateStockPrice(s.id, p);
    }));
    setLoading(false);
  };

  const totalValueUSD = stocks.reduce((a, s) => a + s.qty * s.currentPriceUSD, 0);
  const totalCostUSD = stocks.reduce((a, s) => a + s.qty * s.avgPriceUSD, 0);
  const pnlUSD = totalValueUSD - totalCostUSD;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm font-medium">Acciones EE.UU.</CardTitle>
          <p className="num mt-1 text-xs text-muted-foreground">
            Total: <span className="font-mono">{formatUSD(totalValueUSD)}</span> ≈ {formatPYG(totalValueUSD * rate)} · P&L{" "}
            <span className={`font-mono ${pnlUSD >= 0 ? "text-[color:var(--color-positive)]" : "text-[color:var(--color-negative)]"}`}>
              {pnlUSD >= 0 ? "+" : ""}{formatUSD(pnlUSD)}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refrescar (mock)
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="mr-2 h-3.5 w-3.5" /> Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Símbolo</th>
              <th className="px-3 py-2 text-right font-medium">Cant.</th>
              <th className="px-3 py-2 text-right font-medium">Prom.</th>
              <th className="px-3 py-2 text-right font-medium">Actual</th>
              <th className="px-3 py-2 text-right font-medium">Valor USD</th>
              <th className="px-3 py-2 text-right font-medium">Valor PYG</th>
              <th className="px-3 py-2 text-right font-medium">P&L</th>
              <th className="px-3 py-2 text-right font-medium">P&L %</th>
              <th className="px-3 py-2 text-right font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => {
              const value = s.qty * s.currentPriceUSD;
              const cost = s.qty * s.avgPriceUSD;
              const pnl = value - cost;
              const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
              return (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-mono font-semibold">{s.symbol}</div>
                    <div className="text-[11px] text-muted-foreground">{s.name}</div>
                  </td>
                  <td className="num px-3 py-2 text-right font-mono">{s.qty}</td>
                  <td className="num px-3 py-2 text-right font-mono text-muted-foreground">{formatUSD(s.avgPriceUSD)}</td>
                  <td className="num px-3 py-2 text-right font-mono">{formatUSD(s.currentPriceUSD)}</td>
                  <td className="num px-3 py-2 text-right font-mono">{formatUSD(value)}</td>
                  <td className="num px-3 py-2 text-right font-mono text-muted-foreground">{formatPYG(value * rate)}</td>
                  <td className={`num px-3 py-2 text-right font-mono ${pnl >= 0 ? "text-[color:var(--color-positive)]" : "text-[color:var(--color-negative)]"}`}>
                    {pnl >= 0 ? "+" : ""}{formatUSD(pnl)}
                  </td>
                  <td className={`num px-3 py-2 text-right font-mono ${pnl >= 0 ? "text-[color:var(--color-positive)]" : "text-[color:var(--color-negative)]"}`}>
                    {pnl >= 0 ? "+" : ""}{formatPct(pnlPct)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(s); setOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setToDelete(s)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {stocks.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-xs text-muted-foreground">Sin posiciones. Agregá tu primera acción.</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>

      <StockDialog open={open} onOpenChange={setOpen} position={editing} />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="¿Eliminar posición?"
        description={toDelete ? `${toDelete.symbol} - ${toDelete.qty} unidades.` : undefined}
        onConfirm={() => { if (toDelete) deleteStock(toDelete.id); setToDelete(null); }}
      />
    </Card>
  );
}
