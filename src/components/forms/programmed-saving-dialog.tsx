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
import { addPeriods, periodsBetween, savingSchedule } from "@/lib/finance-math";
import { formatPYG, formatDate } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  saving?: ProgrammedSaving | null;
};

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function ymdToISO(s: string) {
  return new Date(`${s}T12:00:00`).toISOString();
}

// Fill in whichever of {inicio, plazo, fin} was left blank from the other two.
function triangulate(startStr: string, termStr: string, endStr: string, freq: ScheduledFrequency) {
  const hasStart = !!startStr;
  const hasTerm = Number(termStr) > 0;
  const hasEnd = !!endStr;
  const filled = [hasStart, hasTerm, hasEnd].filter(Boolean).length;
  let start = startStr, term = termStr, end = endStr;
  let computed: "start" | "term" | "end" | null = null;
  if (filled === 2) {
    if (!hasEnd) {
      end = toYMD(addPeriods(ymdToISO(startStr), freq, Number(termStr)));
      computed = "end";
    } else if (!hasStart) {
      start = toYMD(addPeriods(ymdToISO(endStr), freq, -Number(termStr)));
      computed = "start";
    } else if (!hasTerm) {
      term = String(periodsBetween(ymdToISO(startStr), ymdToISO(endStr), freq));
      computed = "term";
    }
  }
  return { start, term, end, computed };
}

export function ProgrammedSavingDialog({ open, onOpenChange, saving }: Props) {
  const addProgrammedSaving = useStore((s) => s.addProgrammedSaving);
  const updateProgrammedSaving = useStore((s) => s.updateProgrammedSaving);
  const accounts = useStore((s) => s.accounts);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<ScheduledFrequency>("monthly");
  const [tna, setTna] = useState("0");
  const [startStr, setStartStr] = useState("");
  const [termStr, setTermStr] = useState("");
  const [endStr, setEndStr] = useState("");
  const [opening, setOpening] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (saving) {
      setName(saving.name);
      setAmount(String(saving.amountPYG));
      setFrequency(saving.frequency);
      setTna(String(saving.tna));
      setStartStr(toYMD(new Date(saving.startDate)));
      setTermStr(String(saving.termPeriods));
      setEndStr(""); // recomputed from inicio + plazo
      setOpening(saving.openingPYG ? String(saving.openingPYG) : "");
      setSourceAccountId(saving.sourceAccountId || EXTERNAL_ORIGIN);
    } else {
      setName(""); setAmount(""); setFrequency("monthly"); setTna("0");
      // All three blank so the user can type in any two (incl. inicio + fin);
      // the remaining box auto-computes and locks only once two are filled.
      setStartStr(""); setTermStr(""); setEndStr("");
      setOpening("");
      setSourceAccountId(accounts[0]?.id ?? EXTERNAL_ORIGIN);
    }
  }, [open, saving, accounts]);

  // Fill the blank box (inicio / plazo / fin) from the other two.
  const tri = triangulate(startStr, termStr, endStr, frequency);
  const startISO = tri.start ? ymdToISO(tri.start) : "";
  const term = Number(tri.term) || 0;

  const valid = !!name && Number(amount) > 0 && !!startISO && term > 0 && !!tri.end && !!sourceAccountId;

  const sched = valid
    ? savingSchedule({ amountPYG: Number(amount), frequency, termPeriods: term, startDate: startISO, tna: Number(tna) || 0, openingPYG: Number(opening) || 0 })
    : null;

  const isExternal = sourceAccountId === EXTERNAL_ORIGIN;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const base = {
      name,
      sourceAccountId,
      amountPYG: Number(amount),
      frequency,
      tna: Number(tna) || 0,
      termPeriods: term,
      startDate: startISO,
      openingPYG: Number(opening) || 0,
      active: saving ? saving.active : true,
    };
    if (saving) updateProgrammedSaving(saving.id, base);
    else addProgrammedSaving(base);
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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Entrega 20" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Cuota (PYG)</Label>
              <MoneyInput className="num font-mono" value={amount} onValueChange={setAmount} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Frecuencia</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as ScheduledFrequency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quincenal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider">Fechas y plazo</Label>
            <p className="mb-1 text-[11px] text-muted-foreground">
              Completá dos y dejá en blanco el que no sepas: se calcula solo.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Inicio</Label>
                <Input
                  type="date"
                  value={tri.start}
                  disabled={tri.computed === "start"}
                  onChange={(e) => setStartStr(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Plazo (cuotas)</Label>
                <Input
                  type="number"
                  min="1"
                  className="num font-mono"
                  value={tri.term}
                  disabled={tri.computed === "term"}
                  onChange={(e) => setTermStr(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fin</Label>
                <Input
                  type="date"
                  value={tri.end}
                  disabled={tri.computed === "end"}
                  onChange={(e) => setEndStr(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">TNA %</Label>
              <Input type="number" step="0.01" className="num font-mono" value={tna} onChange={(e) => setTna(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Aporte previo (opcional)</Label>
              <MoneyInput className="num font-mono" value={opening} onValueChange={setOpening} placeholder="0" />
            </div>
          </div>

          {sched && (
            <div className="space-y-1 rounded border bg-muted/40 p-3 text-[11px] text-muted-foreground">
              <div className="flex justify-between">
                <span>Meta (cuota × plazo)</span>
                <span className="num font-mono font-medium text-foreground">{formatPYG(sched.meta)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimado a recibir (con interés)</span>
                <span className="num font-mono text-[color:var(--color-positive)]">{formatPYG(sched.estimadoConInteres)}</span>
              </div>
              <div className="flex justify-between">
                <span>Plazo · Inicio → Fin</span>
                <span className="font-mono text-foreground">{term}c · {formatDate(startISO)} → {formatDate(sched.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ya aportado ({sched.elapsed} vencidas{Number(opening) > 0 ? " + previo" : ""})</span>
                <span className="num font-mono text-foreground">{formatPYG(sched.aportado)}</span>
              </div>
            </div>
          )}

          <div className="rounded border bg-muted/40 p-3">
            <Label className="text-xs uppercase tracking-wider">Origen de los depósitos a vencer</Label>
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
                ? "Las cuotas a vencer no descuentan de ninguna cuenta (lo fondeás por fuera)."
                : "Cada cuota que venza se descontará de esta cuenta. Las cuotas ya vencidas no se descuentan."}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!valid}>{saving ? "Guardar cambios" : "Crear"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
