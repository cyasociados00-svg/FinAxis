import { supabase as _supabase } from "@/integrations/supabase/client";
import { syncQueue } from "./sync-queue";
import { toast } from "sonner";
import type {
  Account,
  CDA,
  CreditCard,
  CryptoPosition,
  Installment,
  MutualFund,
  ProgrammedSaving,
  StockPosition,
  Transaction,
} from "./store";

const supabase = _supabase as any;

// ─── Mappers ─────────────────────────────────────────────────────────────────

export const accountFromRow = (r: any): Account => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  balancePYG: Number(r.balance_pyg) || 0,
  createdAt: r.created_at ?? new Date().toISOString(),
});
const accountToRow = (a: Account, uid: string) => ({
  id: a.id,
  user_id: uid,
  name: a.name,
  kind: a.kind,
  balance_pyg: a.balancePYG,
});

export const cardFromRow = (r: any): CreditCard => ({
  id: r.id,
  name: r.name,
  limitPYG: Number(r.limit_pyg),
  balancePYG: Number(r.balance_pyg),
  closingDay: r.closing_day,
  dueDay: r.due_day,
  tna: Number(r.tna),
  minPaymentPct: Number(r.min_payment_pct),
  createdAt: r.created_at ?? new Date().toISOString(),
});
const cardToRow = (c: CreditCard, uid: string) => ({
  id: c.id,
  user_id: uid,
  name: c.name,
  limit_pyg: c.limitPYG,
  balance_pyg: c.balancePYG,
  closing_day: c.closingDay,
  due_day: c.dueDay,
  tna: c.tna,
  min_payment_pct: c.minPaymentPct,
});

export const txFromRow = (r: any): Transaction => ({
  id: r.id,
  date: r.date,
  amount: Number(r.amount),
  concept: r.concept,
  category: r.category,
  type: r.type,
  method: r.method,
  cardId: r.card_id ?? undefined,
  accountId: r.account_id ?? undefined,
  installments: r.installments ?? undefined,
});
const txToRow = (t: Transaction, uid: string) => ({
  id: t.id,
  user_id: uid,
  date: t.date,
  amount: t.amount,
  concept: t.concept,
  category: t.category,
  type: t.type,
  method: t.method,
  card_id: t.cardId ?? null,
  account_id: t.accountId ?? null,
  installments: t.installments ?? null,
});

export const instFromRow = (r: any): Installment => ({
  id: r.id,
  transactionId: r.transaction_id,
  number: r.number,
  of: r.of,
  amount: Number(r.amount),
  dueDate: r.due_date,
  paid: r.paid,
});
const instToRow = (i: Installment, uid: string) => ({
  id: i.id,
  user_id: uid,
  transaction_id: i.transactionId,
  number: i.number,
  of: i.of,
  amount: i.amount,
  due_date: i.dueDate,
  paid: i.paid,
});

export const stockFromRow = (r: any): StockPosition => ({
  id: r.id,
  symbol: r.symbol,
  name: r.name,
  qty: Number(r.qty),
  avgPriceUSD: Number(r.avg_price_usd),
  currentPriceUSD: Number(r.current_price_usd),
});
const stockToRow = (s: StockPosition, uid: string) => ({
  id: s.id,
  user_id: uid,
  symbol: s.symbol,
  name: s.name,
  qty: s.qty,
  avg_price_usd: s.avgPriceUSD,
  current_price_usd: s.currentPriceUSD,
});

export const cryptoFromRow = (r: any): CryptoPosition => ({
  id: r.id,
  symbol: r.symbol,
  coingeckoId: r.coingecko_id,
  qty: Number(r.qty),
  avgPriceUSD: Number(r.avg_price_usd),
  currentPriceUSD: Number(r.current_price_usd),
});
const cryptoToRow = (c: CryptoPosition, uid: string) => ({
  id: c.id,
  user_id: uid,
  symbol: c.symbol,
  coingecko_id: c.coingeckoId,
  qty: c.qty,
  avg_price_usd: c.avgPriceUSD,
  current_price_usd: c.currentPriceUSD,
});

export const cdaFromRow = (r: any): CDA => ({
  id: r.id,
  bank: r.bank,
  capital: Number(r.capital),
  tna: Number(r.tna),
  issueDate: r.issue_date,
  maturityDate: r.maturity_date,
});
const cdaToRow = (c: CDA, uid: string) => ({
  id: c.id,
  user_id: uid,
  bank: c.bank,
  capital: c.capital,
  tna: c.tna,
  issue_date: c.issueDate,
  maturity_date: c.maturityDate,
});

export const fundFromRow = (r: any): MutualFund => ({
  id: r.id,
  name: r.name,
  contributionsPYG: Number(r.contributions_pyg),
  currentValuePYG: Number(r.current_value_pyg),
});
const fundToRow = (f: MutualFund, uid: string) => ({
  id: f.id,
  user_id: uid,
  name: f.name,
  contributions_pyg: f.contributionsPYG,
  current_value_pyg: f.currentValuePYG,
});

export const savingFromRow = (r: any): ProgrammedSaving => ({
  id: r.id,
  name: r.name,
  sourceAccountId: r.source_account_id ?? "",
  amountPYG: Number(r.amount_pyg) || 0,
  frequency: r.frequency,
  tna: Number(r.tna) || 0,
  depositedPYG: Number(r.deposited_pyg) || 0,
  balancePYG: Number(r.balance_pyg) || 0,
  goalPYG: Number(r.goal_pyg) || 0,
  goalDate: r.goal_date ?? undefined,
  nextRun: r.next_run,
  lastAccrual: r.last_accrual,
  active: r.active,
  createdAt: r.created_at ?? new Date().toISOString(),
});
const savingToRow = (s: ProgrammedSaving, uid: string) => ({
  id: s.id,
  user_id: uid,
  name: s.name,
  source_account_id: s.sourceAccountId,
  amount_pyg: s.amountPYG,
  frequency: s.frequency,
  tna: s.tna,
  deposited_pyg: s.depositedPYG,
  balance_pyg: s.balancePYG,
  goal_pyg: s.goalPYG,
  goal_date: s.goalDate ?? null,
  next_run: s.nextRun,
  last_accrual: s.lastAccrual,
  active: s.active,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function userId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function isOnline() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function check(error: any, ctx: string) {
  if (!error) return;
  console.error(`[Cloud] ${ctx}:`, error);
  toast.error(`Error guardando (${ctx}): ${error.message ?? error}`);
  throw error;
}

// ─── Snapshot (hydrate from Supabase) ────────────────────────────────────────

export type CloudSnapshot = {
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
};

export async function fetchSnapshot(): Promise<CloudSnapshot | null> {
  const uid = await userId();
  if (!uid) return null;

  const [a, c, t, i, s, cr, cd, f, ps, st] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", uid).order("created_at"),
    supabase.from("cards").select("*").eq("user_id", uid).order("created_at"),
    supabase.from("transactions").select("*").eq("user_id", uid).order("date", { ascending: false }),
    supabase.from("installments").select("*").eq("user_id", uid),
    supabase.from("stocks").select("*").eq("user_id", uid),
    supabase.from("crypto").select("*").eq("user_id", uid),
    supabase.from("cdas").select("*").eq("user_id", uid),
    supabase.from("funds").select("*").eq("user_id", uid),
    supabase.from("programmed_savings").select("*").eq("user_id", uid).order("created_at"),
    supabase.from("settings").select("exchange_rate").eq("user_id", uid).maybeSingle(),
  ]);

  for (const r of [a, c, t, i, s, cr, cd, f, ps]) check(r.error, "hydrate");

  return {
    exchangeRate: Number(st.data?.exchange_rate ?? 7500),
    accounts: (a.data ?? []).map(accountFromRow),
    cards: (c.data ?? []).map(cardFromRow),
    transactions: (t.data ?? []).map(txFromRow),
    installments: (i.data ?? []).map(instFromRow),
    stocks: (s.data ?? []).map(stockFromRow),
    crypto: (cr.data ?? []).map(cryptoFromRow),
    cdas: (cd.data ?? []).map(cdaFromRow),
    funds: (f.data ?? []).map(fundFromRow),
    programmedSavings: (ps.data ?? []).map(savingFromRow),
  };
}

// ─── Upsert / delete with offline queue fallback ──────────────────────────────

async function upsertRow(table: string, row: Record<string, unknown>) {
  const uid = await userId();
  if (!uid) return; // not logged in - don't queue, just skip

  const rowWithUid = { ...row, user_id: uid };

  if (!isOnline()) {
    syncQueue.push({ type: "upsert", table, row: rowWithUid });
    return;
  }

  const { error } = await supabase.from(table).upsert(rowWithUid);
  if (error) {
    // Network error -> queue for later
    console.warn(`[Cloud] offline upsert queued for ${table}:`, error.message);
    syncQueue.push({ type: "upsert", table, row: rowWithUid });
  }
}

async function deleteRow(table: string, id: string) {
  const uid = await userId();
  if (!uid) return;

  if (!isOnline()) {
    syncQueue.push({ type: "delete", table, id });
    return;
  }

  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", uid);
  if (error) {
    console.warn(`[Cloud] offline delete queued for ${table}:`, error.message);
    syncQueue.push({ type: "delete", table, id });
  }
}

// ─── cloud object used by store ───────────────────────────────────────────────

export const cloud = {
  async saveAccount(a: Account) {
    const uid = await userId();
    if (uid) await upsertRow("accounts", accountToRow(a, uid));
  },
  async deleteAccount(id: string) {
    await deleteRow("accounts", id);
  },

  async saveCard(c: CreditCard) {
    const uid = await userId();
    if (uid) await upsertRow("cards", cardToRow(c, uid));
  },
  async deleteCard(id: string) {
    await deleteRow("cards", id);
  },

  async saveTransaction(t: Transaction) {
    const uid = await userId();
    if (uid) await upsertRow("transactions", txToRow(t, uid));
  },
  async deleteTransaction(id: string) {
    await deleteRow("transactions", id);
  },

  async saveInstallments(list: Installment[]) {
    if (!list.length) return;
    const uid = await userId();
    if (!uid) return;
    for (const i of list) await upsertRow("installments", instToRow(i, uid));
  },
  async deleteInstallmentsByTx(transactionId: string) {
    const uid = await userId();
    if (!uid) return;
    if (!isOnline()) {
      // Can't delete by FK offline - mark individually if we know the ids
      // For now just let it be reconciled on next hydrate
      return;
    }
    const { error } = await supabase
      .from("installments")
      .delete()
      .eq("transaction_id", transactionId)
      .eq("user_id", uid);
    if (error) console.warn("[Cloud] deleteInstallmentsByTx:", error.message);
  },
  async saveInstallment(i: Installment) {
    const uid = await userId();
    if (uid) await upsertRow("installments", instToRow(i, uid));
  },

  async saveStock(s: StockPosition) {
    const uid = await userId();
    if (uid) await upsertRow("stocks", stockToRow(s, uid));
  },
  async deleteStock(id: string) {
    await deleteRow("stocks", id);
  },

  async saveCrypto(c: CryptoPosition) {
    const uid = await userId();
    if (uid) await upsertRow("crypto", cryptoToRow(c, uid));
  },
  async deleteCrypto(id: string) {
    await deleteRow("crypto", id);
  },

  async saveCDA(c: CDA) {
    const uid = await userId();
    if (uid) await upsertRow("cdas", cdaToRow(c, uid));
  },
  async deleteCDA(id: string) {
    await deleteRow("cdas", id);
  },

  async saveFund(f: MutualFund) {
    const uid = await userId();
    if (uid) await upsertRow("funds", fundToRow(f, uid));
  },
  async deleteFund(id: string) {
    await deleteRow("funds", id);
  },

  async saveProgrammedSaving(s: ProgrammedSaving) {
    const uid = await userId();
    if (uid) await upsertRow("programmed_savings", savingToRow(s, uid));
  },
  async deleteProgrammedSaving(id: string) {
    await deleteRow("programmed_savings", id);
  },

  async saveExchangeRate(rate: number) {
    const uid = await userId();
    if (!uid) return;
    await upsertRow("settings", { user_id: uid, exchange_rate: rate });
  },

  async wipeAll() {
    const uid = await userId();
    if (!uid) return;
    for (const t of ["installments", "transactions", "accounts", "cards", "stocks", "crypto", "cdas", "funds", "programmed_savings"]) {
      const { error } = await supabase.from(t).delete().eq("user_id", uid);
      check(error, `${t} wipe`);
    }
    syncQueue.clear();
  },
};

// ─── Bulk migration: push everything local -> Supabase ────────────────────────

export async function pushLocalToCloud(snapshot: CloudSnapshot & { exchangeRate: number }) {
  const uid = await userId();
  if (!uid) throw new Error("No hay sesión activa.");

  const tables: Array<{ table: string; rows: Record<string, unknown>[] }> = [
    { table: "accounts", rows: snapshot.accounts.map((r) => accountToRow(r, uid)) },
    { table: "cards", rows: snapshot.cards.map((r) => cardToRow(r, uid)) },
    { table: "transactions", rows: snapshot.transactions.map((r) => txToRow(r, uid)) },
    { table: "installments", rows: snapshot.installments.map((r) => instToRow(r, uid)) },
    { table: "stocks", rows: snapshot.stocks.map((r) => stockToRow(r, uid)) },
    { table: "crypto", rows: snapshot.crypto.map((r) => cryptoToRow(r, uid)) },
    { table: "cdas", rows: snapshot.cdas.map((r) => cdaToRow(r, uid)) },
    { table: "funds", rows: snapshot.funds.map((r) => fundToRow(r, uid)) },
    { table: "programmed_savings", rows: (snapshot.programmedSavings ?? []).map((r) => savingToRow(r, uid)) },
  ];

  for (const { table, rows } of tables) {
    if (!rows.length) continue;
    const { error } = await supabase.from(table).upsert(rows);
    if (error) throw new Error(`Error en ${table}: ${error.message}`);
  }

  // Settings
  const { error: setErr } = await supabase
    .from("settings")
    .upsert({ user_id: uid, exchange_rate: snapshot.exchangeRate });
  if (setErr) throw new Error(`Error en settings: ${setErr.message}`);
}

// ─── bg: fire-and-forget ──────────────────────────────────────────────────────

export function bg(promise: Promise<unknown>) {
  promise.catch(() => {
    /* errors already logged/queued inside cloud.* */
  });
}
