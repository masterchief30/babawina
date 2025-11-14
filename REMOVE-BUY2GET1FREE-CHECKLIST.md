# ✅ REMOVE "BUY 2 GET 1 FREE" - COMPLETE CHECKLIST

## 📋 **CHANGES MADE:**

### **1. Landing Page ✅**
- ✅ Updated banner from "Buy 2 Entries, Get 1 FREE!" to "Win a PS5 for only R15 per entry!"
- ✅ Changed banner color from green to blue
- ✅ Updated stats section from "Buy 2, Get 1 FREE" to "R15 per Entry"

**File:** `src/components/home/home-page.tsx`

---

### **2. Payment Processing ✅**
- ✅ Removed "Buy 2 Get 1 Free" calculation logic
- ✅ Simplified to: All entries are paid at R15 each
- ✅ Updated pricing breakdown logs
- ✅ Set `freeCount = 0` always

**File:** `src/app/api/stripe/submit-batch/route.ts`

---

### **3. Client-Side Pricing ✅**
- ✅ Simplified `calculatePricing()` function
- ✅ Removed every-3rd-entry-free logic
- ✅ All entries now paid
- ✅ UI already hides free entry display when `freeCount = 0`

**File:** `src/components/game/play-competition-client.tsx`

---

### **4. Terms & Conditions ✅**
- ✅ Updated entry price from R10.00 to R15.00
- ✅ Removed "Buy 2 Get 1 Free" promotion text
- ✅ Added "Simple Pricing" explanation

**File:** `src/app/terms/page.tsx`

---

### **5. Database Migration ✅**
- ✅ Created SQL script to remove free entry trigger
- ✅ Simplifies counter logic
- ✅ Updates all competitions to R15

**File:** `supabase-migrations/remove-buy2get1free.sql`

---

## 🔧 **ACTIONS REQUIRED:**

### **Step 1: Run SQL Migration**

1. Go to Supabase Dashboard
2. Click **SQL Editor**
3. Open the file: `supabase-migrations/remove-buy2get1free.sql`
4. Copy and paste the entire content
5. Click **RUN**

**This will:**
- Drop the "Buy 2 Get 1 Free" trigger
- Simplify the counter function
- Update all competitions to R15
- Clean up the database

---

### **Step 2: Update Existing Competition Prices**

**Option A: Via Admin Panel**
1. Go to `/admin/manage`
2. Edit each competition
3. Set `entry_price_rand` to **15**
4. Click "Update"

**Option B: Via SQL (Faster)**
```sql
-- Already included in migration script above
UPDATE competitions 
SET entry_price_rand = 15
WHERE entry_price_rand IN (0, 10);
```

---

### **Step 3: Restart Dev Server**

```bash
# Stop dev server (Ctrl+C)
# Then restart:
npm run dev
```

---

### **Step 4: Test Everything**

#### **Landing Page:**
- [ ] Banner says "Win a PS5 for only R15 per entry!"
- [ ] Banner is blue (not green)
- [ ] Stats section shows "R15 per Entry"

#### **Competition Play Page:**
- [ ] Price shows "R15" per entry
- [ ] No "FREE" badges appear
- [ ] Pricing summary shows only paid entries
- [ ] Total calculates correctly (entries × R15)

#### **Payment Flow:**
- [ ] Charge is correct (e.g., 2 entries = R30)
- [ ] No free entries created in database
- [ ] All entries have `was_free_entry = false`

#### **Database:**
- [ ] All competitions show `entry_price_rand = 15`
- [ ] Old trigger `calculate_next_free_submission` is gone
- [ ] New trigger `increment_submission_counter` exists

---

## 📊 **PRICING COMPARISON:**

### **OLD (Buy 2 Get 1 Free @ R10):**
```
2 entries = R20 (R10 each)
3 entries = R20 (1 free!)
```
**Effective price:** R6.67 per entry

### **NEW (Simple @ R15):**
```
1 entry = R15
2 entries = R30
3 entries = R45
```
**Price per entry:** R15

---

## 💰 **FINANCIAL IMPACT:**

### **Break-Even for PS5 (R13,000):**

**OLD Pricing (R10 with 30% Stripe fees):**
- Net per entry: R4.67
- Entries needed: **2,784**
- Gross revenue: R18,560

**NEW Pricing (R15 with 30% Stripe fees):**
- Net per entry: R7.00
- Entries needed: **1,857**
- Gross revenue: R27,855
- **Profit: R6,498** ✅

### **You need 33% FEWER entries to break even!** 🎯

---

## ✅ **VERIFICATION QUERIES:**

After running the migration, verify in Supabase:

```sql
-- 1. Check all competitions are R15
SELECT id, title, entry_price_rand 
FROM competitions;

-- 2. Verify no free entry logic remains
SELECT COUNT(*) as free_entries 
FROM competition_entries 
WHERE was_free_entry = true;

-- 3. Check trigger exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'increment_submission_counter';

-- 4. Verify old trigger is gone
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'calculate_next_free_submission';
-- Should return 0 rows
```

---

## 🚨 **TROUBLESHOOTING:**

### **Issue: Landing page still shows "Buy 2 Get 1 FREE"**
**Fix:** Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### **Issue: Entries still showing as free**
**Fix:** 
1. Check database migration ran successfully
2. Restart dev server
3. Clear localStorage: `localStorage.clear()`

### **Issue: Pricing calculation wrong**
**Fix:**
1. Verify `calculatePricing()` updated in client
2. Verify API route updated
3. Check browser console for errors

### **Issue: Stripe charge incorrect**
**Fix:**
1. Verify competition `entry_price_rand = 15`
2. Check API logs for pricing breakdown
3. Ensure no cached old pricing logic

---

## 📱 **MOBILE TESTING:**

Test on mobile/small screens:
- [ ] Banner text readable
- [ ] "R15 per entry" fits on one line
- [ ] Pricing summary clear
- [ ] Payment flow smooth

---

## 🎯 **SUCCESS CRITERIA:**

You've successfully removed "Buy 2 Get 1 Free" when:

✅ Landing page shows "R15 per entry"  
✅ All competitions cost R15  
✅ No entries marked as `was_free_entry = true`  
✅ Pricing calculation shows only paid entries  
✅ Stripe charges correct amount (entries × R15)  
✅ Terms updated to R15  
✅ Database trigger simplified  

---

## 📞 **SUPPORT:**

If anything doesn't work:
1. Check browser console for errors
2. Check Supabase logs
3. Verify SQL migration ran
4. Try incognito mode (fresh session)

---

**Your platform is now on simple, clear R15 pricing!** 🎉💰

Better margins + easier to understand = Win-win! 🚀

