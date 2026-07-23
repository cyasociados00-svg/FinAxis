-- Recurring income/expense rules: a fixed transaction template that the app
-- auto-registers on a schedule (salary, rent, utilities), so it doesn't have
-- to be entered by hand every month.
CREATE TABLE public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  concept text not null,
  amount numeric not null default 0,
  category text not null,
  type text not null check (type in ('income','expense')),
  method text not null check (method in ('cash','debit','credit')),
  account_id uuid,
  card_id uuid,
  frequency text not null check (frequency in ('weekly','biweekly','monthly')),
  next_run timestamptz not null,          -- next occurrence still to register
  active boolean not null default true,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_rules TO authenticated;
GRANT ALL ON public.recurring_rules TO service_role;
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recurring_rules" ON public.recurring_rules
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
