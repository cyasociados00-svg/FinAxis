import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";

export function ExchangeRateInput() {
  const rate = useStore((s) => s.exchangeRate);
  const setRate = useStore((s) => s.setExchangeRate);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground uppercase tracking-wider">TC USD/PYG</span>
      <Input
        type="number"
        value={rate}
        onChange={(e) => setRate(Number(e.target.value) || 0)}
        className="num h-8 w-28 text-right font-mono"
      />
    </div>
  );
}
