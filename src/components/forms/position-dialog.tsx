import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, purchaseFromAccount, type StockPosition, type CryptoPosition } from "@/lib/store";

function AccountPicker({
  accountId, setAccountId, hint,
}: { accountId: string; setAccountId: (v: string) => void; hint: string }) {
  const accounts = useStore((s) => s.accounts);
  if (accounts.length === 0) {
    return (
      <div className="rounded border bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
        No hay cuentas. Creá una desde Tesorería para poder descontar el costo de la compra.
      </div>
    );
  }
  return (
    <div className="rounded border bg-muted/40 p-3">
      <Label className="text-xs uppercase tracking-wider">Cuenta de origen (pago)</Label>
      <Select value={accountId} onValueChange={setAccountId}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name} ({a.balancePYG.toLocaleString("es-PY")} Gs)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

type StockProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  position?: StockPosition | null;
};

export function StockDialog({ open, onOpenChange, position }: StockProps) {
  const buyStock = useStore((s) => s.buyStock);
  const updateStock = useStore((s) => s.updateStock);
  const accounts = useStore((s) => s.accounts);
  const stocks = useStore((s) => s.stocks);
  const rate = useStore((s) => s.exchangeRate);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [avg, setAvg] = useState("");
  const [current, setCurrent] = useState("");
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (position) {
      setSymbol(position.symbol); setName(position.name);
      setQty(String(position.qty)); setAvg(String(position.avgPriceUSD));
      setCurrent(String(position.currentPriceUSD));
    } else {
      setSymbol(""); setName(""); setQty(""); setAvg(""); setCurrent("");
      setAccountId(accounts[0]?.id ?? "");
    }
  }, [open, position, accounts]);

  const costPYG = Number(qty) * Number(avg) * rate;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !Number(qty)) return;
    const payload = {
      symbol: symbol.toUpperCase(),
      name: name || symbol.toUpperCase(),
      qty: Number(qty),
      avgPriceUSD: Number(avg) || 0,
      currentPriceUSD: Number(current) || Number(avg) || 0,
    };
    if (position) {
      updateStock(position.id, payload);
    } else {
      buyStock(payload);
      if (accountId && costPYG > 0) {
        const acc = accounts.find((a) => a.id === accountId);
        purchaseFromAccount({
          accountId,
          method: acc?.kind ?? "debit",
          amountPYG: Math.round(costPYG),
          concept: `Compra ${payload.symbol} x${payload.qty}`,
        });
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{position ? "Editar acción" : "Agregar acción"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Símbolo</Label>
              <Input className="font-mono" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="NVDA" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="NVIDIA" />
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider">Cantidad</Label>
            <Input type="number" step="0.0001" className="num font-mono" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Precio promedio (USD)</Label>
              <Input type="number" step="0.01" className="num font-mono" value={avg} onChange={(e) => setAvg(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Precio actual (USD)</Label>
              <Input type="number" step="0.01" className="num font-mono" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
          </div>
          {!position && symbol && stocks.some((p) => p.symbol.toUpperCase() === symbol.toUpperCase()) && (
            <div className="rounded border border-emerald-500/30 bg-emerald-50 p-2 text-[11px] text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
              Ya tenés <strong>{symbol.toUpperCase()}</strong>. Esta compra se sumará a la posición existente y se recalculará el precio promedio.
            </div>
          )}
          {!position && (
            <AccountPicker
              accountId={accountId}
              setAccountId={setAccountId}
              hint={costPYG > 0 ? `Se descontarán ${costPYG.toLocaleString("es-PY", { maximumFractionDigits: 0 })} Gs y se registrará en Registrar (categoría Inversión).` : "Ingresá cantidad y precio para calcular el costo."}
            />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{position ? "Guardar" : "Agregar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type CryptoProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  position?: CryptoPosition | null;
};

const COINGECKO_PRESETS = [
  { id: "bitcoin", symbol: "BTC" },
  { id: "ethereum", symbol: "ETH" },
  { id: "solana", symbol: "SOL" },
  { id: "tether", symbol: "USDT" },
  { id: "usd-coin", symbol: "USDC" },
  { id: "binancecoin", symbol: "BNB" },
];

export function CryptoDialog({ open, onOpenChange, position }: CryptoProps) {
  const buyCrypto = useStore((s) => s.buyCrypto);
  const updateCrypto = useStore((s) => s.updateCrypto);
  const accounts = useStore((s) => s.accounts);
  const crypto = useStore((s) => s.crypto);
  const rate = useStore((s) => s.exchangeRate);
  const [symbol, setSymbol] = useState("");
  const [coingeckoId, setCoingeckoId] = useState("");
  const [qty, setQty] = useState("");
  const [avg, setAvg] = useState("");
  const [current, setCurrent] = useState("");
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (position) {
      setSymbol(position.symbol); setCoingeckoId(position.coingeckoId);
      setQty(String(position.qty)); setAvg(String(position.avgPriceUSD));
      setCurrent(String(position.currentPriceUSD));
    } else {
      setSymbol(""); setCoingeckoId(""); setQty(""); setAvg(""); setCurrent("");
      setAccountId(accounts[0]?.id ?? "");
    }
  }, [open, position, accounts]);

  const costPYG = Number(qty) * Number(avg) * rate;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !coingeckoId || !Number(qty)) return;
    const payload = {
      symbol: symbol.toUpperCase(),
      coingeckoId,
      qty: Number(qty),
      avgPriceUSD: Number(avg) || 0,
      currentPriceUSD: Number(current) || Number(avg) || 0,
    };
    if (position) {
      updateCrypto(position.id, payload);
    } else {
      buyCrypto(payload);
      if (accountId && costPYG > 0) {
        const acc = accounts.find((a) => a.id === accountId);
        purchaseFromAccount({
          accountId,
          method: acc?.kind ?? "debit",
          amountPYG: Math.round(costPYG),
          concept: `Compra ${payload.symbol} x${payload.qty}`,
        });
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{position ? "Editar cripto" : "Agregar cripto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Símbolo</Label>
              <Input className="font-mono" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="BTC" list="preset-symbols" />
              <datalist id="preset-symbols">
                {COINGECKO_PRESETS.map((p) => <option key={p.id} value={p.symbol} />)}
              </datalist>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">CoinGecko ID</Label>
              <Input className="font-mono" value={coingeckoId} onChange={(e) => setCoingeckoId(e.target.value)} placeholder="bitcoin" list="preset-ids" />
              <datalist id="preset-ids">
                {COINGECKO_PRESETS.map((p) => <option key={p.id} value={p.id} />)}
              </datalist>
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider">Cantidad</Label>
            <Input type="number" step="0.00000001" className="num font-mono" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Precio promedio (USD)</Label>
              <Input type="number" step="0.01" className="num font-mono" value={avg} onChange={(e) => setAvg(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Precio actual (USD)</Label>
              <Input type="number" step="0.01" className="num font-mono" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
          </div>
          {!position && coingeckoId && crypto.some((p) => p.coingeckoId.toLowerCase() === coingeckoId.toLowerCase()) && (
            <div className="rounded border border-emerald-500/30 bg-emerald-50 p-2 text-[11px] text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
              Ya tenés <strong>{symbol.toUpperCase() || coingeckoId}</strong>. Esta compra se sumará a la posición existente y se recalculará el precio promedio.
            </div>
          )}
          {!position && (
            <AccountPicker
              accountId={accountId}
              setAccountId={setAccountId}
              hint={costPYG > 0 ? `Se descontarán ${costPYG.toLocaleString("es-PY", { maximumFractionDigits: 0 })} Gs y se registrará en Registrar.` : "Ingresá cantidad y precio para calcular el costo."}
            />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{position ? "Guardar" : "Agregar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
