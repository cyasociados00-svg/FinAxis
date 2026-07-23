import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  useStore,
  type PayMethod,
  type ScheduledFrequency,
  type Transaction,
  type TxType,
} from "@/lib/store";
import { addPeriods } from "@/lib/finance-math";

// Next occurrence of a recurring rule, one period after the given ISO date.
const advancePeriod = (iso: string, freq: ScheduledFrequency) =>
  addPeriods(iso, freq, 1).toISOString();

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tx?: Transaction | null;
  /** Pre-select income/expense on a fresh (non-editing) open — used by the
   * "Registrar ingreso/gasto" home-screen shortcuts deep link. */
  initialType?: TxType;
};

export function TransactionDialog({ open, onOpenChange, tx, initialType }: Props) {
  const cards = useStore((s) => s.cards);
  const accounts = useStore((s) => s.accounts); // CORREGIDO: Traemos las cuentas
  const addTransaction = useStore((s) => s.addTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const addRecurringRule = useStore((s) => s.addRecurringRule);

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [category, setCategory] = useState("Supermercado");
  const [method, setMethod] = useState<PayMethod>("debit");
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? ""); // CORREGIDO: Estado local para cuenta
  const [installments, setInstallments] = useState("1");
  const [recurring, setRecurring] = useState(false);
  const [recurFreq, setRecurFreq] = useState<ScheduledFrequency>("monthly");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (!open) return;
    if (tx) {
      setType(tx.type);
      setAmount(String(tx.amount));
      setConcept(tx.concept);
      setCategory(tx.category);
      setMethod(tx.method);
      setCardId(tx.cardId ?? cards[0]?.id ?? "");
      setAccountId(tx.accountId ?? accounts[0]?.id ?? ""); // CORREGIDO: Cargar cuenta al editar
      setInstallments(String(tx.installments ?? 1));
      setDate(tx.date.slice(0, 10));
    } else {
      const t = initialType ?? "expense";
      setType(t);
      setAmount("");
      setConcept("");
      setCategory(t === "income" ? "Ingreso Dependiente" : "Supermercado");
      setMethod("debit");
      setCardId(cards[0]?.id ?? "");
      setAccountId(accounts[0]?.id ?? ""); // CORREGIDO: Resetear a la primera cuenta
      setInstallments("1");
      const today = new Date();
      setDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
    }
    // Recurrence is only offered when creating a new transaction.
    setRecurring(false);
    setRecurFreq("monthly");
  }, [open, tx, cards, accounts, initialType]);

  const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Paying a credit card: an expense from an account/cash toward a card. It
  // reduces the account AND pays down that card's debt (raising its available).
  const isCardPayment = type === "expense" && (method === "cash" || method === "debit") && category === "Pago tarjeta";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || !concept) return;

    const payload = {
      amount: n,
      concept,
      category,
      type,
      method,
      cardId: method === "credit" ? cardId : isCardPayment ? cardId : undefined,
      accountId: method === "cash" || method === "debit" ? accountId : undefined, // CORREGIDO: El descalce contable se soluciona enviando la cuenta
      installments: method === "credit" ? Math.max(1, Number(installments) || 1) : undefined,
      date: new Date(`${date}T12:00:00`).toISOString(),
    };

    if (tx) {
      updateTransaction(tx.id, payload);
    } else {
      addTransaction(payload);
      // Also save it as a recurring rule; the first occurrence is the
      // transaction we just registered, so the cursor starts one period later.
      if (recurring) {
        addRecurringRule({
          concept,
          amount: n,
          category,
          type,
          method,
          accountId: payload.accountId,
          cardId: payload.cardId,
          frequency: recurFreq,
          nextRun: advancePeriod(payload.date, recurFreq),
          active: true,
        });
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tx ? "Editar transacción" : "Nueva transacción"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Tabs
            value={type}
            onValueChange={(v) => {
              setType(v as TxType);
              setCategory(v === "income" ? "Ingreso Dependiente" : "Supermercado");
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense">Gasto</TabsTrigger>
              <TabsTrigger value="income">Ingreso</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Monto (PYG)</Label>
              <MoneyInput
                className="num font-mono"
                value={amount}
                onValueChange={setAmount}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider">Concepto</Label>
            <Input value={concept} onChange={(e) => setConcept(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cats.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Método</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PayMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="debit">Débito</SelectItem>
                  <SelectItem value="credit">Tarjeta Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CORREGIDO: UI condicional para seleccionar la cuenta afectada si es Cash o Débito */}
          {(method === "cash" || method === "debit") && (
            <div className="space-y-3 rounded border bg-muted/40 p-3">
              <div>
                <Label className="text-xs uppercase tracking-wider">
                  {type === "income" ? "Cuenta de Destino (Depósito)" : "Cuenta de Origen (Pago)"}
                </Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({a.balancePYG.toLocaleString("es-PY")} Gs)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isCardPayment && (
                <div>
                  <Label className="text-xs uppercase tracking-wider">Tarjeta a pagar</Label>
                  <Select value={cardId} onValueChange={setCardId}>
                    <SelectTrigger><SelectValue placeholder="Elegir tarjeta" /></SelectTrigger>
                    <SelectContent>
                      {cards.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} (deuda {c.balancePYG.toLocaleString("es-PY")} Gs)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Descuenta de la cuenta y reduce la deuda de esta tarjeta (sube el disponible).
                  </p>
                </div>
              )}
            </div>
          )}

          {method === "credit" && type === "expense" && (
            <div className="grid grid-cols-2 gap-3 rounded border bg-muted/40 p-3">
              <div>
                <Label className="text-xs uppercase tracking-wider">Tarjeta</Label>
                <Select value={cardId} onValueChange={setCardId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider">Cuotas</Label>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  className="num font-mono"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Recurrence — only when creating; editing a past transaction
              shouldn't retroactively turn it into a rule. */}
          {!tx && (
            <div className="rounded border bg-muted/40 p-3">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">Es recurrente</div>
                  <div className="text-xs text-muted-foreground">
                    Se registrará solo cada período (honorarios, alquiler, servicios). Usalo cuando el monto es fijo.
                  </div>
                </div>
              </label>
              {recurring && (
                <div className="mt-2">
                  <Label className="text-xs uppercase tracking-wider">Frecuencia</Label>
                  <Select value={recurFreq} onValueChange={(v) => setRecurFreq(v as ScheduledFrequency)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quincenal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Esta transacción es la primera; la próxima se registrará automáticamente al vencer.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{tx ? "Guardar cambios" : "Registrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
