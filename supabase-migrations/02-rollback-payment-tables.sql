-- =====================================================
-- ROLLBACK SCRIPT - Only run if you need to undo!
-- =====================================================
-- This removes all Stripe payment tables
-- WARNING: This will delete all payment data!
-- =====================================================

-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can view own payment methods" ON user_payment_methods;
DROP POLICY IF EXISTS "Users can insert own payment methods" ON user_payment_methods;
DROP POLICY IF EXISTS "Users can update own payment methods" ON user_payment_methods;
DROP POLICY IF EXISTS "Users can delete own payment methods" ON user_payment_methods;
DROP POLICY IF EXISTS "Admins can manage all payment methods" ON user_payment_methods;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Service role can manage all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view own submission counters" ON user_submission_counters;
DROP POLICY IF EXISTS "Service role can manage all counters" ON user_submission_counters;
DROP POLICY IF EXISTS "Admins can view all counters" ON user_submission_counters;

-- Drop triggers
DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON user_payment_methods;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_user_submission_counters_updated_at ON user_submission_counters;
DROP TRIGGER IF EXISTS trigger_calculate_next_free ON user_submission_counters;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_next_free_submission();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Remove columns from competition_entries
ALTER TABLE competition_entries 
DROP COLUMN IF EXISTS transaction_id,
DROP COLUMN IF EXISTS was_free_entry;

-- Drop tables
DROP TABLE IF EXISTS user_submission_counters;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS user_payment_methods;

-- Remove column from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS stripe_customer_id;

SELECT '✅ Rollback complete - all Stripe tables removed' as status;

