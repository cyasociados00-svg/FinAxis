import { useStore } from "@/lib/store";
import { MoneyInput } from "@/components/ui/money-input";

export function ExchangeRateInput() {
  const rate = useStore((s) => s.exchangeRate);
  const setRate = useStore((s) => s.setExchangeRate);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground uppercase tracking-wider">TC USD/PYG</span>
      <MoneyInput
        value={rate}
        onValueChange={(raw) => setRate(Number(raw) || 0)}
        className="num h-8 w-28 text-right font-mono"
      />
    </div>
  );
}
