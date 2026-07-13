import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore, type CreditCard, type Account } from "@/lib/store";
import { formatPYG, formatPct } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { CardDialog } from "@/components/forms/card-dialog";
import { AccountDialog } from "@/components/forms/account-dialog";
import { ConfirmDelete } from "@/components/forms/confirm-delete";

export const Route = createFileRoute("/tesoreria")({
  head: () => ({ meta: [{ title: "Cuentas - FinAxis" }] }),
  component: Tesoreria,
});

function dueIn(day: number) {
  const today = new Date();
  const due = new Date(today.getFullYear(), today.getMonth(), day);
  if (due < today) due.setMonth(due.getMonth() + 1);
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}

function Tesoreria() {
  const accounts = useStore((s) => s.accounts);
  const deleteAccount = useStore((s) => s.deleteAccount);
  const cards = useStore((s) => s.cards);
  const transactions = useStore((s) => s.transactions);
  const deleteCard = useStore((s) => s.deleteCard);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CreditCard | null>(null);
  const [toDelete, setToDelete] = useState<CreditCard | null>(null);

  const [accOpen, setAccOpen] = useState(false);
  const [accEditing, setAccEditing] = useState<Account | null>(null);
  const [accToDelete, setAccToDelete] = useState<Account | null>(null);


  const txCountByCard = (id: string) =>
    transactions.filter((t) => t.method === "credit" && t.cardId === id).length;

  return (
    <AppShell
      title="Cuentas"
      subtitle="Cuentas y tarjetas"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setAccEditing(null); setAccOpen(true); }}>
            <Plus className="mr-2 h-3.5 w-3.5" /> Nueva cuenta
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="mr-2 h-3.5 w-3.5" /> Nueva tarjeta
          </Button>
        </div>
      }
    >
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Cuentas a la vista</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Banco / Cuenta</th>
                <th className="px-3 py-2 text-left font-medium">Tipo</th>
                <th className="px-3 py-2 text-right font-medium">Monto disponible</th>
                <th className="px-3 py-2 text-right font-medium w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-3 py-3 font-medium">{a.name}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {a.kind === "cash" ? "Efectivo" : "Cuenta bancaria"}
                  </td>
                  <td className="num px-3 py-3 text-right font-mono">{formatPYG(a.balancePYG)}</td>
                  <td className="px-3 py-3 text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAccEditing(a); setAccOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAccToDelete(a)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Sin cuentas. Agregá una para que tus transacciones impacten en la liquidez.
                </td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>


      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Tarjetas de Crédito</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Tarjeta</th>
                <th className="px-3 py-2 text-right font-medium">Límite</th>
                <th className="px-3 py-2 text-right font-medium">Disponible</th>
                <th className="px-3 py-2 text-right font-medium">Util.</th>
                <th className="px-3 py-2 text-right font-medium">Pago Mín.</th>
                <th className="px-3 py-2 text-right font-medium">Vencimiento</th>
                <th className="px-3 py-2 text-right font-medium w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => {
                const util = (c.balancePYG / c.limitPYG) * 100;
                const min = c.balancePYG * (c.minPaymentPct / 100);
                const available = Math.max(0, c.limitPYG - c.balancePYG);
                const days = dueIn(c.dueDay);
                return (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-3">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        Cierre día {c.closingDay} · TNA {formatPct(c.tna)} · Mín {c.minPaymentPct}%
                      </div>
                    </td>
                    <td className="num px-3 py-3 text-right font-mono text-muted-foreground">{formatPYG(c.limitPYG)}</td>
                    <td className="num px-3 py-3 text-right font-mono">
                      <div className="font-medium text-[color:var(--color-positive)]">{formatPYG(available)}</div>
                      <div className="text-[10px] text-muted-foreground">Usado {formatPYG(c.balancePYG)}</div>
                    </td>
                    <td className="num px-3 py-3 text-right font-mono">
                      <span className={util > 70 ? "text-[color:var(--color-negative)]" : util > 40 ? "text-amber-600" : ""}>
                        {formatPct(util)}
                      </span>
                    </td>
                    <td className="num px-3 py-3 text-right font-mono text-muted-foreground">{formatPYG(min)}</td>
                    <td className="px-3 py-3 text-right">
                      <Badge variant={days <= 3 ? "destructive" : days <= 7 ? "default" : "secondary"}>
                        Día {c.dueDay} · en {days}d
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right">
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
              {cards.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-muted-foreground">Sin tarjetas. Agregá una para empezar.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <CardDialog open={open} onOpenChange={setOpen} card={editing} />
      <AccountDialog open={accOpen} onOpenChange={setAccOpen} account={accEditing} />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="¿Eliminar tarjeta?"
        description={
          toDelete
            ? `${toDelete.name}. Hay ${txCountByCard(toDelete.id)} transacción(es) ligadas; sus saldos quedarán huérfanos. Considera reasignarlas o eliminarlas antes.`
            : undefined
        }
        onConfirm={() => { if (toDelete) deleteCard(toDelete.id); setToDelete(null); }}
      />
      <ConfirmDelete
        open={!!accToDelete}
        onOpenChange={(v) => !v && setAccToDelete(null)}
        title="¿Eliminar cuenta?"
        description={accToDelete ? `${accToDelete.name}. Las transacciones asociadas quedarán huérfanas.` : undefined}
        onConfirm={() => { if (accToDelete) deleteAccount(accToDelete.id); setAccToDelete(null); }}
      />
    </AppShell>
  );
}
