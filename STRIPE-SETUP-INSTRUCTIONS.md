# 🚀 STRIPE INTEGRATION SETUP INSTRUCTIONS

## Step 1: Run Supabase Migration (5 minutes)

### Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: **babawina**
3. Click **SQL Editor** in left sidebar

### Run Migration Script
1. Click **+ New Query**
2. Open file: `supabase-migrations/01-create-payment-tables.sql`
3. Copy **ALL** contents
4. Paste into Supabase SQL Editor
5. Click **Run** button
6. Wait for success message: ✅

### Verify Tables Created
Run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_payment_methods',
  'transactions', 
  'user_submission_counters'
);
```

You should see 3 tables listed.

---

## Step 2: Get Your Stripe Keys (Already Done!)

You already signed up for Stripe, so just grab your keys:

### From Stripe Dashboard:
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (starts with `pk_test_...`)
3. Copy **Secret key** (starts with `sk_test_...`)

---

## Step 3: Add Environment Variables

Open your `.env.local` file and add:

```bash
# Stripe API Keys (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Stripe Webhook Secret (we'll add this later after webhook setup)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Replace** `YOUR_KEY_HERE` with your actual keys from Stripe!

---

## Step 4: Install Stripe Packages

I'll do this automatically when implementing the code.

---

## Step 5: Test With Test Cards

Once everything is implemented, use these test cards:

### Success Card
```
Card Number: 4242 4242 4242 4242
Expiry: 12/34 (any future date)
CVC: 123 (any 3 digits)
```

### 3D Secure Card (Tests authentication)
```
Card Number: 4000 0027 6000 3184
Expiry: 12/34
CVC: 123
```

### Decline Card (Tests failure handling)
```
Card Number: 4000 0000 0000 0002
Expiry: 12/34
CVC: 123
```

---

## ✅ READY TO CONTINUE?

Once you've:
- [x] Run the SQL migration in Supabase
- [x] Added Stripe keys to `.env.local`

**Tell me "migration done" and I'll start implementing the code!** 🚀

---

## 🆘 If Something Goes Wrong

### Rollback Database Changes
If you need to undo the migration:
1. Open `supabase-migrations/02-rollback-payment-tables.sql`
2. Copy contents
3. Paste in Supabase SQL Editor
4. Run

**WARNING: This deletes all payment data!**

---

## 📊 What Gets Created

### New Tables:
- `user_payment_methods` - Stores saved cards (tokenized)
- `transactions` - All payments and free entries
- `user_submission_counters` - Buy 2 Get 1 Free logic

### Modified Tables:
- `profiles` - Added `stripe_customer_id` column
- `competition_entries` - Added `transaction_id` and `was_free_entry` columns

### Automatic Features:
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only see their own data
- ✅ Admins can see everything
- ✅ Auto-calculate "next is free" logic
- ✅ Auto-update timestamps

---

## 🎯 Next Steps After Migration

I'll implement:
1. API endpoints for Stripe integration
2. Embedded payment form modal
3. One-click payment for returning users
4. Buy 2 Get 1 Free logic
5. Success/error handling
6. Testing with test cards

**Estimated implementation time: 3-4 hours**

Let me know when the migration is done! 🚀

