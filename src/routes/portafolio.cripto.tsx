import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore, type CryptoPosition } from "@/lib/store";
import { formatPYG, formatUSD, formatPct } from "@/lib/format";
import { fetchCryptoPrices } from "@/lib/coingecko";
import { RefreshCw, Pencil, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { CryptoDialog } from "@/components/forms/position-dialog";
import { ConfirmDelete } from "@/components/forms/confirm-delete";

export const Route = createFileRoute("/portafolio/cripto")({ component: Cripto });

function Cripto() {
  const crypto = useStore((s) => s.crypto);
  const updateCryptoPrice = useStore((s) => s.updateCryptoPrice);
  const deleteCrypto = useStore((s) => s.deleteCrypto);
  const rate = useStore((s) => s.exchangeRate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CryptoPosition | null>(null);
  const [toDelete, setToDelete] = useState<CryptoPosition | null>(null);

  const refresh = async () => {
    setLoading(true); setError(null);
    try {
      const ids = crypto.map((c) => c.coingeckoId);
      const prices = await fetchCryptoPrices(ids);
      crypto.forEach((c) => { if (prices[c.coingeckoId]) updateCryptoPrice(c.id, prices[c.coingeckoId]); });
    } catch (e: any) { setError(e?.message ?? "Error"); }
    finally { setLoading(false); }
  };

  const totalValueUSD = crypto.reduce((a, c) => a + c.qty * c.currentPriceUSD, 0);
  const totalCostUSD = crypto.reduce((a, c) => a + c.qty * c.avgPriceUSD, 0);
  const pnlUSD = totalValueUSD - totalCostUSD;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm font-medium">Cripto</CardTitle>
          <p className="num mt-1 text-xs text-muted-foreground">
            Total: <span className="font-mono">{formatUSD(totalValueUSD)}</span> ≈ {formatPYG(totalValueUSD * rate)} · P&L{" "}
            <span className={`font-mono ${pnlUSD >= 0 ? "text-[color:var(--color-positive)]" : "text-[color:var(--color-negative)]"}`}>
              {pnlUSD >= 0 ? "+" : ""}{formatUSD(pnlUSD)}
            </span>
            {error ? <span className="ml-2 text-[color:var(--color-negative)]">· {error}</span> : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refrescar (CoinGecko)
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
            {crypto.map((c) => {
              const value = c.qty * c.currentPriceUSD;
              const cost = c.qty * c.avgPriceUSD;
              const pnl = value - cost;
              const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
              return (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2 font-mono font-semibold">{c.symbol}</td>
                  <td className="num px-3 py-2 text-right font-mono">{c.qty}</td>
                  <td className="num px-3 py-2 text-right font-mono text-muted-foreground">{formatUSD(c.avgPriceUSD)}</td>
                  <td className="num px-3 py-2 text-right font-mono">{formatUSD(c.currentPriceUSD)}</td>
                  <td className="num px-3 py-2 text-right font-mono">{formatUSD(value)}</td>
                  <td className="num px-3 py-2 text-right font-mono text-muted-foreground">{formatPYG(value * rate)}</td>
                  <td className={`num px-3 py-2 text-right font-mono ${pnl >= 0 ? "text-[color:var(--color-positive)]" : "text-[color:var(--color-negative)]"}`}>
                    {pnl >= 0 ? "+" : ""}{formatUSD(pnl)}
                  </td>
                  <td className={`num px-3 py-2 text-right font-mono ${pnl >= 0 ? "text-[color:var(--color-positive)]" : "text-[color:var(--color-negative)]"}`}>
                    {pnl >= 0 ? "+" : ""}{formatPct(pnlPct)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(c); setOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setToDelete(c)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {crypto.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-xs text-muted-foreground">Sin posiciones cripto.</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>

      <CryptoDialog open={open} onOpenChange={setOpen} position={editing} />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="¿Eliminar posición?"
        description={toDelete ? `${toDelete.symbol} - ${toDelete.qty} unidades.` : undefined}
        onConfirm={() => { if (toDelete) deleteCrypto(toDelete.id); setToDelete(null); }}
      />
    </Card>
  );
}
