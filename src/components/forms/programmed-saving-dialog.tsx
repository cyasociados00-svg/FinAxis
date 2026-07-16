import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, EXTERNAL_ORIGIN, type ProgrammedSaving, type ScheduledFrequency } from "@/lib/store";
import { savingsProjection } from "@/lib/finance-math";
import { formatPYG } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  saving?: ProgrammedSaving | null;
};

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addPeriod(dateStr: string, freq: ScheduledFrequency) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (freq === "weekly") d.setDate(d.getDate() + 7);
  else if (freq === "biweekly") d.setDate(d.getDate() + 14);
  else d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ProgrammedSavingDialog({ open, onOpenChange, saving }: Props) {
  const addProgrammedSaving = useStore((s) => s.addProgrammedSaving);
  const updateProgrammedSaving = useStore((s) => s.updateProgrammedSaving);
  const accounts = useStore((s) => s.accounts);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<ScheduledFrequency>("monthly");
  const [tna, setTna] = useState("0");
  const [term, setTerm] = useState("");
  const [opening, setOpening] = useState("");
  const [goal, setGoal] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [nextRun, setNextRun] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (saving) {
      setName(saving.name);
      setAmount(String(saving.amountPYG));
      setFrequency(saving.frequency);
      setTna(String(saving.tna));
      setTerm(saving.termPeriods ? String(saving.termPeriods) : "");
      setOpening("");
      setGoal(saving.goalPYG ? String(saving.goalPYG) : "");
      setGoalDate(saving.goalDate ? saving.goalDate.slice(0, 10) : "");
      setNextRun(saving.nextRun.slice(0, 10));
      setSourceAccountId(saving.sourceAccountId || EXTERNAL_ORIGIN);
    } else {
      const today = localToday();
      setName(""); setAmount(""); setFrequency("monthly"); setTna("0");
      setTerm(""); setOpening(""); setGoal(""); setGoalDate("");
      setNextRun(addPeriod(today, "monthly"));
      setSourceAccountId(accounts[0]?.id ?? EXTERNAL_ORIGIN);
    }
  }, [open, saving, accounts]);

  const isExternal = sourceAccountId === EXTERNAL_ORIGIN;

  const est = savingsProjection({
    amount: Number(amount) || 0,
    periods: Number(term) || 0,
    annualRatePct: Number(tna) || 0,
    freq: frequency,
    opening: Number(opening) || 0,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !Number(amount)) return;
    const base = {
      name,
      sourceAccountId,
      amountPYG: Number(amount),
      frequency,
      tna: Number(tna) || 0,
      termPeriods: Number(term) || 0,
      goalPYG: Number(goal) || 0,
      goalDate: goalDate ? new Date(`${goalDate}T12:00:00`).toISOString() : undefined,
      nextRun: new Date(`${nextRun || localToday()}T12:00:00`).toISOString(),
      active: saving ? saving.active : true,
    };
    if (saving) {
      updateProgrammedSaving(saving.id, base);
    } else {
      addProgrammedSaving({ ...base, openingPYG: Number(opening) || 0 });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{saving ? "Editar ahorro programado" : "Nuevo ahorro programado"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-wider">Nombre del plan</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Ahorro casa" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Cuota (PYG)</Label>
              <MoneyInput className="num font-mono" value={amount} onValueChange={setAmount} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Frecuencia</Label>
              <Select value={frequency} onValueChange={(v) => {
                const f = v as ScheduledFrequency;
                setFrequency(f);
                if (!saving) setNextRun(addPeriod(localToday(), f));
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quincenal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">TNA %</Label>
              <Input type="number" step="0.01" className="num font-mono" value={tna} onChange={(e) => setTna(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Plazo (cuotas)</Label>
              <Input type="number" min="0" className="num font-mono" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="18" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Próx. depósito</Label>
              <Input type="date" value={nextRun} onChange={(e) => setNextRun(e.target.value)} />
            </div>
          </div>

          {Number(term) > 0 && Number(amount) > 0 && (
            <div className="grid grid-cols-2 gap-2 rounded border bg-muted/40 p-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total a depositar</div>
                <div className="num font-mono">{formatPYG(est.deposited)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Estimado a recibir</div>
                <div className="num font-mono font-semibold text-[color:var(--color-positive)]">{formatPYG(est.finalValue)}</div>
              </div>
              <div className="col-span-2 text-[11px] text-muted-foreground">
                Interés estimado +{formatPYG(est.interest)} · aproximado, puede variar según fechas de débito.
              </div>
            </div>
          )}
          {!saving && (
            <div>
              <Label className="text-xs uppercase tracking-wider">Ya acumulado (opcional)</Label>
              <MoneyInput className="num font-mono" value={opening} onValueChange={setOpening} placeholder="0" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Saldo que ya tenías antes de usar la app. No descuenta de ninguna cuenta.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Meta (opcional)</Label>
              <MoneyInput className="num font-mono" value={goal} onValueChange={setGoal} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Fecha meta (opcional)</Label>
              <Input type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} />
            </div>
          </div>
          <div className="rounded border bg-muted/40 p-3">
            <Label className="text-xs uppercase tracking-wider">Origen de los depósitos</Label>
            <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
              <SelectTrigger><SelectValue placeholder="Elegir origen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={EXTERNAL_ORIGIN}>Capital previo (no descuenta)</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.balancePYG.toLocaleString("es-PY")} Gs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {isExternal
                ? "Cada cuota se suma al ahorro sin descontar de ninguna cuenta (lo fondeás por fuera de la app)."
                : "Cada cuota se descontará automáticamente de esta cuenta y se registrará en Registrar (categoría Ahorro)."}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{saving ? "Guardar cambios" : "Crear"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
