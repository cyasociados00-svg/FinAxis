import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import { useStore, type MutualFund } from "@/lib/store";
import { formatPYG, formatPct } from "@/lib/format";
import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { FundDialog } from "@/components/forms/cda-fund-dialog";
import { ConfirmDelete } from "@/components/forms/confirm-delete";

export const Route = createFileRoute("/portafolio/fondos")({ component: Fondos });

function Fondos() {
  const funds = useStore((s) => s.funds);
  const addFundContribution = useStore((s) => s.addFundContribution);
  const setFundValue = useStore((s) => s.setFundValue);
  const deleteFund = useStore((s) => s.deleteFund);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MutualFund | null>(null);
  const [toDelete, setToDelete] = useState<MutualFund | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo fondo
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {funds.map((f) => {
          const pnl = f.currentValuePYG - f.contributionsPYG;
          const pnlPct = f.contributionsPYG > 0 ? (pnl / f.contributionsPYG) * 100 : 0;
          return (
            <FundCard
              key={f.id} fund={f} pnl={pnl} pnlPct={pnlPct}
              onContribute={addFundContribution}
              onSetValue={setFundValue}
              onEdit={() => { setEditing(f); setOpen(true); }}
              onDelete={() => setToDelete(f)}
            />
          );
        })}
        {funds.length === 0 && (
          <Card><CardContent className="p-6 text-center text-xs text-muted-foreground">Sin fondos. Creá uno para empezar.</CardContent></Card>
        )}
      </div>

      <FundDialog open={open} onOpenChange={setOpen} fund={editing} />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="¿Eliminar fondo?"
        description={toDelete ? `${toDelete.name}.` : undefined}
        onConfirm={() => { if (toDelete) deleteFund(toDelete.id); setToDelete(null); }}
      />
    </div>
  );
}

function FundCard({
  fund, pnl, pnlPct, onContribute, onSetValue, onEdit, onDelete,
}: {
  fund: MutualFund;
  pnl: number;
  pnlPct: number;
  onContribute: (id: string, amount: number) => void;
  onSetValue: (id: string, value: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [contrib, setContrib] = useState("");
  const [val, setVal] = useState(String(fund.currentValuePYG));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{fund.name}</CardTitle>
        <div className="flex">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <Stat label="Aportes" value={formatPYG(fund.contributionsPYG)} />
          <Stat label="Valor actual" value={formatPYG(fund.currentValuePYG)} bold />
          <Stat
            label="P&L"
            value={`${pnl >= 0 ? "+" : ""}${formatPYG(pnl)} (${pnl >= 0 ? "+" : ""}${formatPct(pnlPct)})`}
            tone={pnl >= 0 ? "positive" : "negative"}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Aportar</label>
            <div className="flex gap-1">
              <MoneyInput className="num font-mono h-8" value={contrib} onValueChange={setContrib} placeholder="0" />
              <Button size="sm" variant="outline" onClick={() => {
                const n = Number(contrib);
                if (n > 0) { onContribute(fund.id, n); setContrib(""); setVal(String(fund.currentValuePYG + n)); }
              }}>+</Button>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Actualizar saldo</label>
            <div className="flex gap-1">
              <MoneyInput className="num font-mono h-8" value={val} onValueChange={setVal} />
              <Button size="sm" variant="outline" onClick={() => onSetValue(fund.id, Number(val) || 0)}>✓</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: "positive" | "negative" }) {
  return (
    <div className="rounded border bg-muted/40 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`num font-mono ${bold ? "font-semibold" : ""} ${
        tone === "positive" ? "text-[color:var(--color-positive)]" : tone === "negative" ? "text-[color:var(--color-negative)]" : ""
      }`}>{value}</div>
    </div>
  );
}
