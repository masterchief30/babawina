# 🧪 STRIPE INTEGRATION - TESTING GUIDE

## ✅ Implementation Complete!

All Stripe payment integration code has been implemented. Here's what you need to do to test it.

---

## 📋 Step 1: Add Stripe Keys to Environment Variables

Open your `.env.local` file and add these variables:

```bash
# Stripe API Keys (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Where to Get Your Stripe Keys:

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`) - click "Reveal test key"
4. Paste them into `.env.local`

**⚠️ Important:** Make sure you're using **TEST MODE** keys (they have `_test_` in them)!

---

## 🚀 Step 2: Restart Your Development Server

After adding the environment variables, restart your server:

```bash
# Stop the current server (Ctrl+C)
# Then start it again:
npm run dev
```

---

## 💳 Step 3: Test Cards

Use these test cards to test different scenarios:

### ✅ Successful Payment
```
Card Number: 4242 4242 4242 4242
Expiry: 12/34 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any 5 digits)
```

### 🔐 3D Secure Required (Tests Authentication)
```
Card Number: 4000 0027 6000 3184
Expiry: 12/34
CVC: 123
ZIP: 12345
```
**Note:** This will show a popup for 3D Secure authentication. Click "Complete" to proceed.

### ❌ Declined Payment (Tests Error Handling)
```
Card Number: 4000 0000 0000 0002
Expiry: 12/34
CVC: 123
ZIP: 12345
```

### 💰 Insufficient Funds
```
Card Number: 4000 0000 0000 9995
Expiry: 12/34
CVC: 123
ZIP: 12345
```

---

## 🧪 Testing Flow

### Test Scenario 1: First-Time User
1. Go to a live competition page
2. Click on the image to place your guess
3. Click "Submit Entry - R5.00" (or whatever the entry price is)
4. If not logged in, you'll be redirected to sign up
5. After sign up, you'll see the payment modal
6. Enter test card: `4242 4242 4242 4242`
7. Click "Save Card & Continue"
8. Entry should submit successfully! ✅
9. You should see: "Entry Submitted! 1 more until FREE entry"

### Test Scenario 2: Second Paid Entry
1. Place another guess on the image
2. Click "Submit Entry - R5.00"
3. It should charge your saved card automatically (no modal!)
4. Entry submitted! ✅
5. You should see: "Your Next Entry is FREE! 🎉"

### Test Scenario 3: FREE Entry (Buy 2 Get 1 Free!)
1. Place another guess
2. Click "Submit FREE Entry! 🎁" (button should be green)
3. Entry submitted instantly with NO charge! ✅
4. You should see: "FREE Entry Submitted!"
5. Counter resets, next 2 entries will be paid again

---

## 🎯 What to Check

### ✅ Payment Modal
- [ ] Modal appears for first-time users
- [ ] Card input works smoothly
- [ ] "Buy 2 Get 1 Free" info is displayed
- [ ] Can cancel and try again
- [ ] Shows success message after adding card

### ✅ One-Click Payments
- [ ] Second entry charges card automatically
- [ ] No modal appears for returning users
- [ ] Shows success toast with card last 4 digits
- [ ] Error handling works for declined cards

### ✅ Free Entry Logic
- [ ] Banner shows progress to free entry
- [ ] Third entry is free (no charge)
- [ ] Button turns green for free entries
- [ ] Counter resets after free entry

### ✅ Submission Status Banner
- [ ] Shows after first submission
- [ ] Updates progress correctly
- [ ] Shows "Next is FREE" when applicable
- [ ] Displays submission counts

### ✅ Database
Check these tables in Supabase:
- [ ] `user_payment_methods` - Card tokens saved
- [ ] `transactions` - Payment records created
- [ ] `user_submission_counters` - Counters updating correctly
- [ ] `competition_entries` - Entries saved with correct `transaction_id`

---

## 🔍 Debugging

### Check Console Logs
Open browser DevTools (F12) and look for:
- ✅ "Setup Intent created for user..."
- ✅ "Payment method saved successfully..."
- ✅ "🎁 Processing FREE submission..."
- ✅ "💳 Processing PAID submission..."
- ❌ Any red error messages

### Check Network Tab
1. Open DevTools → Network tab
2. Look for these API calls:
   - `/api/stripe/create-setup-intent` (first time)
   - `/api/stripe/save-payment-method` (first time)
   - `/api/stripe/charge-saved-card` (every submission)
   - `/api/user/submission-status` (to check if free)

### Check Stripe Dashboard
1. Go to: https://dashboard.stripe.com/test/payments
2. You should see your test payments listed
3. Click on a payment to see details
4. Verify amounts match (R5.00 = 500 cents)

---

## 🚨 Common Issues & Solutions

### Issue: "STRIPE_SECRET_KEY is not set"
**Solution:** Make sure you added the keys to `.env.local` and restarted the server.

### Issue: Payment modal doesn't appear
**Solution:** Check browser console for errors. Make sure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set.

### Issue: "Failed to create payment setup"
**Solution:** Verify your Stripe keys are correct and you're in test mode.

### Issue: Entry submits but payment doesn't show in Stripe
**Solution:** Check that you're looking at the TEST dashboard, not LIVE.

### Issue: Free entry not working
**Solution:** Check `user_submission_counters` table - make sure `paid_submissions` is set correctly.

---

## 📊 Test Checklist

Complete these tests in order:

- [ ] **Supabase migration** completed successfully
- [ ] **Stripe keys** added to `.env.local`
- [ ] **Server restarted** after adding keys
- [ ] **First entry** - Add payment method and submit (Paid)
- [ ] **Second entry** - One-click payment (Paid)
- [ ] **Third entry** - Free submission (FREE!)
- [ ] **Fourth entry** - Counter reset, back to paid
- [ ] **Declined card** - Error handling works
- [ ] **Multiple competitions** - Counter per competition works
- [ ] **Multiple users** - Each user has own counter
- [ ] **Database records** - All tables populated correctly
- [ ] **Stripe dashboard** - Payments visible

---

## 🎉 Success Criteria

If all of the following are true, your integration is working perfectly:

✅ Users can add payment methods via embedded form  
✅ Payments process automatically on subsequent entries  
✅ "Buy 2 Get 1 Free" logic works correctly  
✅ Database records are created properly  
✅ Stripe dashboard shows test payments  
✅ Error handling works for failed payments  
✅ UI updates correctly after each submission  

---

## 🐛 Found a Bug?

If something isn't working:

1. Check browser console for errors
2. Check server terminal for errors
3. Verify environment variables are set
4. Make sure Supabase migration ran successfully
5. Check that you're using TEST MODE keys

---

## 🚀 Ready for Production?

**Don't switch to live keys yet!** The gambling/competition nature might cause issues with Stripe.

**Recommended approach:**
1. Test thoroughly with test keys
2. Keep using test mode for now
3. When ready for SA bank account, switch to PayFast
4. Or, reach out to Stripe support about your specific use case

---

## 📞 Stripe Support

If you run into Stripe-specific issues:
- Stripe Docs: https://stripe.com/docs
- Support: https://support.stripe.com
- Status: https://status.stripe.com

---

**Happy Testing!** 🎉

Let me know how it goes!

