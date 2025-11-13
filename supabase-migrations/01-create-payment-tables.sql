-- =====================================================
-- STRIPE PAYMENT INTEGRATION - DATABASE MIGRATION
-- =====================================================
-- Run this in Supabase SQL Editor
-- This creates all tables needed for Stripe payments
-- and "Buy 2 Get 1 Free" logic
-- =====================================================

-- 1. ADD STRIPE CUSTOMER ID TO PROFILES
-- =====================================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
ON profiles(stripe_customer_id);

COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for payment processing';


-- 2. CREATE USER_PAYMENT_METHODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  card_brand TEXT, -- visa, mastercard, amex
  card_last4 TEXT, -- last 4 digits
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one default payment method per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_payment_methods_default 
ON user_payment_methods(user_id) 
WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id 
ON user_payment_methods(user_id);

CREATE INDEX IF NOT EXISTS idx_user_payment_methods_stripe_customer 
ON user_payment_methods(stripe_customer_id);

COMMENT ON TABLE user_payment_methods IS 'Stores tokenized payment methods for users';


-- 3. CREATE TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  amount_cents INTEGER NOT NULL, -- in cents (e.g., 500 = R5.00)
  currency TEXT DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'succeeded', 'failed', 'refunded'
  payment_method_id UUID REFERENCES user_payment_methods(id) ON DELETE SET NULL,
  entries_purchased INTEGER DEFAULT 1,
  was_free BOOLEAN DEFAULT false, -- true if this was a free entry
  stripe_receipt_url TEXT,
  error_message TEXT,
  metadata JSONB, -- Store additional data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'canceled'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
ON transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_competition_id 
ON transactions(competition_id);

CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent 
ON transactions(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_transactions_status 
ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
ON transactions(created_at DESC);

COMMENT ON TABLE transactions IS 'Tracks all payment transactions and free entries';


-- 4. CREATE USER_SUBMISSION_COUNTERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_submission_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  paid_submissions INTEGER DEFAULT 0,
  free_submissions INTEGER DEFAULT 0,
  total_submissions INTEGER DEFAULT 0,
  next_submission_free BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, competition_id),
  CONSTRAINT valid_counts CHECK (
    paid_submissions >= 0 AND 
    free_submissions >= 0 AND 
    total_submissions >= 0 AND
    total_submissions = paid_submissions + free_submissions
  )
);

CREATE INDEX IF NOT EXISTS idx_user_submission_counters_user_comp 
ON user_submission_counters(user_id, competition_id);

CREATE INDEX IF NOT EXISTS idx_user_submission_counters_user 
ON user_submission_counters(user_id);

COMMENT ON TABLE user_submission_counters IS 'Tracks Buy 2 Get 1 Free counter per user per competition';


-- 5. UPDATE COMPETITION_ENTRIES TABLE
-- =====================================================
-- Add transaction reference to track which payment created which entry
ALTER TABLE competition_entries 
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS was_free_entry BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_competition_entries_transaction 
ON competition_entries(transaction_id);

COMMENT ON COLUMN competition_entries.transaction_id IS 'Links entry to payment transaction';
COMMENT ON COLUMN competition_entries.was_free_entry IS 'True if this was a free entry (Buy 2 Get 1 Free)';


-- 6. CREATE FUNCTION TO UPDATE TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 7. CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================
DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON user_payment_methods;
CREATE TRIGGER update_user_payment_methods_updated_at
    BEFORE UPDATE ON user_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_submission_counters_updated_at ON user_submission_counters;
CREATE TRIGGER update_user_submission_counters_updated_at
    BEFORE UPDATE ON user_submission_counters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 8. CREATE FUNCTION TO CALCULATE NEXT FREE SUBMISSION
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_next_free_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- Every 2 paid submissions = 1 free submission
    -- After 2 paid, next should be free
    IF (NEW.paid_submissions % 2 = 0 AND NEW.paid_submissions > 0) THEN
        NEW.next_submission_free = true;
    ELSE
        NEW.next_submission_free = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 9. CREATE TRIGGER FOR AUTO-CALCULATE FREE SUBMISSION
-- =====================================================
DROP TRIGGER IF EXISTS trigger_calculate_next_free ON user_submission_counters;
CREATE TRIGGER trigger_calculate_next_free
    BEFORE INSERT OR UPDATE ON user_submission_counters
    FOR EACH ROW
    EXECUTE FUNCTION calculate_next_free_submission();


-- 10. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_submission_counters ENABLE ROW LEVEL SECURITY;


-- 11. CREATE RLS POLICIES
-- =====================================================

-- USER_PAYMENT_METHODS POLICIES
-- Users can only view/manage their own payment methods
DROP POLICY IF EXISTS "Users can view own payment methods" ON user_payment_methods;
CREATE POLICY "Users can view own payment methods" 
ON user_payment_methods FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment methods" ON user_payment_methods;
CREATE POLICY "Users can insert own payment methods" 
ON user_payment_methods FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment methods" ON user_payment_methods;
CREATE POLICY "Users can update own payment methods" 
ON user_payment_methods FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payment methods" ON user_payment_methods;
CREATE POLICY "Users can delete own payment methods" 
ON user_payment_methods FOR DELETE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all payment methods" ON user_payment_methods;
CREATE POLICY "Admins can manage all payment methods" 
ON user_payment_methods FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);


-- TRANSACTIONS POLICIES
-- Users can only view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Only backend can insert/update transactions (via service role)
DROP POLICY IF EXISTS "Service role can manage all transactions" ON transactions;
CREATE POLICY "Service role can manage all transactions" 
ON transactions FOR ALL 
USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" 
ON transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);


-- USER_SUBMISSION_COUNTERS POLICIES
-- Users can only view their own counters
DROP POLICY IF EXISTS "Users can view own submission counters" ON user_submission_counters;
CREATE POLICY "Users can view own submission counters" 
ON user_submission_counters FOR SELECT 
USING (auth.uid() = user_id);

-- Only backend can update counters (via service role)
DROP POLICY IF EXISTS "Service role can manage all counters" ON user_submission_counters;
CREATE POLICY "Service role can manage all counters" 
ON user_submission_counters FOR ALL 
USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Admins can view all counters" ON user_submission_counters;
CREATE POLICY "Admins can view all counters" 
ON user_submission_counters FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);


-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================

-- Verify tables were created
SELECT 
  'user_payment_methods' as table_name,
  COUNT(*) as row_count 
FROM user_payment_methods
UNION ALL
SELECT 
  'transactions' as table_name,
  COUNT(*) as row_count 
FROM transactions
UNION ALL
SELECT 
  'user_submission_counters' as table_name,
  COUNT(*) as row_count 
FROM user_submission_counters;

-- Show summary
SELECT 
  '✅ Stripe payment tables created successfully!' as status,
  NOW() as completed_at;

