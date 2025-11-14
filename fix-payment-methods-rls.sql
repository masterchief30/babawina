-- =====================================================
-- FIX RLS POLICIES FOR user_payment_methods
-- Allow users to view and manage their own payment methods
-- =====================================================

-- Enable RLS (if not already enabled)
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (clean slate)
DROP POLICY IF EXISTS "Users can view their own payment methods" ON user_payment_methods;
DROP POLICY IF EXISTS "Users can insert their own payment methods" ON user_payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON user_payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON user_payment_methods;

-- Allow users to SELECT (view) their own payment methods
CREATE POLICY "Users can view their own payment methods"
  ON user_payment_methods
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to INSERT (add) their own payment methods
CREATE POLICY "Users can insert their own payment methods"
  ON user_payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to DELETE their own payment methods
CREATE POLICY "Users can delete their own payment methods"
  ON user_payment_methods
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to UPDATE their own payment methods (e.g., set default)
CREATE POLICY "Users can update their own payment methods"
  ON user_payment_methods
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'user_payment_methods';

