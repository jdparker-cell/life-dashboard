-- Life Dashboard Supabase Setup
-- Run this in your Supabase SQL editor (https://app.supabase.com/project/_/sql/new)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  name TEXT DEFAULT 'You',
  age INTEGER DEFAULT 25,
  height NUMERIC DEFAULT 175,
  weight NUMERIC DEFAULT 75,
  weight_unit TEXT DEFAULT 'kg',
  timezone TEXT DEFAULT 'UTC',
  bedtime_goal TEXT DEFAULT '23:00',
  wake_time_goal TEXT DEFAULT '07:00',
  dashboard_title TEXT DEFAULT 'My Dashboard',
  accent_color TEXT DEFAULT '#06b6d4',
  day_tracker_start TEXT DEFAULT '08:00',
  day_tracker_end TEXT DEFAULT '00:00',
  water_unit TEXT DEFAULT 'mL',
  bottle_size NUMERIC DEFAULT 250,
  activity_hours NUMERIC DEFAULT 5,
  caffeine_sensitivity TEXT DEFAULT 'normal',
  sleep_goal NUMERIC DEFAULT 8,
  currency TEXT DEFAULT 'USD',
  currency_symbol TEXT DEFAULT '$',
  net_worth_goal NUMERIC DEFAULT 100000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  priority TEXT DEFAULT 'medium',
  category TEXT DEFAULT 'personal',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  recurring TEXT,
  pushed_from TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time_block TEXT,
  priority TEXT DEFAULT 'medium',
  category TEXT DEFAULT 'personal',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplements
CREATE TABLE IF NOT EXISTS supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  dose TEXT,
  unit TEXT DEFAULT 'mg',
  schedule TEXT DEFAULT 'morning',
  window_start TEXT DEFAULT '07:00',
  window_end TEXT DEFAULT '10:00',
  notes TEXT,
  running_low BOOLEAN DEFAULT FALSE,
  stock_count INTEGER DEFAULT 0,
  is_custom BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplement Logs
CREATE TABLE IF NOT EXISTS supplement_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  taken BOOLEAN DEFAULT FALSE,
  time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water Logs
CREATE TABLE IF NOT EXISTS water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  unit TEXT DEFAULT 'mL',
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sleep Logs
CREATE TABLE IF NOT EXISTS sleep_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  date DATE NOT NULL,
  bedtime TEXT NOT NULL,
  wake_time TEXT NOT NULL,
  duration NUMERIC NOT NULL,
  quality INTEGER DEFAULT 5,
  notes TEXT,
  is_nap BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caffeine Logs
CREATE TABLE IF NOT EXISTS caffeine_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  date DATE NOT NULL,
  drink_name TEXT NOT NULL,
  caffeine_mg NUMERIC NOT NULL,
  serving_size TEXT,
  timestamp TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Readiness Logs
CREATE TABLE IF NOT EXISTS readiness_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  date DATE NOT NULL,
  sleep_duration NUMERIC DEFAULT 0,
  sleep_quality INTEGER DEFAULT 0,
  caffeine_mg NUMERIC DEFAULT 0,
  water_progress NUMERIC DEFAULT 0,
  soreness INTEGER DEFAULT 5,
  mood INTEGER DEFAULT 5,
  stress INTEGER DEFAULT 5,
  energy INTEGER DEFAULT 5,
  focus INTEGER DEFAULT 5,
  state TEXT DEFAULT 'neutral',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gym Locations
CREATE TABLE IF NOT EXISTS gym_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout Splits
CREATE TABLE IF NOT EXISTS workout_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  day TEXT NOT NULL,
  name TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  location_id UUID REFERENCES gym_locations(id) ON DELETE SET NULL,
  starting_weight NUMERIC DEFAULT 0,
  weight_unit TEXT DEFAULT 'kg',
  rep_range_min INTEGER DEFAULT 6,
  rep_range_max INTEGER DEFAULT 8,
  increment NUMERIC DEFAULT 2,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout Sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  date DATE NOT NULL,
  split_day TEXT NOT NULL,
  split_name TEXT NOT NULL,
  location_id UUID REFERENCES gym_locations(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE,
  duration INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout Sets
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  rpe INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight Logs
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  date DATE NOT NULL,
  weight NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress Photos
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  date DATE NOT NULL,
  image_url TEXT,
  body_weight NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finance Accounts
CREATE TABLE IF NOT EXISTS finance_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  type TEXT DEFAULT 'checking',
  include_in_net_worth BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investments
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  ticker TEXT,
  shares NUMERIC DEFAULT 0,
  manual_price NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crypto Holdings
CREATE TABLE IF NOT EXISTS crypto_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  manual_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Other Assets
CREATE TABLE IF NOT EXISTS other_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  notes TEXT,
  include_in_net_worth BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  renewal_date DATE NOT NULL,
  frequency TEXT DEFAULT 'monthly',
  account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  auto_deduct BOOLEAN DEFAULT FALSE,
  notes TEXT,
  category TEXT DEFAULT '',
  cancelled BOOLEAN DEFAULT FALSE,
  usage TEXT DEFAULT 'sometimes',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  item_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  date_bought DATE NOT NULL,
  expected_delivery DATE,
  account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'ordered',
  deduct_from_account BOOLEAN DEFAULT FALSE,
  notes TEXT,
  receipt_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  merchant TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  category TEXT DEFAULT '',
  account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist Items
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  link TEXT,
  purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Income Logs
CREATE TABLE IF NOT EXISTS income_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  source TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  recurring BOOLEAN DEFAULT FALSE,
  frequency TEXT DEFAULT 'one-time',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Net Worth Snapshots
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  date DATE NOT NULL,
  total_net_worth NUMERIC DEFAULT 0,
  accounts NUMERIC DEFAULT 0,
  investments NUMERIC DEFAULT 0,
  crypto NUMERIC DEFAULT 0,
  assets NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentor Settings
CREATE TABLE IF NOT EXISTS mentor_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL DEFAULT 'default',
  avatar_style TEXT DEFAULT 'orb',
  accent_color TEXT DEFAULT '#06b6d4',
  enable_blinking BOOLEAN DEFAULT TRUE,
  enable_idle_sleep BOOLEAN DEFAULT TRUE,
  enable_reminders BOOLEAN DEFAULT TRUE,
  chat_compact BOOLEAN DEFAULT FALSE,
  show_on_main BOOLEAN DEFAULT TRUE,
  show_on_gym BOOLEAN DEFAULT TRUE,
  show_on_finance BOOLEAN DEFAULT TRUE,
  show_on_health BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id)
);

-- App data blob (for cross-device sync)
CREATE TABLE IF NOT EXISTS app_data (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_data DISABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON sleep_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_caffeine_logs_user_date ON caffeine_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items(user_id);

-- Storage bucket for photos
-- Run this in Supabase Storage section or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);
-- Then set public policies in the Storage settings.
