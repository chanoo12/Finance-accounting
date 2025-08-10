CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- GENERAL LEDGER
CREATE TABLE general_ledger (
  entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  descriptions TEXT NOT NULL,
  debit NUMERIC,
  credit NUMERIC,
  balance NUMERIC
);

CREATE TABLE accounts_payable (
  ap_id SERIAL PRIMARY KEY,
  supplier_id INTEGER NOT NULL,
  supplier_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL
);

CREATE TABLE accounts_receivable (
  ar_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL
);

-- BUDGETING
CREATE TABLE budget_cost_tracking (
  budget_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL
);



