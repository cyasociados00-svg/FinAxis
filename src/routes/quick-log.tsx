import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, type Transaction, type TxType } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";
import { formatPYG, formatDate } from "@/lib/format";
import { Pencil, Trash2, Plus, Search, X } from "lucide-react";
import { TransactionDialog } from "@/components/forms/transaction-dialog";
import { ConfirmDelete } from "@/components/forms/confirm-delete";

// "?nuevo=gasto" / "?nuevo=ingreso" — used by the home-screen app shortcuts
// (manifest "shortcuts") to deep-link straight into the form, pre-selected.
type NuevoParam = "gasto" | "ingreso" | undefined;

export const Route = createFileRoute("/quick-log")({
  head: () => ({ meta: [{ title: "Registrar - FinAxis" }] }),
  validateSearch: (search: Record<string, unknown>): { nuevo?: NuevoParam } => ({
    nuevo: search.nuevo === "gasto" || search.nuevo === "ingreso" ? search.nuevo : undefined,
  }),
  component: QuickLog,
});

const methodLabel: Record<string, string> = { cash: "Efectivo", debit: "Débito", credit: "Tarjeta" };

function QuickLog() {
  const { nuevo } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const allTransactions = useStore((s) => s.transactions);
  const cards = useStore((s) => s.cards);
  const accounts = useStore((s) => s.accounts);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);
  const [initialType, setInitialType] = useState<TxType | undefined>(undefined);

  // Filters
  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState("all");
  const [fMethod, setFMethod] = useState("all");
  const [fSource, setFSource] = useState("all"); // account or card id
  const [dFrom, setDFrom] = useState("");
  const [dTo, setDTo] = useState("");
  const [minAmt, setMinAmt] = useState("");
  const [maxAmt, setMaxAmt] = useState("");

  useEffect(() => {
    if (!nuevo) return;
    setInitialType(nuevo === "ingreso" ? "income" : "expense");
    setEditing(null);
    setOpen(true);
    navigate({ search: {}, replace: true });
  }, [nuevo, navigate]);

  // Hide inert parents of pre-existing installment plans (amount 0).
  const transactions = useMemo(
    () => allTransactions.filter((t) => t.category !== "Cuota previa"),
    [allTransactions],
  );

  const sourceName = (t: Transaction) =>
    t.method === "credit" && t.cardId
      ? cards.find((c) => c.id === t.cardId)?.name ?? "-"
      : t.accountId
        ? accounts.find((a) => a.id === t.accountId)?.name ?? "-"
        : "-";

  const categories = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category))).sort(),
    [transactions],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const min = minAmt ? Number(minAmt) : null;
    const max = maxAmt ? Number(maxAmt) : null;
    return transactions.filter((t) => {
      if (query) {
        const hay = `${t.concept} ${t.category} ${sourceName(t)}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (fCat !== "all" && t.category !== fCat) return false;
      if (fMethod !== "all" && t.method !== fMethod) return false;
      if (fSource !== "all" && t.cardId !== fSource && t.accountId !== fSource) return false;
      const day = t.date.slice(0, 10);
      if (dFrom && day < dFrom) return false;
      if (dTo && day > dTo) return false;
      if (min != null && t.amount < min) return false;
      if (max != null && t.amount > max) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, q, fCat, fMethod, fSource, dFrom, dTo, minAmt, maxAmt, cards, accounts]);

  const hasFilters =
    !!q || fCat !== "all" || fMethod !== "all" || fSource !== "all" || !!dFrom || !!dTo || !!minAmt || !!maxAmt;

  const clearFilters = () => {
    setQ(""); setFCat("all"); setFMethod("all"); setFSource("all");
    setDFrom(""); setDTo(""); setMinAmt(""); setMaxAmt("");
  };

  return (
    <AppShell
      title="Registrar"
      subtitle="Registro de transacciones sin fricción"
      actions={
        <Button size="sm" onClick={() => { setEditing(null); setInitialType(undefined); setOpen(true); }}>
          <Plus className="mr-2 h-3.5 w-3.5" /> Nueva
        </Button>
      }
    >
      {/* Filtros */}
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="col-span-2 md:col-span-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Buscar (concepto, categoría, cuenta)</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="pl-7" />
              </div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Categoría</Label>
              <Select value={fCat} onValueChange={setFCat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Método</Label>
              <Select value={fMethod} onValueChange={setFMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="debit">Débito</SelectItem>
                  <SelectItem value="credit">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Cuenta / Tarjeta</Label>
              <Select value={fSource} onValueChange={setFSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>Cuenta · {a.name}</SelectItem>)}
                  {cards.map((c) => <SelectItem key={c.id} value={c.id}>Tarjeta · {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Desde</Label>
              <Input type="date" value={dFrom} onChange={(e) => setDFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Hasta</Label>
              <Input type="date" value={dTo} onChange={(e) => setDTo(e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Monto mín.</Label>
              <MoneyInput className="num font-mono" value={minAmt} onValueChange={setMinAmt} placeholder="0" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Monto máx.</Label>
              <MoneyInput className="num font-mono" value={maxAmt} onValueChange={setMaxAmt} placeholder="0" />
            </div>
          </div>
          {hasFilters && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={clearFilters}>
                <X className="mr-1 h-3.5 w-3.5" /> Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Transacciones registradas</CardTitle>
          <p className="text-xs text-muted-foreground">
            Usa los botones de editar o eliminar en cada fila. Al editar/borrar una compra con tarjeta, se ajusta el saldo y las cuotas automáticamente.
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
                  <th className="px-3 py-2 text-left font-medium">Cuenta / Tarjeta</th>
                  <th className="px-3 py-2 text-right font-medium">Monto</th>
                  <th className="px-3 py-2 text-right font-medium w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="num px-3 py-2 font-mono text-xs text-muted-foreground">{formatDate(t.date)}</td>
                    <td className="px-3 py-2">{t.concept}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{t.category}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {t.method === "credit" ? `TC${t.installments && t.installments > 1 ? ` ${t.installments}x` : ""}` : methodLabel[t.method] ?? t.method}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{sourceName(t)}</td>
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
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-muted-foreground">
                    {transactions.length === 0 ? "Sin transacciones registradas." : "Ninguna transacción coincide con los filtros."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <TransactionDialog open={open} onOpenChange={setOpen} tx={editing} initialType={editing ? undefined : initialType} />
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
