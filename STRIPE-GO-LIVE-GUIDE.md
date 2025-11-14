# 🚀 Stripe Go Live Guide - BabaWina

## ✅ **Buttons Fixed First!**

Your Profile/Logout buttons are now clickable - I increased the header z-index to `z-[100]`.

---

## 📋 **PRE-LAUNCH CHECKLIST**

Before going live with Stripe, you MUST complete these steps:

### **1. Legal & Compliance** ⚖️
- [ ] **Business Registration** - Register your business in South Africa
- [ ] **Tax Registration** - Get VAT number if applicable
- [ ] **Bank Account** - Business bank account (can use personal initially)
- [ ] **Terms & Conditions** - ✅ Already done!
- [ ] **Privacy Policy** - ✅ Already done!
- [ ] **POPIA Compliance** - ✅ Already done in terms!

### **2. Stripe Account Requirements** 💳
- [ ] **Business Information:**
  - Legal business name
  - Business address (South Africa)
  - Business type (Sole Proprietor, Company, etc.)
  - Business registration number (if applicable)
  - Tax ID / VAT number (if applicable)

- [ ] **Personal Information:**
  - Full legal name
  - Date of birth
  - ID number (SA ID or Passport)
  - Residential address
  - Phone number

- [ ] **Bank Account:**
  - German bank account (you mentioned you have this)
  - IBAN
  - BIC/SWIFT code
  - Account holder name

### **3. Product Description** 📝
Be ready to explain your business to Stripe:

```
Business Description Example:
"BabaWina is an online skill-based competition platform where 
participants predict the location of a ball in an image. Winners 
are determined by accuracy. Prizes include electronics like 
PlayStation 5 consoles. Entry fees are R10 per submission with 
a 'Buy 2 Get 1 Free' promotion."

Industry: Competitions / Skill Games
Monthly Volume: Estimated R50,000 - R100,000 initially
Average Transaction: R10 - R30
```

---

## 🔄 **HOW TO ACTIVATE STRIPE LIVE MODE**

### **Step 1: Complete Account Activation**

1. **Log into Stripe Dashboard:**
   - Go to https://dashboard.stripe.com
   - You should see a banner: "Activate your account"

2. **Click "Activate Account" or "Start Activation"**

3. **Fill Out Business Details:**
   - **Business Type:** Individual or Company
   - **Business Address:** Your SA address
   - **Business Description:** Use example above
   - **Website:** babawina.co.za (or your domain)
   - **Product/Service:** Skill-based competitions
   - **Expected Volume:** Estimate monthly revenue

4. **Add Bank Account:**
   - Click "Add Bank Account"
   - Select Germany (since you have German bank)
   - Enter IBAN, BIC, Account Holder
   - **IMPORTANT:** Stripe will send test deposits (€0.01) to verify

5. **Identity Verification:**
   - Upload ID (Passport or SA ID)
   - Upload proof of address (utility bill, bank statement)
   - May require business documents if registered

6. **Wait for Approval:**
   - **Timeline:** 1-7 business days
   - Stripe may ask follow-up questions
   - Check email regularly

---

### **Step 2: Get Live API Keys**

Once activated:

1. Go to **Developers → API Keys**
2. Toggle to **"Live Mode"** (top right)
3. Copy your keys:
   - **Publishable Key:** `pk_live_...`
   - **Secret Key:** `sk_live_...` (click "Reveal")

---

### **Step 3: Update Your Environment Variables**

1. **Update `.env.local`:**

```bash
# Stripe LIVE Keys (replace test keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
```

2. **Update Vercel Environment Variables:**
   - Go to Vercel Dashboard → Your Project
   - Settings → Environment Variables
   - Update both keys
   - **IMPORTANT:** Redeploy after updating!

---

### **Step 4: Set Up Webhooks (CRITICAL!)**

Webhooks handle payment confirmations. You MUST do this!

1. **Go to Stripe Dashboard:**
   - Developers → Webhooks
   - Click "+ Add endpoint"

2. **Add Webhook URL:**
   ```
   https://babawina.co.za/api/stripe/webhook
   ```

3. **Select Events to Listen For:**
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.succeeded`
   - ✅ `charge.failed`
   - ✅ `customer.created`

4. **Copy Webhook Secret:**
   - After creating, copy the "Signing secret" (`whsec_...`)

5. **Add to Environment Variables:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

---

### **Step 5: Test Live Mode**

**BEFORE launching to real users:**

1. **Make a Test Purchase:**
   - Use YOUR REAL CARD
   - Make a R10 entry
   - Complete payment
   - Verify entry shows in database
   - Check Stripe Dashboard shows payment

2. **Test Refunds:**
   - Go to Stripe Dashboard → Payments
   - Find your test payment
   - Click "Refund"
   - Verify it processes

3. **Test Failed Payment:**
   - Try with a card that will decline
   - Verify user gets error message
   - Verify no entry created in database

---

## ⚠️ **IMPORTANT WARNINGS**

### **1. Stripe Radar (Fraud Protection)**
- Stripe will automatically flag suspicious payments
- High-risk countries may be blocked
- Set up **Radar Rules** in dashboard

### **2. Payouts Schedule**
- **First Payout:** 7-14 days after first payment
- **After That:** Every 2-7 days (you can configure)
- Go to **Settings → Payout Schedule** to change

### **3. Disputes & Chargebacks**
- Customers can dispute charges for 120 days
- **RESPOND IMMEDIATELY** to disputes
- Provide proof of service (screenshots, emails)
- Too many disputes = account suspension

### **4. Pricing Requirements**
- Minimum charge: €0.50 (about R10)
- ✅ Your R10 entry meets this!

---

## 🔧 **POST-ACTIVATION SETUP**

### **1. Configure Payout Schedule:**
```
Settings → Bank Accounts & Scheduling → Payout Schedule
- Recommended: Weekly (every Monday)
- Or: Daily (minimum R500 balance)
```

### **2. Set Up Email Receipts:**
```
Settings → Emails → Customer Emails
- ✅ Enable "Successful payments"
- ✅ Enable "Refunds"
- Customize email template with BabaWina branding
```

### **3. Enable 3D Secure (Recommended):**
```
Settings → Payment Methods → Card Payments
- ✅ Enable "Use 3D Secure when required"
- Adds extra security for high-risk transactions
```

### **4. Set Up Billing Descriptor:**
```
Settings → Public Details → Statement Descriptor
- Set to: "BABAWINA" (max 22 chars)
- This appears on customer card statements
```

---

## 📊 **MONITORING & ALERTS**

### **Set Up Alerts:**
1. **Go to:** Settings → Notifications
2. **Enable:**
   - ✅ Successful payments over R500
   - ✅ Failed payments
   - ✅ Disputes/chargebacks
   - ✅ New payouts
   - ✅ Refund requests

---

## 🚨 **COMMON ISSUES & FIXES**

### **Issue 1: "Account Not Activated"**
- **Fix:** Complete activation steps above
- May take 1-7 days for approval

### **Issue 2: "Invalid API Key"**
- **Fix:** Ensure you copied LIVE keys (pk_live_, sk_live_)
- Check no extra spaces/line breaks

### **Issue 3: "Payouts Delayed"**
- **Fix:** Normal for first payout (7-14 days)
- Verify bank account is verified

### **Issue 4: "Webhook Signature Failed"**
- **Fix:** Ensure STRIPE_WEBHOOK_SECRET is correct
- Must be from LIVE mode webhook endpoint

### **Issue 5: "Payment Declined"**
- **Cause:** Customer's bank declined
- Stripe Radar flagged as fraud
- **Fix:** Customer should try different card or contact bank

---

## 🧪 **TESTING CHECKLIST BEFORE LAUNCH**

- [ ] Live API keys added to `.env.local`
- [ ] Live API keys added to Vercel
- [ ] Webhook endpoint configured
- [ ] Webhook secret added to environment
- [ ] Redeploy on Vercel after key updates
- [ ] Make real test purchase with your card
- [ ] Verify payment shows in Stripe Dashboard
- [ ] Verify entry created in Supabase
- [ ] Test refund works
- [ ] Email receipts working
- [ ] Statement descriptor says "BABAWINA"

---

## 💰 **PRICING & FEES**

### **Stripe Fees (South Africa):**
- **Per transaction:** 2.9% + R2.00
- **For R10 entry:** R10.00 - (R0.29 + R2.00) = **R7.71 profit**
- **For R20 (2 entries):** R20.00 - (R0.58 + R2.00) = **R17.42 profit**
- **For R30 (3 for 2):** R20.00 - (R0.58 + R2.00) = **R17.42 profit** ✅

### **Payout Fees:**
- **To German bank:** Likely €1-€3 per payout
- **Recommendation:** Set weekly payouts to minimize fees

---

## 📞 **SUPPORT CONTACTS**

### **Stripe Support:**
- Email: support@stripe.com
- Live Chat: In Stripe Dashboard
- Phone: +27 21 300 5735 (South Africa)

### **Common Questions:**
- "When will my first payout arrive?" → 7-14 days
- "Why was payment declined?" → Customer's bank/fraud detection
- "How do I handle disputes?" → Respond in dashboard with proof

---

## ✅ **FINAL GO-LIVE CHECKLIST**

**Before announcing to public:**

1. **Legal:**
   - [ ] Terms & Conditions live
   - [ ] Privacy Policy live
   - [ ] POPIA compliant
   - [ ] Business registered (if required)

2. **Stripe:**
   - [ ] Account activated
   - [ ] Live keys configured
   - [ ] Webhooks set up
   - [ ] Test purchase successful
   - [ ] Payouts configured

3. **Platform:**
   - [ ] Landing page live
   - [ ] Payment flow tested
   - [ ] Email notifications working
   - [ ] Profile page working
   - [ ] Competition management working

4. **Support:**
   - [ ] support@babawina.co.za email set up
   - [ ] Ready to respond to customer issues
   - [ ] Refund policy clear

---

## 🎉 **YOU'RE READY TO LAUNCH!**

Once all checkboxes above are complete:

1. **Soft Launch:**
   - Test with friends/family first
   - Get 10-20 real transactions
   - Monitor for issues

2. **Public Launch:**
   - Announce on social media
   - Start marketing
   - Monitor Stripe dashboard daily

3. **Monitor First Week:**
   - Check dashboard 2x per day
   - Respond to support emails quickly
   - Watch for fraud/disputes

---

**Good luck! 🚀🎮💰**

Questions? Let me know!

