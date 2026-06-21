import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, type CDA, type ScheduledSaving } from "@/lib/store";
import { formatPYG, formatPct, formatDate } from "@/lib/format";
import { cdaAccrual } from "@/lib/finance-math";
import { useState } from "react";
import { Trash2, Pencil, Plus, CalendarClock } from "lucide-react";
import { CDADialog } from "@/components/forms/cda-fund-dialog";
import { ScheduledSavingDialog } from "@/components/forms/scheduled-saving-dialog";
import { ConfirmDelete } from "@/components/forms/confirm-delete";

export const Route = createFileRoute("/portafolio/renta-fija")({ component: RentaFija });

function RentaFija() {
  const cdas = useStore((s) => s.cdas);
  const removeCDA = useStore((s) => s.removeCDA);
  const scheduledSavings = useStore((s) => s.scheduledSavings);
  const accounts = useStore((s) => s.accounts);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CDA | null>(null);
  const [toDelete, setToDelete] = useState<CDA | null>(null);
  const [schedFor, setSchedFor] = useState<CDA | null>(null);
  const [editingSched, setEditingSched] = useState<ScheduledSaving | null>(null);

  const totals = cdas.reduce(
    (a, c) => {
      const acc = cdaAccrual(c);
      a.capital += c.capital;
      a.interest += acc.interest;
      a.current += acc.currentValue;
      a.final += acc.maturityValue;
      return a;
    },
    { capital: 0, interest: 0, current: 0, final: 0 },
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm font-medium">CDAs Activos</CardTitle>
          <p className="num mt-1 text-xs text-muted-foreground">
            Capital: <span className="font-mono">{formatPYG(totals.capital)}</span> · Devengado:{" "}
            <span className="font-mono text-[color:var(--color-positive)]">+{formatPYG(totals.interest)}</span> · Valor actual:{" "}
            <span className="font-mono font-medium">{formatPYG(totals.current)}</span> · Valor final:{" "}
            <span className="font-mono font-medium">{formatPYG(totals.final)}</span>
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo CDA
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Banco</th>
              <th className="px-3 py-2 text-right font-medium">Capital</th>
              <th className="px-3 py-2 text-right font-medium">TNA</th>
              <th className="px-3 py-2 text-right font-medium">Días</th>
              <th className="px-3 py-2 text-right font-medium">Devengado</th>
              <th className="px-3 py-2 text-right font-medium">Valor Actual</th>
              <th className="px-3 py-2 text-right font-medium">Valor Final</th>
              <th className="px-3 py-2 text-right font-medium">Vto.</th>
              <th className="px-3 py-2 text-right font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {cdas.map((c) => {
              const a = cdaAccrual(c);
              const pending = a.maturityValue - a.currentValue;
              return (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2">{c.bank}</td>
                  <td className="num px-3 py-2 text-right font-mono">{formatPYG(c.capital)}</td>
                  <td className="num px-3 py-2 text-right font-mono">{formatPct(c.tna)}</td>
                  <td className="num px-3 py-2 text-right font-mono text-muted-foreground">{a.days}</td>
                  <td className="num px-3 py-2 text-right font-mono text-[color:var(--color-positive)]">+{formatPYG(a.interest)}</td>
                  <td className="num px-3 py-2 text-right font-mono font-medium">{formatPYG(a.currentValue)}</td>
                  <td className="num px-3 py-2 text-right font-mono font-medium">
                    {formatPYG(a.maturityValue)}
                    <div className="text-[10px] font-normal text-muted-foreground">pend +{formatPYG(pending)}</div>
                  </td>
                  <td className="num px-3 py-2 text-right font-mono text-xs text-muted-foreground">
                    {formatDate(c.maturityDate)}<br />({a.daysToMaturity}d)
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Programar aporte"
                      onClick={() => { setEditingSched(null); setSchedFor(c); }}>
                      <CalendarClock className="h-3.5 w-3.5" />
                    </Button>
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
            {cdas.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-xs text-muted-foreground">Sin CDAs registrados.</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>

      {scheduledSavings.filter((s) => s.targetType === "cda").length > 0 && (
        <div className="border-t bg-muted/30 px-3 py-2">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Ahorros programados activos</div>
          <ul className="space-y-1">
            {scheduledSavings.filter((s) => s.targetType === "cda").map((s) => {
              const cda = cdas.find((c) => c.id === s.targetId);
              const acc = accounts.find((a) => a.id === s.accountId);
              if (!cda) return null;
              return (
                <li key={s.id} className="flex items-center justify-between text-xs">
                  <span>{cda.bank}: <span className="num font-mono">{formatPYG(s.amountPYG)}</span> · {s.frequency}</span>
                  <span className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>desde {acc?.name ?? "-"}</span>
                    <Badge variant="outline" className="text-[9px]">próx {formatDate(s.nextRun)}</Badge>
                    {!s.active && <Badge variant="outline" className="text-[9px]">pausado</Badge>}
                    <button className="text-foreground underline" onClick={() => { setEditingSched(s); setSchedFor(cda); }}>editar</button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <CDADialog open={open} onOpenChange={setOpen} cda={editing} />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="¿Eliminar CDA?"
        description={toDelete ? `${toDelete.bank} · ${formatPYG(toDelete.capital)}.` : undefined}
        onConfirm={() => { if (toDelete) removeCDA(toDelete.id); setToDelete(null); }}
      />
      {schedFor && (
        <ScheduledSavingDialog
          open={!!schedFor}
          onOpenChange={(v) => { if (!v) { setSchedFor(null); setEditingSched(null); } }}
          targetType="cda"
          targetId={schedFor.id}
          targetLabel={schedFor.bank}
          saving={editingSched}
        />
      )}
    </Card>
  );
}
