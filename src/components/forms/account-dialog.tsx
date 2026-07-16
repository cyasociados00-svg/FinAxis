import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, type Account } from "@/lib/store";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account?: Account | null;
};

export function AccountDialog({ open, onOpenChange, account }: Props) {
  const addAccount = useStore((s) => s.addAccount);
  const updateAccount = useStore((s) => s.updateAccount);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<"cash" | "debit">("debit");
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    if (!open) return;
    if (account) {
      setName(account.name);
      setKind(account.kind);
      setBalance(String(account.balancePYG));
    } else {
      setName("");
      setKind("debit");
      setBalance("0");
    }
  }, [open, account]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      kind,
      balancePYG: Number(balance) || 0,
    };
    if (account) updateAccount(account.id, payload);
    else addAccount(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? "Editar cuenta" : "Nueva cuenta a la vista"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-wider">Nombre del banco / cuenta</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Itaú Cta. Cte. PYG" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Tipo</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as "cash" | "debit")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Cuenta bancaria (Débito)</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Monto disponible (PYG)</Label>
              <MoneyInput className="num font-mono" value={balance} onValueChange={setBalance} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{account ? "Guardar cambios" : "Crear"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
