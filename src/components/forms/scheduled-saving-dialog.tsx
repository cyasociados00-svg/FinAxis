import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useStore, computeFirstRun,
  type ScheduledFrequency, type ScheduledSaving,
} from "@/lib/store";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  targetType: "fund" | "cda";
  targetId: string;
  targetLabel: string;
  saving?: ScheduledSaving | null;
};

export function ScheduledSavingDialog({
  open, onOpenChange, targetType, targetId, targetLabel, saving,
}: Props) {
  const accounts = useStore((s) => s.accounts);
  const add = useStore((s) => s.addScheduledSaving);
  const update = useStore((s) => s.updateScheduledSaving);
  const remove = useStore((s) => s.deleteScheduledSaving);

  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<ScheduledFrequency>("monthly");
  const [day, setDay] = useState("5");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (saving) {
      setAccountId(saving.accountId);
      setAmount(String(saving.amountPYG));
      setFrequency(saving.frequency);
      setDay(String(new Date(saving.nextRun).getDate()));
      setActive(saving.active);
    } else {
      setAccountId(accounts[0]?.id ?? "");
      setAmount("");
      setFrequency("monthly");
      setDay("5");
      setActive(true);
    }
  }, [open, saving, accounts]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!accountId || !amt) return;
    const nextRun = saving ? saving.nextRun : computeFirstRun(Number(day) || 1);
    if (saving) {
      update(saving.id, { accountId, amountPYG: amt, frequency, active });
    } else {
      add({ targetType, targetId, accountId, amountPYG: amt, frequency, nextRun, active });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {saving ? "Editar ahorro programado" : "Programar ahorro"} · {targetLabel}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {accounts.length === 0 && (
            <div className="rounded border bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              No hay cuentas. Creá una en Tesorería.
            </div>
          )}
          <div>
            <Label className="text-xs uppercase tracking-wider">Cuenta de débito</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Elegir cuenta" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.balancePYG.toLocaleString("es-PY")} Gs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Monto (PYG)</Label>
              <Input type="number" className="num font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
          {!saving && (
            <div>
              <Label className="text-xs uppercase tracking-wider">Día de débito (1-28)</Label>
              <Input type="number" min="1" max="28" className="num font-mono" value={day} onChange={(e) => setDay(e.target.value)} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Próximo débito se calcula automáticamente desde hoy.
              </p>
            </div>
          )}
          {saving && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Activo (pausá para detener débitos)
            </label>
          )}
          <DialogFooter className="gap-2">
            {saving && (
              <Button
                type="button"
                variant="ghost"
                className="mr-auto text-[color:var(--color-negative)]"
                onClick={() => { remove(saving.id); onOpenChange(false); }}
              >
                Eliminar
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{saving ? "Guardar" : "Programar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
