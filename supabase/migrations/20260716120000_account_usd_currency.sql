-- Allow "cuentas a la vista" to be held in USD, mirrored to PYG at the live
-- exchange rate (same live-conversion pattern already used for stocks/crypto).
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'PYG' CHECK (currency IN ('PYG', 'USD')),
  ADD COLUMN IF NOT EXISTS balance_usd numeric;
