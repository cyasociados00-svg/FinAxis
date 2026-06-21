const pygFmt = new Intl.NumberFormat("es-PY", {
  style: "decimal",
  maximumFractionDigits: 0,
});
const usdFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const pctFmt = new Intl.NumberFormat("es-PY", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatPYG = (n: number) => `₲ ${pygFmt.format(Math.round(n))}`;
export const formatUSD = (n: number) => `US$ ${usdFmt.format(n)}`;
export const formatPct = (n: number) => `${pctFmt.format(n)}%`;
export const formatNumber = (n: number, d = 0) =>
  new Intl.NumberFormat("es-PY", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);
export const formatDate = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
