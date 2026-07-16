import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, EXTERNAL_ORIGIN, type ProgrammedSaving } from "@/lib/store";
import { formatPYG, formatPct, formatDate } from "@/lib/format";
import { savingSchedule } from "@/lib/finance-math";
import { useState } from "react";
import { Pencil, Trash2, Plus, PiggyBank, Pause, Play } from "lucide-react";
import { ProgrammedSavingDialog } from "@/components/forms/programmed-saving-dialog";
import { ConfirmDelete } from "@/components/forms/confirm-delete";

export const Route = createFileRoute("/portafolio/ahorros")({ component: Ahorros });

const freqLabel: Record<string, string> = { weekly: "semanal", biweekly: "quincenal", monthly: "mensual" };

function Ahorros() {
  const savings = useStore((s) => s.programmedSavings);
  const deleteSaving = useStore((s) => s.deleteProgrammedSaving);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProgrammedSaving | null>(null);
  const [toDelete, setToDelete] = useState<ProgrammedSaving | null>(null);

  const totalAportado = savings.reduce((a, s) => a + savingSchedule(s).aportado, 0);
  const totalMeta = savings.reduce((a, s) => a + savingSchedule(s).meta, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="num text-xs text-muted-foreground">
          Aportado: <span className="font-mono font-medium">{formatPYG(totalAportado)}</span>
          {totalMeta > 0 && <> de <span className="font-mono">{formatPYG(totalMeta)}</span></>}
        </p>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo ahorro
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {savings.map((s) => (
          <SavingCard
            key={s.id} saving={s}
            onEdit={() => { setEditing(s); setOpen(true); }}
            onDelete={() => setToDelete(s)}
          />
        ))}
        {savings.length === 0 && (
          <Card><CardContent className="p-6 text-center text-xs text-muted-foreground">
            Sin ahorros programados. Creá uno para empezar a acumular con interés fijo.
          </CardContent></Card>
        )}
      </div>

      <ProgrammedSavingDialog open={open} onOpenChange={setOpen} saving={editing} />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="¿Eliminar ahorro programado?"
        description={toDelete ? `${toDelete.name}. No revierte los depósitos ya registrados.` : undefined}
        onConfirm={() => { if (toDelete) deleteSaving(toDelete.id); setToDelete(null); }}
      />
    </div>
  );
}

function SavingCard({ saving, onEdit, onDelete }: { saving: ProgrammedSaving; onEdit: () => void; onDelete: () => void }) {
  const accounts = useStore((s) => s.accounts);
  const update = useStore((s) => s.updateProgrammedSaving);

  const sch = savingSchedule(saving);
  const src = accounts.find((a) => a.id === saving.sourceAccountId);
  const external = saving.sourceAccountId === EXTERNAL_ORIGIN || !src;
  const pct = sch.meta > 0 ? Math.min(100, (sch.aportado / sch.meta) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
          {saving.name}
          {!saving.active && <Badge variant="outline" className="text-[9px]">pausado</Badge>}
        </CardTitle>
        <div className="flex">
          <Button size="icon" variant="ghost" className="h-7 w-7" title={saving.active ? "Pausar" : "Activar"}
            onClick={() => update(saving.id, { active: !saving.active })}>
            {saving.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <Stat label="Aportado" value={formatPYG(sch.aportado)} />
          <Stat label="A vencer" value={formatPYG(sch.pending)} />
          <Stat label="Meta" value={formatPYG(sch.meta)} bold />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>{sch.elapsed}/{saving.termPeriods} cuotas · {formatDate(saving.startDate)} → {formatDate(sch.endDate)}</span>
            <span className="num font-mono">{formatPct(pct)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-[color:var(--color-positive)]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded border bg-muted/30 p-2 text-xs">
          <span className="text-muted-foreground">Estimado a recibir (con interés)</span>
          <span className="num font-mono font-medium text-[color:var(--color-positive)]">{formatPYG(sch.estimadoConInteres)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <Badge variant="secondary" className="text-[9px]">{formatPYG(saving.amountPYG)} · {freqLabel[saving.frequency]}</Badge>
          <Badge variant="outline" className="text-[9px]">TNA {formatPct(saving.tna)}</Badge>
          <span>{external ? "capital previo" : `desde ${src?.name}`}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="rounded border bg-muted/40 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`num font-mono ${bold ? "font-semibold" : ""}`}>{value}</div>
    </div>
  );
}
