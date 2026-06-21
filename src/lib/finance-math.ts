import { addMonths, differenceInDays, format, startOfMonth } from "date-fns";
import type { CDA, Installment, Transaction } from "./store";

export const monthlyInstallment = (amount: number, n: number) => amount / n;

export const generateInstallments = (
  transactionId: string,
  amount: number,
  n: number,
  startDate: Date,
): Installment[] => {
  const per = monthlyInstallment(amount, n);
  return Array.from({ length: n }, (_, i) => ({
    id: `${transactionId}-${i + 1}`,
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
