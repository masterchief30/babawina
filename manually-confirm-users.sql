-- Manually confirm ALL existing users
-- This fixes users created when email confirmation was enabled

UPDATE auth.users 
SET 
  email_confirmed_at = NOW(), 
  confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Check the results
SELECT 
  email, 
  email_confirmed_at, 
  confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC;

