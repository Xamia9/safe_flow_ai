/*
# Create simulations schema for SafeFlow AI

## Purpose
Persists user financial profiles and stress-test scenarios so simulation data
survives across browser sessions instead of being limited to localStorage.

## 1. New Tables

### `simulations`
Stores a complete financial profile plus the scenario settings the user chose.
- `id` — uuid, primary key
- `name` — text, the scenario display name (e.g. "Baseline", "Combined Shock")
- `kind` — text, scenario category: baseline | income-reduction | interruption | unexpected-expense | combined
- `horizon` — integer, forecast length in months (3, 6, or 12)
- `income_reduction_pct` — numeric, percentage of income reduction (0–100)
- `interruption_start_month` — integer, nullable; first month the reduction applies
- `interruption_duration_months` — integer, nullable; how many months the reduction lasts
- `opening_balance` — bigint, available savings at start of month 1 (VND)
- `monthly_income` — bigint, normal monthly net income (VND)
- `low_season_income` — bigint, nullable; low-season monthly net income (VND)
- `essential_expenses` — bigint, essential monthly costs (VND)
- `flexible_expenses` — bigint, nullable; discretionary spending (VND)
- `debt_payments` — bigint, mandatory monthly debt repayments (VND)
- `safety_buffer` — bigint, minimum reserve to keep (VND); always essentials + debt
- `created_at` — timestamptz, defaults to now()
- `updated_at` — timestamptz, defaults to now()

### `unexpected_expenses`
Child table storing one-off costs attached to a simulation scenario.
- `id` — uuid, primary key
- `simulation_id` — uuid, foreign key to simulations(id) with ON DELETE CASCADE
- `month` — integer, 1-based forecast month the expense hits
- `amount` — bigint, cost in VND
- `label` — text, nullable; optional description
- `created_at` — timestamptz, defaults to now()

## 2. Security
- Row Level Security enabled on both tables.
- This is a guest-first app with no sign-in screen, so all policies use
  `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because
  the data is intentionally public/shared within the single-tenant app.
- Four separate policies per table (SELECT, INSERT, UPDATE, DELETE).

## 3. Indexes
- `unexpected_expenses_simulation_id_idx` on `unexpected_expenses.simulation_id`
  for efficient joins when loading a simulation's expenses.
*/

CREATE TABLE IF NOT EXISTS simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Baseline',
  kind text NOT NULL DEFAULT 'baseline',
  horizon integer NOT NULL DEFAULT 6 CHECK (horizon IN (3, 6, 12)),
  income_reduction_pct numeric NOT NULL DEFAULT 0 CHECK (income_reduction_pct >= 0 AND income_reduction_pct <= 100),
  interruption_start_month integer,
  interruption_duration_months integer,
  opening_balance bigint NOT NULL DEFAULT 0,
  monthly_income bigint NOT NULL DEFAULT 0,
  low_season_income bigint,
  essential_expenses bigint NOT NULL DEFAULT 0,
  flexible_expenses bigint,
  debt_payments bigint NOT NULL DEFAULT 0,
  safety_buffer bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_simulations" ON simulations;
CREATE POLICY "anon_select_simulations" ON simulations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_simulations" ON simulations;
CREATE POLICY "anon_insert_simulations" ON simulations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_simulations" ON simulations;
CREATE POLICY "anon_update_simulations" ON simulations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_simulations" ON simulations;
CREATE POLICY "anon_delete_simulations" ON simulations FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS unexpected_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id uuid NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
  month integer NOT NULL DEFAULT 1 CHECK (month >= 1),
  amount bigint NOT NULL DEFAULT 0 CHECK (amount >= 0),
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE unexpected_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_unexpected_expenses" ON unexpected_expenses;
CREATE POLICY "anon_select_unexpected_expenses" ON unexpected_expenses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_unexpected_expenses" ON unexpected_expenses;
CREATE POLICY "anon_insert_unexpected_expenses" ON unexpected_expenses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_unexpected_expenses" ON unexpected_expenses;
CREATE POLICY "anon_update_unexpected_expenses" ON unexpected_expenses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_unexpected_expenses" ON unexpected_expenses;
CREATE POLICY "anon_delete_unexpected_expenses" ON unexpected_expenses FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS unexpected_expenses_simulation_id_idx
  ON unexpected_expenses(simulation_id);
