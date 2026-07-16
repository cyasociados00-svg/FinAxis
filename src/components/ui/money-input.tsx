import * as React from "react";
import { Input } from "@/components/ui/input";

function formatMiles(raw: string) {
  const digits = (raw ?? "").toString().replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("es-PY");
}

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  /** Raw numeric value (digits only, no separators). */
  value: string | number;
  /** Called with the raw numeric string (digits only). */
  onValueChange: (raw: string) => void;
};

/**
 * PYG money input: shows thousands separators (es-PY: dots) while the parent
 * keeps the raw integer string. Use for guaraní amounts; keep the regular
 * Input for decimals/percentages.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, Props>(
  ({ value, onValueChange, inputMode, ...props }, ref) => (
    <Input
      ref={ref}
      type="text"
      inputMode={inputMode ?? "numeric"}
      value={formatMiles(String(value ?? ""))}
      onChange={(e) => onValueChange(e.target.value.replace(/\D/g, ""))}
      {...props}
    />
  ),
);
MoneyInput.displayName = "MoneyInput";
