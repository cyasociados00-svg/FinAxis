import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, type Transaction } from "@/lib/store";
import { useState } from "react";
import { formatPYG, formatDate } from "@/lib/format";
import { Pencil, Trash2, Plus } from "lucide-react";
import { TransactionDialog } from "@/components/forms/transaction-dialog";
import { ConfirmDelete } from "@/components/forms/confirm-delete";

export const Route = createFileRoute("/quick-log")({
  head: () => ({ meta: [{ title: "Registrar - FinAxis" }] }),
  component: QuickLog,
});

function QuickLog() {
  const transactions = useStore((s) => s.transactions);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);

  return (
    <AppShell
      title="Registrar"
      subtitle="Registro de transacciones sin fricción"
      actions={
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-2 h-3.5 w-3.5" /> Nueva
        </Button>
      }
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Transacciones registradas</CardTitle>
          <p className="text-xs text-muted-foreground">
            Usa los botones de editar o eliminar en cada fila. Al editar/borrar una compra con tarjeta, se ajusta el saldo y las cuotas automaticamente.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Fecha</th>
                  <th className="px-3 py-2 text-left font-medium">Concepto</th>
                  <th className="px-3 py-2 text-left font-medium">Categoría</th>
                  <th className="px-3 py-2 text-left font-medium">Método</th>
                  <th className="px-3 py-2 text-right font-medium">Monto</th>
                  <th className="px-3 py-2 text-right font-medium w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="num px-3 py-2 font-mono text-xs text-muted-foreground">{formatDate(t.date)}</td>
                    <td className="px-3 py-2">{t.concept}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{t.category}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {t.method === "credit" ? `TC${t.installments && t.installments > 1 ? ` ${t.installments}x` : ""}` : t.method}
                      </Badge>
                    </td>
                    <td className={`num px-3 py-2 text-right font-mono ${t.type === "income" ? "text-[color:var(--color-positive)]" : "text-[color:var(--color-negative)]"}`}>
                      {t.type === "income" ? "+" : "-"}{formatPYG(t.amount)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(t); setOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setToDelete(t)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <TransactionDialog open={open} onOpenChange={setOpen} tx={editing} />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="¿Eliminar transacción?"
        description={toDelete ? `${toDelete.concept} · ${formatPYG(toDelete.amount)}. Esta acción no se puede deshacer y revertirá saldos/cuotas si aplica.` : undefined}
        onConfirm={() => { if (toDelete) deleteTransaction(toDelete.id); setToDelete(null); }}
      />
    </AppShell>
  );
}
