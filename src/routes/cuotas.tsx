import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useStore, type Installment } from "@/lib/store";
import { formatPYG, formatDate } from "@/lib/format";
import { CheckCircle2, Clock, Plus, Trash2 } from "lucide-react";
import { InstallmentPlanDialog } from "@/components/forms/installment-plan-dialog";
import { ConfirmDelete } from "@/components/forms/confirm-delete";

export const Route = createFileRoute("/cuotas")({
  head: () => ({ meta: [{ title: "Cuotas - FinAxis" }] }),
  component: CuotasPage,
});

function CuotasPage() {
  const installments = useStore((s) => s.installments);
  const transactions = useStore((s) => s.transactions);
  const cards = useStore((s) => s.cards);
  const accounts = useStore((s) => s.accounts);
  const payInstallment = useStore((s) => s.payInstallment);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [paying, setPaying] = useState<Installment | null>(null);
  const [accountId, setAccountId] = useState<string>("");
  const [mode, setMode] = useState<"now" | "already">("now");
  const [planOpen, setPlanOpen] = useState(false);
  const [toDeletePlan, setToDeletePlan] = useState<{ txId: string; concept: string; count: number } | null>(null);

  const rows = installments
    .filter((i) => (filter === "pending" ? !i.paid : true))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .map((i) => {
      const tx = transactions.find((t) => t.id === i.transactionId);
      const card = tx?.cardId ? cards.find((c) => c.id === tx.cardId) : null;
      const account = !card && tx?.accountId ? accounts.find((a) => a.id === tx.accountId) : null;
      return { inst: i, tx, card, account };
    });

  const totalPending = installments.filter((i) => !i.paid).reduce((a, x) => a + x.amount, 0);

  const openPay = (i: Installment) => {
    setPaying(i);
    setAccountId(accounts[0]?.id ?? "");
    setMode("now");
  };

  const confirmPay = () => {
    if (!paying) return;
    payInstallment(paying.id, mode === "now" && accountId ? { accountId } : undefined);
    setPaying(null);
  };

  return (
    <AppShell title="Cuotas" subtitle="Cancelá cuota por cuota para reducir el pasivo contingente">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-medium">Cuotas de tarjetas</CardTitle>
            <p className="num mt-1 text-xs text-muted-foreground">
              Pendiente total: <span className="font-mono font-medium">{formatPYG(totalPending)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPlanOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Cargar cuotas existentes
            </Button>
            <Button size="sm" variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>Pendientes</Button>
            <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>Todas</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Tarjeta/Cuenta</th>
                <th className="px-3 py-2 text-left font-medium">Concepto</th>
                <th className="px-3 py-2 text-right font-medium">Cuota</th>
                <th className="px-3 py-2 text-right font-medium">Monto</th>
                <th className="px-3 py-2 text-right font-medium">Vence</th>
                <th className="px-3 py-2 text-center font-medium">Estado</th>
                <th className="px-3 py-2 text-right font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ inst, tx, card, account }) => (
                <tr key={inst.id} className="border-t">
                  <td className="px-3 py-2 text-xs text-muted-foreground">{card?.name ?? account?.name ?? "-"}</td>
                  <td className="px-3 py-2">{tx?.concept ?? "-"}</td>
                  <td className="num px-3 py-2 text-right font-mono text-xs">{inst.number}/{inst.of}</td>
                  <td className="num px-3 py-2 text-right font-mono">{formatPYG(inst.amount)}</td>
                  <td className="num px-3 py-2 text-right font-mono text-xs text-muted-foreground">{formatDate(inst.dueDate)}</td>
                  <td className="px-3 py-2 text-center">
                    {inst.paid ? (
                      <Badge variant="outline" className="text-[10px]"><CheckCircle2 className="mr-1 h-3 w-3" />Paga</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]"><Clock className="mr-1 h-3 w-3" />Pendiente</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!inst.paid && (
                        <Button size="sm" variant="outline" onClick={() => openPay(inst)}>Pagar</Button>
                      )}
                      {tx && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Eliminar plan de cuotas"
                          onClick={() =>
                            setToDeletePlan({
                              txId: tx.id,
                              concept: tx.concept,
                              count: installments.filter((x) => x.transactionId === tx.id).length,
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-muted-foreground">Sin cuotas registradas.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!paying} onOpenChange={(v) => !v && setPaying(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Pagar cuota</DialogTitle></DialogHeader>
          {paying && (
            <div className="space-y-3">
              <div className="rounded border bg-muted/40 p-3 text-sm">
                <div className="font-medium">Cuota {paying.number}/{paying.of}</div>
                <div className="num font-mono">{formatPYG(paying.amount)}</div>
              </div>
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm">
                  <input type="radio" checked={mode === "now"} onChange={() => setMode("now")} className="mt-1" />
                  <div>
                    <div className="font-medium">Pagar ahora desde una cuenta</div>
                    <div className="text-xs text-muted-foreground">Descuenta el monto de la cuenta elegida y reduce la deuda de la tarjeta.</div>
                  </div>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input type="radio" checked={mode === "already"} onChange={() => setMode("already")} className="mt-1" />
                  <div>
                    <div className="font-medium">Marcar como ya pagada</div>
                    <div className="text-xs text-muted-foreground">Sólo reduce la deuda de la tarjeta (útil para cuotas previas al sistema).</div>
                  </div>
                </label>
              </div>
              {mode === "now" && (
                <div>
                  <Label className="text-xs uppercase tracking-wider">Cuenta</Label>
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
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaying(null)}>Cancelar</Button>
            <Button onClick={confirmPay} disabled={mode === "now" && !accountId}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InstallmentPlanDialog open={planOpen} onOpenChange={setPlanOpen} />
      <ConfirmDelete
        open={!!toDeletePlan}
        onOpenChange={(v) => !v && setToDeletePlan(null)}
        title="¿Eliminar plan de cuotas?"
        description={
          toDeletePlan
            ? `${toDeletePlan.concept} · se eliminarán ${toDeletePlan.count} cuota(s). Si es un plan previo no afecta saldos; si es una compra registrada en la app, se revierte su efecto.`
            : undefined
        }
        onConfirm={() => { if (toDeletePlan) deleteTransaction(toDeletePlan.txId); setToDeletePlan(null); }}
      />
    </AppShell>
  );
}
