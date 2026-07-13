import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Wallet, CreditCard, CheckCircle2, ChevronRight, X } from "lucide-react";
import { formatPYG } from "@/lib/format";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Configuracion inicial - FinAxis" }] }),
  component: OnboardingPage,
});

type Step = "accounts" | "cards" | "done";

function OnboardingPage() {
  const navigate = useNavigate();
  const addAccount = useStore((s) => s.addAccount);
  const addCard    = useStore((s) => s.addCard);
  const accounts   = useStore((s) => s.accounts);
  const cards      = useStore((s) => s.cards);
  const [step, setStep] = useState<Step>("accounts");

  // Account form
  const [accName,    setAccName]    = useState("");
  const [accKind,    setAccKind]    = useState<"cash" | "debit">("debit");
  const [accBalance, setAccBalance] = useState("");

  // Card form
  const [cardName,    setCardName]    = useState("");
  const [cardLimit,   setCardLimit]   = useState("");
  const [cardBalance, setCardBalance] = useState("0");
  const [closingDay,  setClosingDay]  = useState("20");
  const [dueDay,      setDueDay]      = useState("5");
  const [cardTna,     setCardTna]     = useState("72");
  const [minPct,      setMinPct]      = useState("10");

  function addAccountLocal(e: React.FormEvent) {
    e.preventDefault();
    if (!accName) return;
    addAccount({ name: accName, kind: accKind, balancePYG: Number(accBalance) || 0 });
    setAccName(""); setAccBalance("");
  }

  function addCardLocal(e: React.FormEvent) {
    e.preventDefault();
    if (!cardName || !Number(cardLimit)) return;
    addCard({
      name: cardName,
      limitPYG: Number(cardLimit),
      balancePYG: Number(cardBalance) || 0,
      closingDay: Math.min(31, Math.max(1, Number(closingDay) || 1)),
      dueDay: Math.min(31, Math.max(1, Number(dueDay) || 1)),
      tna: Number(cardTna) || 0,
      minPaymentPct: Number(minPct) || 0,
    });
    setCardName(""); setCardLimit(""); setCardBalance("0");
  }

  const steps: Step[] = ["accounts", "cards", "done"];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="m-auto w-full max-w-lg px-4 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LineChart className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">FinAxis</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Configuración inicial</div>
            </div>
          </div>
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Omitir por ahora
          </button>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-2">
          {[
            { id: "accounts", label: "Cuentas",  icon: Wallet       },
            { id: "cards",    label: "Tarjetas",  icon: CreditCard   },
            { id: "done",     label: "Listo",     icon: CheckCircle2 },
          ].map(({ id, label, icon: Icon }, i) => (
            <div key={id} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                stepIndex >= i
                  ? "bg-primary text-primary-foreground"
                  : "border bg-muted text-muted-foreground"
              }`}>
                {stepIndex > i ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <span className={`text-xs ${stepIndex >= i ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
              {i < 2 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step: Accounts */}
        {step === "accounts" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Tus cuentas</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Agregá tus cuentas bancarias y efectivo. Estas son tu liquidez disponible.
              </p>
            </div>

            <form onSubmit={addAccountLocal} className="space-y-3 rounded-lg border bg-card p-4">
              <div>
                <Label className="text-xs uppercase tracking-wider">Nombre</Label>
                <Input placeholder="Ej. Cuenta Itaú, Efectivo" value={accName}
                  onChange={(e) => setAccName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider">Tipo</Label>
                  <Select value={accKind} onValueChange={(v) => setAccKind(v as "cash" | "debit")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Cuenta bancaria</SelectItem>
                      <SelectItem value="cash">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Saldo actual (PYG)</Label>
                  <Input type="number" className="num font-mono" placeholder="0"
                    value={accBalance} onChange={(e) => setAccBalance(e.target.value)} />
                </div>
              </div>
              <Button type="submit" variant="outline" size="sm" disabled={!accName} className="w-full">
                + Agregar cuenta
              </Button>
            </form>

            {accounts.length > 0 && (
              <div className="space-y-1.5">
                {accounts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded border bg-muted/40 px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{a.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {a.kind === "cash" ? "Efectivo" : "Bancaria"}
                      </span>
                    </div>
                    <span className="num font-mono text-xs">{formatPYG(a.balancePYG)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {accounts.length === 0
                  ? "Agregá al menos una cuenta"
                  : `${accounts.length} cuenta${accounts.length > 1 ? "s" : ""} agregada${accounts.length > 1 ? "s" : ""}`}
              </span>
              <Button onClick={() => setStep("cards")} disabled={accounts.length === 0}>
                Siguiente <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Cards */}
        {step === "cards" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Tus tarjetas de crédito</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Agregá tus tarjetas. Podés saltear este paso si no tenés.
              </p>
            </div>

            <form onSubmit={addCardLocal} className="space-y-3 rounded-lg border bg-card p-4">
              <div>
                <Label className="text-xs uppercase tracking-wider">Nombre</Label>
                <Input placeholder="Ej. Visa Itaú Platinum" value={cardName}
                  onChange={(e) => setCardName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider">Límite (PYG)</Label>
                  <Input type="number" className="num font-mono" value={cardLimit}
                    onChange={(e) => setCardLimit(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Deuda actual (PYG)</Label>
                  <Input type="number" className="num font-mono" value={cardBalance}
                    onChange={(e) => setCardBalance(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider">Día de cierre</Label>
                  <Input type="number" min="1" max="31" className="num font-mono"
                    value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Día de vencimiento</Label>
                  <Input type="number" min="1" max="31" className="num font-mono"
                    value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider">TNA %</Label>
                  <Input type="number" step="0.01" className="num font-mono"
                    value={cardTna} onChange={(e) => setCardTna(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Pago mínimo %</Label>
                  <Input type="number" step="0.01" className="num font-mono"
                    value={minPct} onChange={(e) => setMinPct(e.target.value)} />
                </div>
              </div>
              <Button type="submit" variant="outline" size="sm"
                disabled={!cardName || !Number(cardLimit)} className="w-full">
                + Agregar tarjeta
              </Button>
            </form>

            {cards.length > 0 && (
              <div className="space-y-1.5">
                {cards.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded border bg-muted/40 px-3 py-2 text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="num font-mono text-xs text-muted-foreground">
                      límite {formatPYG(c.limitPYG)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("accounts")}>
                Atrás
              </Button>
              <Button onClick={() => setStep("done")}>
                {cards.length === 0 ? "Omitir tarjetas" : "Siguiente"}
                <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold">¡Todo listo!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Configuraste {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""}
                {cards.length > 0
                  ? ` y ${cards.length} tarjeta${cards.length !== 1 ? "s" : ""}`
                  : ""}. Ya podés empezar a registrar tus movimientos.
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate({ to: "/" })}>
              Ir al Resumen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
