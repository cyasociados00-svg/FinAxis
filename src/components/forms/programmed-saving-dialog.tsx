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

type Mode = "start_term" | "end_term" | "start_end";

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function ymdToISO(s: string) {
  return new Date(`${s}T12:00:00`).toISOString();
}

export function ProgrammedSavingDialog({ open, onOpenChange, saving }: Props) {
  const addProgrammedSaving = useStore((s) => s.addProgrammedSaving);
  const updateProgrammedSaving = useStore((s) => s.updateProgrammedSaving);
  const accounts = useStore((s) => s.accounts);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<ScheduledFrequency>("monthly");
  const [tna, setTna] = useState("0");
  const [mode, setMode] = useState<Mode>("start_term");
  const [startStr, setStartStr] = useState("");
  const [endStr, setEndStr] = useState("");
  const [termStr, setTermStr] = useState("");
  const [opening, setOpening] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (saving) {
      setName(saving.name);
      setAmount(String(saving.amountPYG));
      setFrequency(saving.frequency);
      setTna(String(saving.tna));
      setMode("start_term");
      setStartStr(toYMD(new Date(saving.startDate)));
      setTermStr(String(saving.termPeriods));
      setEndStr("");
      setOpening(saving.openingPYG ? String(saving.openingPYG) : "");
      setSourceAccountId(saving.sourceAccountId || EXTERNAL_ORIGIN);
    } else {
      setName(""); setAmount(""); setFrequency("monthly"); setTna("0");
      setMode("start_term");
      setStartStr(toYMD(new Date())); setEndStr(""); setTermStr("12");
      setOpening("");
      setSourceAccountId(accounts[0]?.id ?? EXTERNAL_ORIGIN);
    }
  }, [open, saving, accounts]);

  // Triangulate: resolve startDate (ISO) and termPeriods from the two inputs.
  let startISO = "";
  let term = 0;
  if (mode === "start_term" && startStr && Number(termStr) > 0) {
    startISO = ymdToISO(startStr);
    term = Number(termStr);
  } else if (mode === "end_term" && endStr && Number(termStr) > 0) {
    term = Number(termStr);
    startISO = addPeriods(ymdToISO(endStr), frequency, -term).toISOString();
  } else if (mode === "start_end" && startStr && endStr) {
    startISO = ymdToISO(startStr);
    term = periodsBetween(startISO, ymdToISO(endStr), frequency);
  }

  const valid = !!name && Number(amount) > 0 && !!startISO && term > 0 && !!sourceAccountId;

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
            <Label className="text-xs uppercase tracking-wider">Definir el plan por</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="start_term">Inicio + Plazo → calcula Fin</SelectItem>
                <SelectItem value="end_term">Fin + Plazo → calcula Inicio</SelectItem>
                <SelectItem value="start_end">Inicio + Fin → calcula Plazo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(mode === "start_term" || mode === "start_end") && (
              <div>
                <Label className="text-xs uppercase tracking-wider">Fecha de inicio</Label>
                <Input type="date" value={startStr} onChange={(e) => setStartStr(e.target.value)} />
              </div>
            )}
            {(mode === "end_term" || mode === "start_end") && (
              <div>
                <Label className="text-xs uppercase tracking-wider">Fecha de fin</Label>
                <Input type="date" value={endStr} onChange={(e) => setEndStr(e.target.value)} />
              </div>
            )}
            {(mode === "start_term" || mode === "end_term") && (
              <div>
                <Label className="text-xs uppercase tracking-wider">Plazo (cuotas)</Label>
                <Input type="number" min="1" className="num font-mono" value={termStr} onChange={(e) => setTermStr(e.target.value)} />
              </div>
            )}
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
