-- Programmed savings (ahorro programado): a standalone savings plan with a
-- fixed interest rate and its own accumulating balance. Distinct from mutual
-- funds (variable, market P&L) — this product only accumulates + accrues a
-- fixed rate, and does not fluctuate with the market.
CREATE TABLE public.programmed_savings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  source_account_id text,                       -- account id, or '__previo__' (capital previo)
  amount_pyg numeric not null default 0,        -- deposit per period
  frequency text not null check (frequency in ('weekly','biweekly','monthly')),
  tna numeric not null default 0,               -- fixed annual interest rate (%)
  term_periods integer not null default 0,      -- plazo: total number of deposits
  start_date timestamptz not null default now(), -- plan start; deposits at start + k periods
  opening_pyg numeric not null default 0,       -- extra prior contribution (progress only)
  deposited_pyg numeric not null default 0,     -- (legacy, unused)
  balance_pyg numeric not null default 0,       -- principal + accrued interest
  goal_pyg numeric not null default 0,          -- target amount (0 = no goal)
  goal_date date,                               -- optional target date
  next_run timestamptz not null,                -- next scheduled deposit
  last_accrual timestamptz not null default now(),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programmed_savings TO authenticated;
GRANT ALL ON public.programmed_savings TO service_role;
ALTER TABLE public.programmed_savings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own programmed_savings" ON public.programmed_savings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
