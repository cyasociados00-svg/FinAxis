import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, type Account } from "@/lib/store";
import { formatPYG } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account?: Account | null;
};

export function AccountDialog({ open, onOpenChange, account }: Props) {
  const addAccount = useStore((s) => s.addAccount);
  const updateAccount = useStore((s) => s.updateAccount);
  const rate = useStore((s) => s.exchangeRate);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<"cash" | "debit">("debit");
  const [currency, setCurrency] = useState<"PYG" | "USD">("PYG");
  const [balance, setBalance] = useState("0");   // PYG amount
  const [balanceUsd, setBalanceUsd] = useState("0");

  useEffect(() => {
    if (!open) return;
    if (account) {
      setName(account.name);
      setKind(account.kind);
      setCurrency(account.currency ?? "PYG");
      setBalance(String(account.balancePYG));
      setBalanceUsd(account.balanceUSD != null ? String(account.balanceUSD) : "0");
    } else {
      setName("");
      setKind("debit");
      setCurrency("PYG");
      setBalance("0");
      setBalanceUsd("0");
    }
  }, [open, account]);

  const isUSD = currency === "USD";
  const equivalentPYG = (Number(balanceUsd) || 0) * rate;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = isUSD
      ? { name: name.trim(), kind, currency, balanceUSD: Number(balanceUsd) || 0, balancePYG: equivalentPYG }
      : { name: name.trim(), kind, currency, balancePYG: Number(balance) || 0, balanceUSD: undefined };
    if (account) updateAccount(account.id, payload);
    else addAccount(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? "Editar cuenta" : "Nueva cuenta a la vista"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-wider">Nombre del banco / cuenta</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Itaú Cta. Cte. PYG" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Tipo</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as "cash" | "debit")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Cuenta bancaria (Débito)</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Moneda</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as "PYG" | "USD")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PYG">Guaraníes (PYG)</SelectItem>
                  <SelectItem value="USD">Dólares (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isUSD ? (
            <div className="rounded border bg-muted/40 p-3">
              <Label className="text-xs uppercase tracking-wider">Monto disponible (USD)</Label>
              <Input
                type="number"
                step="0.01"
                className="num font-mono"
                value={balanceUsd}
                onChange={(e) => setBalanceUsd(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Equivalente hoy: <span className="num font-mono text-foreground">{formatPYG(equivalentPYG)}</span>{" "}
                (TC {rate.toLocaleString("es-PY")} Gs/US$). Se recalcula solo cuando cambia el tipo de cambio.
              </p>
            </div>
          ) : (
            <div>
              <Label className="text-xs uppercase tracking-wider">Monto disponible (PYG)</Label>
              <MoneyInput className="num font-mono" value={balance} onValueChange={setBalance} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{account ? "Guardar cambios" : "Crear"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
