-- Optional: Delete all test transactions before going live
-- This will clean up your database by removing test data

-- Show what will be deleted (run this first to verify)
SELECT 
  id,
  amount_cents,
  amount_rand,
  stripe_payment_intent_id,
  status,
  created_at
FROM transactions
WHERE created_at < '2025-11-15T10:00:00Z'
ORDER BY created_at DESC;

-- Uncomment the line below to actually delete the test transactions
-- DELETE FROM transactions WHERE created_at < '2025-11-15T10:00:00Z';

