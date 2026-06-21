import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, purchaseFromAccount, type CDA, type MutualFund } from "@/lib/store";

function AccountPicker({
  accountId, setAccountId, amount,
}: { accountId: string; setAccountId: (v: string) => void; amount: number }) {
  const accounts = useStore((s) => s.accounts);
  if (accounts.length === 0) {
    return (
      <div className="rounded border bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
        No hay cuentas. Creá una desde Tesorería para poder descontar el aporte.
      </div>
    );
  }
  return (
    <div className="rounded border bg-muted/40 p-3">
      <Label className="text-xs uppercase tracking-wider">Cuenta de origen (pago)</Label>
      <Select value={accountId} onValueChange={setAccountId}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name} ({a.balancePYG.toLocaleString("es-PY")} Gs)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {amount > 0
          ? `Se descontarán ${amount.toLocaleString("es-PY")} Gs y se registrará en Registrar (categoría Inversión).`
          : "Ingresá el capital/aporte para calcular el descuento."}
      </p>
    </div>
  );
}

export function CDADialog({
  open, onOpenChange, cda,
}: { open: boolean; onOpenChange: (v: boolean) => void; cda?: CDA | null }) {
  const addCDA = useStore((s) => s.addCDA);
  const updateCDA = useStore((s) => s.updateCDA);
  const accounts = useStore((s) => s.accounts);
  const [bank, setBank] = useState("");
  const [capital, setCapital] = useState("");
  const [tna, setTna] = useState("11.5");
  const [issue, setIssue] = useState(new Date().toISOString().slice(0, 10));
  const [maturity, setMaturity] = useState("");
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (cda) {
      setBank(cda.bank); setCapital(String(cda.capital)); setTna(String(cda.tna));
      setIssue(cda.issueDate.slice(0, 10)); setMaturity(cda.maturityDate.slice(0, 10));
    } else {
      setBank(""); setCapital(""); setTna("11.5");
      setIssue(new Date().toISOString().slice(0, 10)); setMaturity("");
      setAccountId(accounts[0]?.id ?? "");
    }
  }, [open, cda, accounts]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bank || !Number(capital) || !maturity) return;
    const payload = {
      bank, capital: Number(capital), tna: Number(tna),
      issueDate: new Date(issue).toISOString(),
      maturityDate: new Date(maturity).toISOString(),
    };
    if (cda) {
      updateCDA(cda.id, payload);
    } else {
      addCDA(payload);
      if (accountId && Number(capital) > 0) {
        const acc = accounts.find((a) => a.id === accountId);
        purchaseFromAccount({
          accountId,
          method: acc?.kind ?? "debit",
          amountPYG: Number(capital),
          concept: `CDA ${bank} · vto. ${maturity}`,
          date: new Date(issue).toISOString(),
        });
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{cda ? "Editar CDA" : "Nuevo CDA"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-wider">Banco emisor</Label>
            <Input value={bank} onChange={(e) => setBank(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Capital (PYG)</Label>
              <Input type="number" className="num font-mono" value={capital} onChange={(e) => setCapital(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">TNA %</Label>
              <Input type="number" step="0.01" className="num font-mono" value={tna} onChange={(e) => setTna(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Emisión</Label>
              <Input type="date" value={issue} onChange={(e) => setIssue(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Vencimiento</Label>
              <Input type="date" value={maturity} onChange={(e) => setMaturity(e.target.value)} />
            </div>
          </div>
          {!cda && <AccountPicker accountId={accountId} setAccountId={setAccountId} amount={Number(capital) || 0} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{cda ? "Guardar" : "Registrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function FundDialog({
  open, onOpenChange, fund,
}: { open: boolean; onOpenChange: (v: boolean) => void; fund?: MutualFund | null }) {
  const addFund = useStore((s) => s.addFund);
  const updateFund = useStore((s) => s.updateFund);
  const accounts = useStore((s) => s.accounts);
  const [name, setName] = useState("");
  const [contrib, setContrib] = useState("");
  const [value, setValue] = useState("");
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    if (!open) return;
    if (fund) {
      setName(fund.name);
      setContrib(String(fund.contributionsPYG));
      setValue(String(fund.currentValuePYG));
    } else {
      setName(""); setContrib(""); setValue("");
      setAccountId(accounts[0]?.id ?? "");
    }
  }, [open, fund, accounts]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const payload = {
      name,
      contributionsPYG: Number(contrib) || 0,
      currentValuePYG: Number(value) || Number(contrib) || 0,
    };
    if (fund) {
      updateFund(fund.id, payload);
    } else {
      addFund(payload);
      if (accountId && Number(contrib) > 0) {
        const acc = accounts.find((a) => a.id === accountId);
        purchaseFromAccount({
          accountId,
          method: acc?.kind ?? "debit",
          amountPYG: Number(contrib),
          concept: `Aporte a ${name}`,
        });
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{fund ? "Editar fondo" : "Nuevo fondo"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-wider">Nombre del fondo</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Aportes acumulados (PYG)</Label>
              <Input type="number" className="num font-mono" value={contrib} onChange={(e) => setContrib(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Valor actual (PYG)</Label>
              <Input type="number" className="num font-mono" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
          </div>
          {!fund && <AccountPicker accountId={accountId} setAccountId={setAccountId} amount={Number(contrib) || 0} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{fund ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
