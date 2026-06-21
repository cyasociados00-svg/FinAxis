
-- Accounts
CREATE TABLE public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  kind text not null check (kind in ('cash','debit')),
  balance_pyg numeric not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cards
CREATE TABLE public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  limit_pyg numeric not null default 0,
  balance_pyg numeric not null default 0,
  closing_day int not null default 1,
  due_day int not null default 1,
  tna numeric not null default 0,
  min_payment_pct numeric not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO authenticated;
GRANT ALL ON public.cards TO service_role;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cards" ON public.cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions
CREATE TABLE public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date timestamptz not null default now(),
  amount numeric not null,
  concept text not null,
  category text not null,
  type text not null check (type in ('income','expense')),
  method text not null check (method in ('cash','debit','credit')),
  card_id uuid,
  account_id uuid,
  installments int,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tx" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Installments
CREATE TABLE public.installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  transaction_id uuid not null,
  number int not null,
  of int not null,
  amount numeric not null,
  due_date date not null,
  paid boolean not null default false
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.installments TO authenticated;
GRANT ALL ON public.installments TO service_role;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own inst" ON public.installments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Stocks
CREATE TABLE public.stocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  symbol text not null,
  name text not null,
  qty numeric not null,
  avg_price_usd numeric not null,
  current_price_usd numeric not null
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stocks TO authenticated;
GRANT ALL ON public.stocks TO service_role;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stocks" ON public.stocks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Crypto
CREATE TABLE public.crypto (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  symbol text not null,
  coingecko_id text not null,
  qty numeric not null,
  avg_price_usd numeric not null,
  current_price_usd numeric not null
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crypto TO authenticated;
GRANT ALL ON public.crypto TO service_role;
ALTER TABLE public.crypto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own crypto" ON public.crypto FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CDAs
CREATE TABLE public.cdas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  bank text not null,
  capital numeric not null,
  tna numeric not null,
  issue_date date not null,
  maturity_date date not null
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cdas TO authenticated;
GRANT ALL ON public.cdas TO service_role;
ALTER TABLE public.cdas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cdas" ON public.cdas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Funds
CREATE TABLE public.funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  contributions_pyg numeric not null default 0,
  current_value_pyg numeric not null default 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funds TO authenticated;
GRANT ALL ON public.funds TO service_role;
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own funds" ON public.funds FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Settings (1 row per user)
CREATE TABLE public.settings (
  user_id uuid primary key references auth.users on delete cascade,
  exchange_rate numeric not null default 7500
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
