import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore, type CreditCard, type Account } from "@/lib/store";
import { formatPYG, formatPct } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { arbitrageAnalysis } from "@/lib/finance-math";
import { TrendingUp, TrendingDown, Pencil, Trash2, Plus } from "lucide-react";
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
      subtitle="Cuentas, tarjetas y arbitraje"
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
                <th className="px-3 py-2 text-right font-medium">Saldo</th>
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
                    <td className="num px-3 py-3 text-right font-mono">{formatPYG(c.balancePYG)}</td>
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

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <ArbitrageSim key={c.id} cardName={c.name} balance={c.balancePYG} cardTNA={c.tna} />
        ))}
      </div>

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

function ArbitrageSim({
  cardName, balance, cardTNA,
}: { cardName: string; balance: number; cardTNA: number }) {
  const [amount, setAmount] = useState(String(balance));
  const [tnaCard, setTnaCard] = useState(String(cardTNA));
  const [tnaInv, setTnaInv] = useState("35");
  const a = arbitrageAnalysis(Number(amount) || 0, Number(tnaCard) || 0, Number(tnaInv) || 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Simulador de Arbitraje - {cardName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[10px] uppercase tracking-wider">Monto</Label>
            <Input className="num font-mono h-9" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider">TNA Tarjeta %</Label>
            <Input className="num font-mono h-9" value={tnaCard} onChange={(e) => setTnaCard(e.target.value)} />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider">TNA Inv. %</Label>
            <Input className="num font-mono h-9" value={tnaInv} onChange={(e) => setTnaInv(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded border bg-muted/40 p-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Costo financiero/mes</div>
            <div className="num font-mono text-[color:var(--color-negative)]">-{formatPYG(a.costMonthly)}</div>
            <div className="text-[10px] text-muted-foreground">@ {formatPct(a.monthlyCard)}/mes</div>
          </div>
          <div className="rounded border bg-muted/40 p-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rendimiento/mes</div>
            <div className="num font-mono text-[color:var(--color-positive)]">+{formatPYG(a.gainMonthly)}</div>
            <div className="text-[10px] text-muted-foreground">@ {formatPct(a.monthlyInvest)}/mes</div>
          </div>
        </div>
        <div className={`flex items-center justify-between rounded border p-3 ${a.positive ? "border-[color:var(--color-positive)]/40 bg-[color:var(--color-positive)]/10" : "border-[color:var(--color-negative)]/40 bg-[color:var(--color-negative)]/10"}`}>
          <div className="flex items-center gap-2">
            {a.positive ? <TrendingUp className="h-4 w-4 text-[color:var(--color-positive)]" /> : <TrendingDown className="h-4 w-4 text-[color:var(--color-negative)]" />}
            <span className="text-xs font-medium uppercase tracking-wider">
              {a.positive ? "Arbitraje positivo" : "Conviene cancelar tarjeta"}
            </span>
          </div>
          <div className={`num font-mono text-base font-semibold ${a.positive ? "text-[color:var(--color-positive)]" : "text-[color:var(--color-negative)]"}`}>
            {a.positive ? "+" : ""}{formatPYG(a.net)}/mes
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
