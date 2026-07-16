import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatPYG } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function InstallmentPlanDialog({ open, onOpenChange }: Props) {
  const cards = useStore((s) => s.cards);
  const accounts = useStore((s) => s.accounts);
  const addInstallmentPlan = useStore((s) => s.addInstallmentPlan);

  const [concept, setConcept] = useState("");
  const [origin, setOrigin] = useState("");   // "card:<id>" | "acct:<id>"
  const [cuota, setCuota] = useState("");
  const [current, setCurrent] = useState("1");
  const [of, setOf] = useState("12");
  const [firstDue, setFirstDue] = useState(localToday());

  useEffect(() => {
    if (!open) return;
    setConcept(""); setCuota(""); setCurrent("1"); setOf("12"); setFirstDue(localToday());
    setOrigin(cards[0] ? `card:${cards[0].id}` : accounts[0] ? `acct:${accounts[0].id}` : "");
  }, [open, cards, accounts]);

  const nCurrent = Math.min(Number(of) || 1, Math.max(1, Number(current) || 1));
  const remaining = Math.max(1, (Number(of) || 1) - nCurrent + 1);
  const outstanding = (Number(cuota) || 0) * remaining;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !Number(cuota) || !origin) return;
    const [kind, id] = origin.split(":");
    addInstallmentPlan({
      concept,
      cardId: kind === "card" ? id : undefined,
      accountId: kind === "acct" ? id : undefined,
      cuotaAmount: Number(cuota),
      current: nCurrent,
      of: Number(of) || 1,
      firstDueDate: new Date(`${firstDue}T12:00:00`).toISOString(),
    });
    onOpenChange(false);
  };

  const hasOrigins = cards.length > 0 || accounts.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cargar cuotas existentes</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-wider">Concepto</Label>
            <Input value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej. Heladera Cuotas" />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider">Tarjeta o cuenta</Label>
            {hasOrigins ? (
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger><SelectValue placeholder="Elegir origen" /></SelectTrigger>
                <SelectContent>
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={`card:${c.id}`}>Tarjeta · {c.name}</SelectItem>
                  ))}
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={`acct:${a.id}`}>Cuenta · {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-[11px] text-muted-foreground">Creá primero una tarjeta o cuenta en Cuentas.</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Cuota (PYG)</Label>
              <MoneyInput className="num font-mono" value={cuota} onValueChange={setCuota} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Próx. cuota</Label>
              <Input type="number" min="1" className="num font-mono" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">De (total)</Label>
              <Input type="number" min="1" className="num font-mono" value={of} onChange={(e) => setOf(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider">Vencimiento de la próxima cuota</Label>
            <Input type="date" value={firstDue} onChange={(e) => setFirstDue(e.target.value)} />
          </div>

          {Number(cuota) > 0 && (
            <div className="rounded border bg-muted/40 p-3 text-[11px] text-muted-foreground">
              Se cargarán las cuotas <span className="font-medium text-foreground">{nCurrent} a {Number(of) || 1}</span>{" "}
              ({remaining} pendientes) por <span className="num font-mono text-foreground">{formatPYG(outstanding)}</span> en total.
              No modifica saldos: esta deuda ya está incluida en el saldo actual que cargaste. Al pagar cada cuota se descuenta.
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!concept || !Number(cuota) || !origin}>Cargar cuotas</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
