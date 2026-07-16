import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStore, type CreditCard } from "@/lib/store";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  card?: CreditCard | null;
};

export function CardDialog({ open, onOpenChange, card }: Props) {
  const addCard = useStore((s) => s.addCard);
  const updateCard = useStore((s) => s.updateCard);

  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [balance, setBalance] = useState("0");
  const [closingDay, setClosingDay] = useState("20");
  const [dueDay, setDueDay] = useState("5");
  const [tna, setTna] = useState("72");
  const [minPct, setMinPct] = useState("10");

  useEffect(() => {
    if (!open) return;
    if (card) {
      setName(card.name);
      setLimit(String(card.limitPYG));
      setBalance(String(card.balancePYG));
      setClosingDay(String(card.closingDay));
      setDueDay(String(card.dueDay));
      setTna(String(card.tna));
      setMinPct(String(card.minPaymentPct));
    } else {
      setName(""); setLimit(""); setBalance("0"); setClosingDay("20");
      setDueDay("5"); setTna("72"); setMinPct("10");
    }
  }, [open, card]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !Number(limit)) return;
    const payload = {
      name,
      limitPYG: Number(limit),
      balancePYG: Number(balance) || 0,
      closingDay: Math.min(31, Math.max(1, Number(closingDay) || 1)),
      dueDay: Math.min(31, Math.max(1, Number(dueDay) || 1)),
      tna: Number(tna) || 0,
      minPaymentPct: Number(minPct) || 0,
    };
    if (card) updateCard(card.id, payload);
    else addCard(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{card ? "Editar tarjeta" : "Nueva tarjeta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-wider">Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Visa Itaú Platinum" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Límite (PYG)</Label>
              <MoneyInput className="num font-mono" value={limit} onValueChange={setLimit} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Deuda actual (PYG)</Label>
              <MoneyInput className="num font-mono" value={balance} onValueChange={setBalance} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Día de cierre</Label>
              <Input type="number" min="1" max="31" className="num font-mono" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Día de vencimiento</Label>
              <Input type="number" min="1" max="31" className="num font-mono" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">TNA %</Label>
              <Input type="number" step="0.01" className="num font-mono" value={tna} onChange={(e) => setTna(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Pago mínimo %</Label>
              <Input type="number" step="0.01" className="num font-mono" value={minPct} onChange={(e) => setMinPct(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{card ? "Guardar cambios" : "Crear"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
