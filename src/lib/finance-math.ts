import { addDays, addMonths, differenceInDays, format, startOfMonth } from "date-fns";
import type { CDA, Installment, Transaction } from "./store";

type Freq = "weekly" | "biweekly" | "monthly";

// Date of a deposit k periods after a start date.
export function addPeriods(dateISO: string, freq: Freq, k: number): Date {
  const d = new Date(dateISO);
  if (freq === "weekly") return addDays(d, 7 * k);
  if (freq === "biweekly") return addDays(d, 14 * k);
  return addMonths(d, k);
}

// Whole periods between two dates for a frequency (used to derive plazo).
export function periodsBetween(startISO: string, endISO: string, freq: Freq): number {
  const days = Math.max(0, differenceInDays(new Date(endISO), new Date(startISO)));
  if (freq === "weekly") return Math.round(days / 7);
  if (freq === "biweekly") return Math.round(days / 14);
  // months
  const s = new Date(startISO);
  const e = new Date(endISO);
  return Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
}

// Derived state of a programmed savings plan as of `asOf`.
// Deposits fall at start + k periods (k = 1..term); the last one lands on the
// end date. Already-elapsed deposits are treated as capital already contributed.
export function savingSchedule(
  s: { amountPYG: number; frequency: Freq; termPeriods: number; startDate: string; tna: number; openingPYG: number },
  asOf: Date = new Date(),
) {
  const term = Math.max(0, Math.floor(s.termPeriods || 0));
  const meta = s.amountPYG * term;                        // total to save (no interest)
  const start = new Date(s.startDate);
  // Guard against missing/invalid start date (e.g. legacy records) so callers
  // never crash on an Invalid Date .toISOString().
  if (isNaN(start.getTime()) || term === 0) {
    return {
      meta, endDate: new Date().toISOString(), elapsed: 0, pendingCount: term,
      aportadoCuotas: 0, aportado: s.openingPYG || 0, pending: meta, estimadoConInteres: 0,
    };
  }
  const endDate = addPeriods(s.startDate, s.frequency, term).toISOString();
  let elapsed = 0;
  for (let k = 1; k <= term; k++) {
    if (addPeriods(s.startDate, s.frequency, k) <= asOf) elapsed++;
  }
  const pendingCount = Math.max(0, term - elapsed);
  const aportadoCuotas = elapsed * s.amountPYG;
  const aportado = aportadoCuotas + (s.openingPYG || 0);  // opening adds to progress, not to meta
  const pending = pendingCount * s.amountPYG;
  const est = savingsProjection({ amount: s.amountPYG, periods: term, annualRatePct: s.tna, freq: s.frequency });
  return { meta, endDate, elapsed, pendingCount, aportadoCuotas, aportado, pending, estimadoConInteres: est.finalValue };
}

export const monthlyInstallment = (amount: number, n: number) => amount / n;

// Installment ids must be valid UUIDs — the Supabase `installments.id` column
// is uuid, so a composite id like `${txId}-${k}` fails to insert and the row
// never persists to the cloud.
const uuid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const generateInstallments = (
  transactionId: string,
  amount: number,
  n: number,
  startDate: Date,
): Installment[] => {
  const per = monthlyInstallment(amount, n);
  return Array.from({ length: n }, (_, i) => ({
    id: uuid(),
    transactionId,
    number: i + 1,
    of: n,
    amount: per,
    dueDate: addMonths(startDate, i + 1).toISOString(),
    paid: false,
  }));
};

export const cdaAccrual = (cda: CDA, asOf: Date = new Date()) => {
  const issued = new Date(cda.issueDate);
  const matures = new Date(cda.maturityDate);
  const ref = asOf > matures ? matures : asOf;
  const days = Math.max(0, differenceInDays(ref, issued));
  const interest = (cda.capital * (cda.tna / 100) * days) / 365;
  return {
    days,
    interest,
    currentValue: cda.capital + interest,
    maturityValue:
      cda.capital +
      (cda.capital * (cda.tna / 100) * differenceInDays(matures, issued)) / 365,
    daysToMaturity: Math.max(0, differenceInDays(matures, asOf)),
  };
};

export const periodsPerYear = (freq: "weekly" | "biweekly" | "monthly") =>
  freq === "weekly" ? 52 : freq === "biweekly" ? 26 : 12;

// Projected maturity value of a fixed-term programmed savings.
// A series of equal deposits (annuity-due: deposited at the start of each
// period, which matches how banks debit early in the month) plus an optional
// opening balance, all growing at a fixed annual rate.
export const savingsProjection = (params: {
  amount: number;        // deposit per period
  periods: number;       // total number of deposits (term)
  annualRatePct: number; // fixed annual rate (TNA)
  freq: "weekly" | "biweekly" | "monthly";
  opening?: number;      // pre-existing balance at start
}) => {
  const ppy = periodsPerYear(params.freq);
  const i = params.annualRatePct / 100 / ppy;
  const n = Math.max(0, Math.floor(params.periods));
  const opening = params.opening ?? 0;
  const deposited = params.amount * n + opening;
  let finalValue: number;
  if (i === 0) {
    finalValue = deposited;
  } else {
    const annuityDue = params.amount * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
    finalValue = opening * Math.pow(1 + i, n) + annuityDue;
  }
  return { deposited, finalValue, interest: finalValue - deposited };
};

export const arbitrageAnalysis = (
  balance: number,
  cardTNA: number,
  investTNA: number,
) => {
  const monthlyCard = cardTNA / 12 / 100;
  const monthlyInvest = investTNA / 12 / 100;
  const costMonthly = balance * monthlyCard;
  const gainMonthly = balance * monthlyInvest;
  const net = gainMonthly - costMonthly;
  return {
    monthlyCard: monthlyCard * 100,
    monthlyInvest: monthlyInvest * 100,
    costMonthly,
    gainMonthly,
    net,
    positive: net > 0,
  };
};

export const futureInstallmentsByMonth = (
  installments: Installment[],
  months = 6,
) => {
  const buckets = new Map<string, number>();
  const start = startOfMonth(new Date());
  for (let i = 0; i < months; i++) {
    buckets.set(format(addMonths(start, i), "yyyy-MM"), 0);
  }
  for (const it of installments) {
    if (it.paid) continue;
    const key = format(startOfMonth(new Date(it.dueDate)), "yyyy-MM");
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + it.amount);
  }
  return Array.from(buckets, ([month, amount]) => ({ month, amount }));
};

export const monthlyIncomeExpense = (transactions: Transaction[], months = 6) => {
  const buckets: Record<
    string,
    {
      month: string;
      incomeFixed: number;
      incomeIndep: number;
      expenseFixed: number;
      expenseVar: number;
    }
  > = {};
  const start = startOfMonth(new Date());
  for (let i = months - 1; i >= 0; i--) {
    const key = format(addMonths(start, -i), "yyyy-MM");
    buckets[key] = {
      month: format(addMonths(start, -i), "MMM"),
      incomeFixed: 0,
      incomeIndep: 0,
      expenseFixed: 0,
      expenseVar: 0,
    };
  }
  for (const t of transactions) {
    const key = format(startOfMonth(new Date(t.date)), "yyyy-MM");
    const b = buckets[key];
    if (!b) continue;
    if (t.type === "income") {
      if (t.category === "Ingreso Dependiente") b.incomeFixed += t.amount;
      else b.incomeIndep += t.amount;
    } else {
      const fixedCats = ["Alquiler", "Servicios", "Internet", "Seguros"];
      if (fixedCats.includes(t.category)) b.expenseFixed += t.amount;
      else b.expenseVar += t.amount;
    }
  }
  return Object.values(buckets);
};
