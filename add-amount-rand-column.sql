-- Add amount_rand column to transactions table
-- This will store the amount in South African Rand for easy dashboard queries

-- Step 1: Add the column (allow NULL temporarily)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS amount_rand DECIMAL(10, 2);

-- Step 2: Populate it from existing amount_cents data
UPDATE transactions
SET amount_rand = amount_cents / 100.0
WHERE amount_rand IS NULL
  AND amount_cents IS NOT NULL;

-- Step 3: Set default for future inserts
ALTER TABLE transactions
ALTER COLUMN amount_rand SET DEFAULT 0;

-- Verify the changes
SELECT 
  id,
  amount_cents,
  amount_rand,
  status,
  created_at
FROM transactions
ORDER BY created_at DESC
LIMIT 10;

