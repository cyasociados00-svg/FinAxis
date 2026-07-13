import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addMonths, addWeeks, addDays } from "date-fns";
import { generateInstallments } from "./finance-math";
import { cloud, bg, fetchSnapshot } from "./cloud-sync";

export type TxType = "income" | "expense";
export type PayMethod = "cash" | "debit" | "credit";
export const EXPENSE_CATEGORIES = [
  "Supermercado",
  "Combustible",
  "Alimentación",
  "Vestimenta",
  "Alquiler",
  "Servicios",
  "Internet",
  "Seguros",
  "Salud",
  "Ocio",
  "Inversión",
  "Pago tarjeta",
  "Otros",
] as const;
export const INCOME_CATEGORIES = ["Ingreso Dependiente", "Ingreso Independiente"] as const;

export type Transaction = {
  id: string;
  date: string;
  amount: number;
  concept: string;
  category: string;
  type: TxType;
  method: PayMethod;
  cardId?: string;
  accountId?: string;
  installments?: number;
};
export type Installment = {
  id: string;
  transactionId: string;
  number: number;
  of: number;
  amount: number;
  dueDate: string;
  paid: boolean;
};
// createdAt added for date-validation: a tx can't predate its payment method
export type Account = {
  id: string;
  name: string;
  kind: "cash" | "debit";
  balancePYG: number;
  createdAt: string;
};
export type CreditCard = {
  id: string;
  name: string;
  limitPYG: number;
  balancePYG: number;
  closingDay: number;
  dueDay: number;
  tna: number;
  minPaymentPct: number;
  createdAt: string;
};
export type StockPosition = {
  id: string;
  symbol: string;
  name: string;
  qty: number;
  avgPriceUSD: number;
  currentPriceUSD: number;
};
export type CryptoPosition = {
  id: string;
  symbol: string;
  coingeckoId: string;
  qty: number;
  avgPriceUSD: number;
  currentPriceUSD: number;
};
export type CDA = {
  id: string;
  bank: string;
  capital: number;
  tna: number;
  issueDate: string;
  maturityDate: string;
};
export type MutualFund = {
  id: string;
  name: string;
  contributionsPYG: number;
  currentValuePYG: number;
};
export type ScheduledFrequency = "weekly" | "biweekly" | "monthly";
// Sentinel origin: money that pre-existed the app / is funded outside a tracked
// account. Recurring deposits with this source don't touch any account balance.
export const EXTERNAL_ORIGIN = "__previo__";
export type ProgrammedSaving = {
  id: string;
  name: string;
  sourceAccountId: string;      // account id for recurring deposits, or EXTERNAL_ORIGIN
  amountPYG: number;            // deposit per period
  frequency: ScheduledFrequency;
  tna: number;                  // fixed annual interest rate (%)
  termPeriods: number;          // total number of deposits (0 = open-ended)
  openingPYG: number;           // pre-existing balance at start (immutable)
  depositedPYG: number;         // principal: opening balance + all deposits
  balancePYG: number;           // principal + interest accrued up to lastAccrual
  goalPYG: number;              // target amount (0 = no goal); ignored when termPeriods > 0
  goalDate?: string;            // optional target date (ISO)
  nextRun: string;              // next scheduled deposit (ISO)
  lastAccrual: string;          // last date interest was accrued (ISO)
  active: boolean;
  createdAt: string;
};

// ─── State type ───────────────────────────────────────────────────────────────

type State = {
  hydrated: boolean;
  exchangeRate: number;
  accounts: Account[];
  cards: CreditCard[];
  transactions: Transaction[];
  installments: Installment[];
  stocks: StockPosition[];
  crypto: CryptoPosition[];
  cdas: CDA[];
  funds: MutualFund[];
  programmedSavings: ProgrammedSaving[];

  hydrate: () => Promise<void>;
  clearLocal: () => void;

  setExchangeRate: (n: number) => void;
  addAccount: (a: Omit<Account, "id" | "createdAt">) => void;
  updateAccount: (id: string, patch: Partial<Omit<Account, "id" | "createdAt">>) => void;
  deleteAccount: (id: string) => void;
  addTransaction: (t: Omit<Transaction, "id" | "date"> & { date?: string }) => void;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, "id">>) => void;
  deleteTransaction: (id: string) => void;
  addCard: (c: Omit<CreditCard, "id" | "createdAt">) => void;
  updateCard: (id: string, patch: Partial<Omit<CreditCard, "id" | "createdAt">>) => void;
  deleteCard: (id: string) => void;
  addStock: (s: Omit<StockPosition, "id">) => void;
  buyStock: (s: Omit<StockPosition, "id">) => { merged: boolean; id: string };
  updateStock: (id: string, patch: Partial<Omit<StockPosition, "id">>) => void;
  deleteStock: (id: string) => void;
  updateStockPrice: (id: string, price: number) => void;
  addCrypto: (c: Omit<CryptoPosition, "id">) => void;
  buyCrypto: (c: Omit<CryptoPosition, "id">) => { merged: boolean; id: string };
  updateCrypto: (id: string, patch: Partial<Omit<CryptoPosition, "id">>) => void;
  deleteCrypto: (id: string) => void;
  updateCryptoPrice: (id: string, price: number) => void;
  addCDA: (c: Omit<CDA, "id">) => void;
  updateCDA: (id: string, patch: Partial<Omit<CDA, "id">>) => void;
  removeCDA: (id: string) => void;
  addCDACapital: (id: string, amount: number) => void;
  addFund: (f: Omit<MutualFund, "id">) => void;
  updateFund: (id: string, patch: Partial<Omit<MutualFund, "id">>) => void;
  deleteFund: (id: string) => void;
  addFundContribution: (id: string, amount: number) => void;
  setFundValue: (id: string, value: number) => void;
  payInstallment: (id: string, opts?: { accountId?: string }) => void;
  addProgrammedSaving: (s: Omit<ProgrammedSaving, "id" | "createdAt" | "depositedPYG" | "balancePYG" | "lastAccrual">) => void;
  updateProgrammedSaving: (id: string, patch: Partial<Omit<ProgrammedSaving, "id">>) => void;
  deleteProgrammedSaving: (id: string) => void;
  depositToSaving: (id: string, amountPYG: number, accountId?: string) => void;
  runProgrammedSavings: () => void;
  resetData: () => Promise<void>;
};

// ─── Initial state ────────────────────────────────────────────────────────────

const initial: Omit<
  State,
  | "hydrate"
  | "clearLocal"
  | "setExchangeRate"
  | "addAccount"
  | "updateAccount"
  | "deleteAccount"
  | "addTransaction"
  | "updateTransaction"
  | "deleteTransaction"
  | "addCard"
  | "updateCard"
  | "deleteCard"
  | "addStock"
  | "buyStock"
  | "updateStock"
  | "deleteStock"
  | "updateStockPrice"
  | "addCrypto"
  | "buyCrypto"
  | "updateCrypto"
  | "deleteCrypto"
  | "updateCryptoPrice"
  | "addCDA"
  | "updateCDA"
  | "removeCDA"
  | "addCDACapital"
  | "addFund"
  | "updateFund"
  | "deleteFund"
  | "addFundContribution"
  | "setFundValue"
  | "payInstallment"
  | "addProgrammedSaving"
  | "updateProgrammedSaving"
  | "deleteProgrammedSaving"
  | "depositToSaving"
  | "runProgrammedSavings"
  | "resetData"
> = {
  hydrated: false,
  exchangeRate: 7500,
  accounts: [],
  cards: [],
  transactions: [],
  installments: [],
  stocks: [],
  crypto: [],
  cdas: [],
  funds: [],
  programmedSavings: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function advance(dateISO: string, freq: ScheduledFrequency): string {
  const d = new Date(dateISO);
  if (freq === "weekly") return addWeeks(d, 1).toISOString();
  if (freq === "biweekly") return addWeeks(d, 2).toISOString();
  return addMonths(d, 1).toISOString();
}

function revertTxEffects(state: State, tx: Transaction) {
  let cards = state.cards;
  let accounts = state.accounts;
  let installments = state.installments;

  if (tx.method === "credit" && tx.cardId) {
    cards = cards.map((c) => (c.id === tx.cardId ? { ...c, balancePYG: c.balancePYG - tx.amount } : c));
    installments = installments.filter((i) => i.transactionId !== tx.id);
    const card = cards.find((c) => c.id === tx.cardId);
    if (card) bg(cloud.saveCard(card));
    bg(cloud.deleteInstallmentsByTx(tx.id));
  } else if ((tx.method === "cash" || tx.method === "debit") && tx.accountId) {
    accounts = accounts.map((a) => {
      if (a.id !== tx.accountId) return a;
      const delta = tx.type === "income" ? -tx.amount : tx.amount;
      return { ...a, balancePYG: a.balancePYG + delta };
    });
    const acc = accounts.find((a) => a.id === tx.accountId);
    if (acc) bg(cloud.saveAccount(acc));
  }
  return { cards, accounts, installments };
}

function applyTxEffects(cards: CreditCard[], accounts: Account[], installments: Installment[], tx: Transaction) {
  let nextCards = cards;
  let nextAccounts = accounts;
  let nextInst = installments;
  let newInst: Installment[] = [];

  if (tx.method === "credit" && tx.cardId) {
    nextCards = cards.map((c) => (c.id === tx.cardId ? { ...c, balancePYG: c.balancePYG + tx.amount } : c));
    if (tx.installments && tx.installments > 1) {
      newInst = generateInstallments(tx.id, tx.amount, tx.installments, new Date(tx.date));
      nextInst = [...installments, ...newInst];
    }
    const card = nextCards.find((c) => c.id === tx.cardId);
    if (card) bg(cloud.saveCard(card));
    if (newInst.length) bg(cloud.saveInstallments(newInst));
  } else if ((tx.method === "cash" || tx.method === "debit") && tx.accountId) {
    nextAccounts = accounts.map((a) => {
      if (a.id !== tx.accountId) return a;
      const delta = tx.type === "income" ? tx.amount : -tx.amount;
      return { ...a, balancePYG: a.balancePYG + delta };
    });
    const acc = nextAccounts.find((a) => a.id === tx.accountId);
    if (acc) bg(cloud.saveAccount(acc));
  }
  return { cards: nextCards, accounts: nextAccounts, installments: nextInst };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,

      hydrate: async () => {
        const snap = await fetchSnapshot();
        if (!snap) return;
        set({ ...snap, hydrated: true } as Partial<State>);
      },

      clearLocal: () => set({ ...initial, hydrated: true }),

      setExchangeRate: (n) => {
        set({ exchangeRate: n });
        bg(cloud.saveExchangeRate(n));
      },

      // ── Accounts ────────────────────────────────────────────────────────────
      addAccount: (a) => {
        const acc: Account = { ...a, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ accounts: [...s.accounts, acc] }));
        bg(cloud.saveAccount(acc));
      },
      updateAccount: (id, patch) =>
        set((s) => {
          const next = s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a));
          const updated = next.find((a) => a.id === id);
          if (updated) bg(cloud.saveAccount(updated));
          return { accounts: next };
        }),
      deleteAccount: (id) => {
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
        bg(cloud.deleteAccount(id));
      },

      // ── Transactions ─────────────────────────────────────────────────────────
      addTransaction: (t) => {
        const id = uid();
        const date = t.date ?? new Date().toISOString();
        const tx: Transaction = { ...t, id, date };
        set((s) => {
          const eff = applyTxEffects(s.cards, s.accounts, s.installments, tx);
          return { transactions: [tx, ...s.transactions], ...eff };
        });
        bg(cloud.saveTransaction(tx));
      },
      updateTransaction: (id, patch) =>
        set((s) => {
          const prev = s.transactions.find((t) => t.id === id);
          if (!prev) return {};
          const reverted = revertTxEffects(s, prev);
          const next: Transaction = { ...prev, ...patch };
          const eff = applyTxEffects(reverted.cards, reverted.accounts, reverted.installments, next);
          bg(cloud.saveTransaction(next));
          return { transactions: s.transactions.map((t) => (t.id === id ? next : t)), ...eff };
        }),
      deleteTransaction: (id) =>
        set((s) => {
          const prev = s.transactions.find((t) => t.id === id);
          if (!prev) return {};
          const eff = revertTxEffects(s, prev);
          bg(cloud.deleteTransaction(id));
          return { transactions: s.transactions.filter((t) => t.id !== id), ...eff };
        }),

      // ── Cards ────────────────────────────────────────────────────────────────
      addCard: (c) => {
        const card: CreditCard = { ...c, id: uid(), createdAt: new Date().toISOString() };
        set((s) => ({ cards: [...s.cards, card] }));
        bg(cloud.saveCard(card));
      },
      updateCard: (id, patch) =>
        set((s) => {
          const next = s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c));
          const u = next.find((c) => c.id === id);
          if (u) bg(cloud.saveCard(u));
          return { cards: next };
        }),
      deleteCard: (id) => {
        set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }));
        bg(cloud.deleteCard(id));
      },

      // ── Stocks ───────────────────────────────────────────────────────────────
      addStock: (p) => {
        const s: StockPosition = { ...p, id: uid() };
        set((st) => ({ stocks: [...st.stocks, s] }));
        bg(cloud.saveStock(s));
      },
      buyStock: (p) => {
        const sym = p.symbol.toUpperCase();
        const existing = get().stocks.find((x) => x.symbol.toUpperCase() === sym);
        if (existing) {
          const newQty = existing.qty + p.qty;
          const newAvg = newQty > 0 ? (existing.qty * existing.avgPriceUSD + p.qty * p.avgPriceUSD) / newQty : 0;
          const merged: StockPosition = {
            ...existing,
            qty: newQty,
            avgPriceUSD: newAvg,
            currentPriceUSD: p.currentPriceUSD || existing.currentPriceUSD,
          };
          set((st) => ({ stocks: st.stocks.map((x) => (x.id === existing.id ? merged : x)) }));
          bg(cloud.saveStock(merged));
          return { merged: true, id: existing.id };
        }
        const s: StockPosition = { ...p, symbol: sym, id: uid() };
        set((st) => ({ stocks: [...st.stocks, s] }));
        bg(cloud.saveStock(s));
        return { merged: false, id: s.id };
      },
      updateStock: (id, patch) =>
        set((s) => {
          const next = s.stocks.map((p) => (p.id === id ? { ...p, ...patch } : p));
          const u = next.find((p) => p.id === id);
          if (u) bg(cloud.saveStock(u));
          return { stocks: next };
        }),
      deleteStock: (id) => {
        set((s) => ({ stocks: s.stocks.filter((p) => p.id !== id) }));
        bg(cloud.deleteStock(id));
      },
      updateStockPrice: (id, price) =>
        set((s) => ({
          stocks: s.stocks.map((p) => (p.id === id ? { ...p, currentPriceUSD: price } : p)),
        })),

      // ── Crypto ───────────────────────────────────────────────────────────────
      addCrypto: (c) => {
        const cr: CryptoPosition = { ...c, id: uid() };
        set((s) => ({ crypto: [...s.crypto, cr] }));
        bg(cloud.saveCrypto(cr));
      },
      buyCrypto: (c) => {
        const cgId = c.coingeckoId.toLowerCase();
        const existing = get().crypto.find((x) => x.coingeckoId.toLowerCase() === cgId);
        if (existing) {
          const newQty = existing.qty + c.qty;
          const newAvg = newQty > 0 ? (existing.qty * existing.avgPriceUSD + c.qty * c.avgPriceUSD) / newQty : 0;
          const merged: CryptoPosition = {
            ...existing,
            qty: newQty,
            avgPriceUSD: newAvg,
            currentPriceUSD: c.currentPriceUSD || existing.currentPriceUSD,
          };
          set((st) => ({ crypto: st.crypto.map((x) => (x.id === existing.id ? merged : x)) }));
          bg(cloud.saveCrypto(merged));
          return { merged: true, id: existing.id };
        }
        const cr: CryptoPosition = { ...c, coingeckoId: cgId, id: uid() };
        set((s) => ({ crypto: [...s.crypto, cr] }));
        bg(cloud.saveCrypto(cr));
        return { merged: false, id: cr.id };
      },
      updateCrypto: (id, patch) =>
        set((s) => {
          const next = s.crypto.map((p) => (p.id === id ? { ...p, ...patch } : p));
          const u = next.find((p) => p.id === id);
          if (u) bg(cloud.saveCrypto(u));
          return { crypto: next };
        }),
      deleteCrypto: (id) => {
        set((s) => ({ crypto: s.crypto.filter((p) => p.id !== id) }));
        bg(cloud.deleteCrypto(id));
      },
      updateCryptoPrice: (id, price) =>
        set((s) => ({
          crypto: s.crypto.map((p) => (p.id === id ? { ...p, currentPriceUSD: price } : p)),
        })),

      // ── CDAs ─────────────────────────────────────────────────────────────────
      addCDA: (c) => {
        const cda: CDA = { ...c, id: uid() };
        set((s) => ({ cdas: [...s.cdas, cda] }));
        bg(cloud.saveCDA(cda));
      },
      updateCDA: (id, patch) =>
        set((s) => {
          const next = s.cdas.map((c) => (c.id === id ? { ...c, ...patch } : c));
          const u = next.find((c) => c.id === id);
          if (u) bg(cloud.saveCDA(u));
          return { cdas: next };
        }),
      removeCDA: (id) => {
        set((s) => ({ cdas: s.cdas.filter((c) => c.id !== id) }));
        bg(cloud.deleteCDA(id));
      },
      addCDACapital: (id, amount) =>
        set((s) => {
          const next = s.cdas.map((c) => (c.id === id ? { ...c, capital: c.capital + amount } : c));
          const u = next.find((c) => c.id === id);
          if (u) bg(cloud.saveCDA(u));
          return { cdas: next };
        }),

      // ── Funds ────────────────────────────────────────────────────────────────
      addFund: (f) => {
        const fund: MutualFund = { ...f, id: uid() };
        set((s) => ({ funds: [...s.funds, fund] }));
        bg(cloud.saveFund(fund));
      },
      updateFund: (id, patch) =>
        set((s) => {
          const next = s.funds.map((f) => (f.id === id ? { ...f, ...patch } : f));
          const u = next.find((f) => f.id === id);
          if (u) bg(cloud.saveFund(u));
          return { funds: next };
        }),
      deleteFund: (id) => {
        set((s) => ({ funds: s.funds.filter((f) => f.id !== id) }));
        bg(cloud.deleteFund(id));
      },
      addFundContribution: (id, amount) =>
        set((s) => {
          const next = s.funds.map((f) =>
            f.id === id
              ? { ...f, contributionsPYG: f.contributionsPYG + amount, currentValuePYG: f.currentValuePYG + amount }
              : f,
          );
          const u = next.find((f) => f.id === id);
          if (u) bg(cloud.saveFund(u));
          return { funds: next };
        }),
      setFundValue: (id, value) =>
        set((s) => {
          const next = s.funds.map((f) => (f.id === id ? { ...f, currentValuePYG: value } : f));
          const u = next.find((f) => f.id === id);
          if (u) bg(cloud.saveFund(u));
          return { funds: next };
        }),

      // ── Installments ─────────────────────────────────────────────────────────
      payInstallment: (id, opts) => {
        const state = get();
        const inst = state.installments.find((i) => i.id === id);
        if (!inst || inst.paid) return;
        const parentTx = state.transactions.find((t) => t.id === inst.transactionId);
        const cardId = parentTx?.cardId;

        set((s) => {
          const installments = s.installments.map((i) => (i.id === id ? { ...i, paid: true } : i));
          const cards = cardId
            ? s.cards.map((c) => (c.id === cardId ? { ...c, balancePYG: Math.max(0, c.balancePYG - inst.amount) } : c))
            : s.cards;
          const updatedInst = installments.find((i) => i.id === id);
          if (updatedInst) bg(cloud.saveInstallment(updatedInst));
          if (cardId) {
            const card = cards.find((c) => c.id === cardId);
            if (card) bg(cloud.saveCard(card));
          }
          return { installments, cards };
        });

        if (opts?.accountId) {
          get().addTransaction({
            type: "expense",
            method: "debit",
            amount: inst.amount,
            concept: `Cuota ${inst.number}/${inst.of}${parentTx ? ` · ${parentTx.concept}` : ""}`,
            category: "Pago tarjeta",
            accountId: opts.accountId,
          });
        }
      },

      // ── Programmed savings ───────────────────────────────────────────────────
      addProgrammedSaving: (s) => {
        const opening = s.openingPYG ?? 0;
        const nowISO = new Date().toISOString();
        const saving: ProgrammedSaving = {
          ...s,
          openingPYG: opening,
          id: uid(),
          depositedPYG: opening,
          balancePYG: opening,
          lastAccrual: nowISO,
          createdAt: nowISO,
        };
        set((st) => ({ programmedSavings: [...st.programmedSavings, saving] }));
        bg(cloud.saveProgrammedSaving(saving));
      },
      updateProgrammedSaving: (id, patch) =>
        set((s) => {
          const next = s.programmedSavings.map((x) => (x.id === id ? { ...x, ...patch } : x));
          const u = next.find((x) => x.id === id);
          if (u) bg(cloud.saveProgrammedSaving(u));
          return { programmedSavings: next };
        }),
      deleteProgrammedSaving: (id) => {
        set((s) => ({ programmedSavings: s.programmedSavings.filter((x) => x.id !== id) }));
        bg(cloud.deleteProgrammedSaving(id));
      },
      // Add a one-off deposit now. Accrues pending interest first, then adds the
      // deposit to both principal and balance. Deducts from an account unless the
      // source is external / capital previo.
      depositToSaving: (id, amountPYG, accountId) => {
        if (amountPYG <= 0) return;
        const sv = get().programmedSavings.find((x) => x.id === id);
        if (!sv) return;
        const src = accountId ?? sv.sourceAccountId;
        if (src && src !== EXTERNAL_ORIGIN) {
          const acc = get().accounts.find((a) => a.id === src);
          if (acc) {
            get().addTransaction({
              type: "expense",
              method: acc.kind,
              amount: amountPYG,
              concept: `Ahorro programado · ${sv.name}`,
              category: "Ahorro",
              accountId: src,
            });
          }
        }
        const nowISO = new Date().toISOString();
        const days = Math.max(0, (Date.now() - new Date(sv.lastAccrual).getTime()) / 86400000);
        const interest = sv.balancePYG * (sv.tna / 100) * (days / 365);
        get().updateProgrammedSaving(id, {
          depositedPYG: sv.depositedPYG + amountPYG,
          balancePYG: sv.balancePYG + interest + amountPYG,
          lastAccrual: nowISO,
        });
      },
      runProgrammedSavings: () => {
        const now = new Date();
        const list = get().programmedSavings;
        for (const s of list) {
          if (!s.active) continue;
          let next = s.nextRun;
          let safety = 0;
          while (new Date(next) <= now && safety < 120) {
            const external = !s.sourceAccountId || s.sourceAccountId === EXTERNAL_ORIGIN;
            const acc = external ? null : get().accounts.find((a) => a.id === s.sourceAccountId);
            // If funded from an account, require sufficient balance to proceed.
            if (!external && (!acc || acc.balancePYG < s.amountPYG)) break;

            if (acc) {
              get().addTransaction({
                type: "expense",
                method: acc.kind,
                amount: s.amountPYG,
                concept: `Ahorro programado · ${s.name}`,
                category: "Ahorro",
                accountId: s.sourceAccountId,
                date: next,
              });
            }

            // Accrue interest on the running balance up to this deposit date,
            // then add the deposit to principal + balance.
            const cur = get().programmedSavings.find((x) => x.id === s.id);
            if (!cur) break;
            const days = Math.max(0, (new Date(next).getTime() - new Date(cur.lastAccrual).getTime()) / 86400000);
            const interest = cur.balancePYG * (cur.tna / 100) * (days / 365);
            get().updateProgrammedSaving(s.id, {
              depositedPYG: cur.depositedPYG + s.amountPYG,
              balancePYG: cur.balancePYG + interest + s.amountPYG,
              lastAccrual: next,
              nextRun: advance(next, s.frequency),
            });

            next = advance(next, s.frequency);
            safety++;
          }
        }
      },

      resetData: async () => {
        await cloud.wipeAll();
        set({ ...initial, hydrated: true });
      },
    }),
    {
      name: "treasury-store",
      partialize: (state) => ({
        exchangeRate: state.exchangeRate,
        accounts: state.accounts,
        cards: state.cards,
        transactions: state.transactions,
        installments: state.installments,
        stocks: state.stocks,
        crypto: state.crypto,
        cdas: state.cdas,
        funds: state.funds,
        programmedSavings: state.programmedSavings,
        hydrated: state.hydrated,
      }),
    },
  ),
);

// ─── Utilities ────────────────────────────────────────────────────────────────

export function computeFirstRun(dayOfMonth: number, fromDate: Date = new Date()): string {
  const d = new Date(fromDate);
  const target = new Date(d.getFullYear(), d.getMonth(), Math.max(1, Math.min(28, dayOfMonth)));
  if (target <= d) target.setMonth(target.getMonth() + 1);
  return target.toISOString();
}

export function purchaseFromAccount(args: {
  accountId: string;
  method: "cash" | "debit";
  amountPYG: number;
  concept: string;
  date?: string;
}) {
  useStore.getState().addTransaction({
    type: "expense",
    method: args.method,
    amount: args.amountPYG,
    concept: args.concept,
    category: "Inversión",
    accountId: args.accountId,
    date: args.date,
  });
}

export const useTotals = () => {
  const s = useStore();
  const cashPYG = s.accounts.reduce((a, x) => a + Number(x.balancePYG || 0), 0);
  const debtPYG = s.cards.reduce((a, x) => a + Number(x.balancePYG || 0), 0);
  const stocksUSD = s.stocks.reduce((a, x) => a + x.qty * x.currentPriceUSD, 0);
  const cryptoUSD = s.crypto.reduce((a, x) => a + x.qty * x.currentPriceUSD, 0);
  const stocksPYG = stocksUSD * s.exchangeRate;
  const cryptoPYG = cryptoUSD * s.exchangeRate;
  const fundsPYG = s.funds.reduce((a, x) => a + x.currentValuePYG, 0);
  const cdasPYG = s.cdas.reduce((a, c) => {
    const now = new Date();
    const issued = new Date(c.issueDate);
    const matures = new Date(c.maturityDate);
    const ref = now > matures ? matures : now;
    const days = Math.max(0, (ref.getTime() - issued.getTime()) / 86400000);
    return a + c.capital + (c.capital * (c.tna / 100) * days) / 365;
  }, 0);
  const futureInstallments = s.installments.filter((i) => !i.paid).reduce((a, x) => a + x.amount, 0);
  const liquid = cashPYG;
  // contingent = card balance only; futureInstallments are already included in debtPYG
  const contingent = debtPYG;
  const net = liquid + cdasPYG + fundsPYG + stocksPYG + cryptoPYG - debtPYG;
  return {
    cashPYG,
    debtPYG,
    stocksUSD,
    stocksPYG,
    cryptoUSD,
    cryptoPYG,
    fundsPYG,
    cdasPYG,
    futureInstallments,
    liquid,
    contingent,
    net,
  };
};

// silence unused import warning
void addDays;
