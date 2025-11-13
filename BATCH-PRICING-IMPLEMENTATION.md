# 🎉 Batch-Based "Buy 2 Get 1 Free" Implementation

## ✅ **What Changed**

The "Buy 2 Get 1 Free" logic is now **per submission session**, not cumulative!

---

## 🎯 **New Behavior**

### **Session 1: Submit 3 bets**
| Position | Cost | Total |
|----------|------|-------|
| Bet #1 | 💳 R10 | R10 |
| Bet #2 | 💳 R10 | R20 |
| Bet #3 | 🎁 FREE | R20 |

### **Session 2 (Later): Submit 2 bets**
| Position | Cost | Total |
|----------|------|-------|
| Bet #1 | 💳 R10 | R10 |
| Bet #2 | 💳 R10 | R20 |

**Counter resets!** No carry-over from previous session.

### **Session 3 (Later): Submit 4 bets**
| Position | Cost | Total |
|----------|------|-------|
| Bet #1 | 💳 R10 | R10 |
| Bet #2 | 💳 R10 | R20 |
| Bet #3 | 🎁 FREE | R20 |
| Bet #4 | 💳 R10 | R30 |

---

## 🏗️ **Architecture**

### **Old System (Cumulative):**
```
Frontend                    Backend (Per Entry)
┌─────────────────┐        ┌──────────────────────┐
│ 3 bets in cart  │        │ Counter: total = 10  │
│                 │───────→│ Entry 1: Position 11 │
│ Submit button   │   ×3   │   → Paid (11%3≠0)    │
└─────────────────┘  calls │ Entry 2: Position 12 │
                            │   → FREE (12%3=0)    │
                            │ Entry 3: Position 13 │
                            │   → Paid (13%3≠0)    │
                            └──────────────────────┘
                            ❌ Wrong pricing!
```

### **New System (Batch):**
```
Frontend                    Backend (Batch)
┌─────────────────┐        ┌──────────────────────┐
│ 3 bets in cart  │        │ Batch: 3 entries     │
│                 │───────→│ Entry 1: Position 1  │
│ Submit button   │  once  │   → Paid (1%3≠0)     │
└─────────────────┘        │ Entry 2: Position 2  │
                            │   → Paid (2%3≠0)     │
                            │ Entry 3: Position 3  │
                            │   → FREE (3%3=0)     │
                            └──────────────────────┘
                            ✅ Correct pricing!
                            💳 Charge R20 once
```

---

## 📁 **Files Created/Modified**

### **1. New API Endpoint**
**File:** `src/app/api/stripe/submit-batch/route.ts`

**What it does:**
- ✅ Accepts array of entries
- ✅ Calculates "Buy 2 Get 1 Free" for the batch only
- ✅ Charges card ONCE for all paid entries
- ✅ Inserts all entries in one transaction
- ✅ Updates counter for statistics (optional)

**Key Logic:**
```typescript
// Every 3rd entry in the BATCH is free
const entriesWithPricing = entries.map((entry, index) => {
  const position = index + 1  // Position in THIS batch
  const isFree = position % 3 === 0
  return { ...entry, isFree, position }
})

const paidCount = entriesWithPricing.filter(e => !e.isFree).length
const totalAmount = paidCount * competition.entry_price_rand

// Charge ONCE for all paid entries
const paymentIntent = await chargePaymentMethod({
  amountCents: randToCents(totalAmount),
  description: `${paidCount} entries for ${competition.title}`
})
```

### **2. Updated Frontend**
**File:** `src/components/game/play-competition-client.tsx`

**Changes:**
- ✅ Modified `calculatePricing()` to calculate per-batch
- ✅ Modified `processSubmissions()` to call `/api/stripe/submit-batch`
- ✅ Updated entry list display to show batch-based pricing
- ✅ Removed dependency on `submissionStatus.totalSubmissions`

**Key Logic:**
```typescript
// Calculate pricing for THIS SESSION ONLY
const calculatePricing = () => {
  const pendingEntries = gameEntries.filter(entry => !entry.submitted)
  
  pendingEntries.forEach((_, index) => {
    const position = index + 1  // Position in THIS batch (resets each session)
    const isFree = position % 3 === 0
    // ...
  })
}

// Submit ALL entries in ONE batch
const response = await fetch('/api/stripe/submit-batch', {
  method: 'POST',
  body: JSON.stringify({
    userId,
    competitionId: competition.id,
    entries: entriesForApi  // Array of all entries
  })
})
```

---

## 🧪 **Testing Scenarios**

### **Test 1: Submit 3 Bets**
```
Expected:
- Entry 1: Pay R10
- Entry 2: Pay R10  
- Entry 3: Free
- Total: R20 charged
- Toast: "3 entries submitted! Paid: 2, Free: 1"
```

### **Test 2: Submit 2 Bets (After Test 1)**
```
Expected:
- Entry 1: Pay R10
- Entry 2: Pay R10
- Total: R20 charged (counter resets!)
- Toast: "2 entries submitted! Paid: 2, Free: 0"
```

### **Test 3: Submit 5 Bets**
```
Expected:
- Entry 1: Pay R10
- Entry 2: Pay R10
- Entry 3: Free
- Entry 4: Pay R10
- Entry 5: Pay R10
- Total: R40 charged
- Toast: "5 entries submitted! Paid: 4, Free: 1"
```

### **Test 4: Submit 6 Bets**
```
Expected:
- Entries 1-2: Pay R10 each
- Entry 3: Free
- Entries 4-5: Pay R10 each
- Entry 6: Free
- Total: R40 charged
- Toast: "6 entries submitted! Paid: 4, Free: 2"
```

---

## 🔍 **What to Watch For**

### **Console Logs (Frontend):**
```
💳 PROCESSING BATCH SUBMISSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Pending entries to submit: 3
👤 User ID: xxx
🎯 Competition ID: xxx
📤 Sending batch of 3 entries to API...
📡 Response status: 200 OK
✅ Batch submission successful!
   Entries submitted: 3
   Paid entries: 2
   Free entries: 1
   Total charged: R 20
✅ ALL 3 ENTRIES SUBMITTED!
🔄 Redirecting to profile in 2 seconds...
```

### **Console Logs (Backend):**
```
📦 BATCH SUBMISSION API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 User ID: xxx
🎯 Competition ID: xxx
📦 Number of entries: 3
💵 PRICING BREAKDOWN (THIS BATCH ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total entries: 3
💳 Paid entries: 2
🎁 Free entries: 1
💰 Total charge: 20 RAND
  Position 1: 💳 R10
  Position 2: 💳 R10
  Position 3: 🎁 FREE

💳 CHARGING CARD FOR 2 PAID ENTRIES...
✅ Payment successful!
📝 SAVING 3 ENTRIES TO DATABASE...
✅ All entries saved!
✅ BATCH SUBMISSION COMPLETE!
```

### **Database Verification:**
```sql
-- Check recent entries
SELECT 
  id,
  guess_x,
  guess_y,
  was_free_entry,
  created_at
FROM competition_entries
WHERE user_id = 'your-user-id'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- Check recent transactions
SELECT 
  amount_cents,
  entries_purchased,
  stripe_payment_intent_id,
  created_at
FROM transactions
WHERE user_id = 'your-user-id'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

**Expected Results:**
- 3 entries: 2 with `was_free_entry=false`, 1 with `was_free_entry=true`
- 1 transaction: `amount_cents=2000` (R20), `entries_purchased=2` (not 3!)

---

## 🎯 **Key Benefits**

✅ **Simple UX:** Submit 3, pay for 2. Submit 2, pay for 2. No confusion!  
✅ **One Charge:** Single Stripe payment per submission (lower fees)  
✅ **Atomic:** All entries succeed or all fail (no partial submissions)  
✅ **Fast:** One API call instead of looping  
✅ **Clear Pricing:** Users see exactly what they'll pay before confirming  

---

## 🚀 **Ready to Test!**

1. **Go to competition page**
2. **Place 3 bets** (click 3 times on image)
3. **Click "SUBMIT 3 BETS → R20"**
4. **Confirm payment** in modal
5. **Watch console logs!**
6. **Verify:**
   - Charged R20 ✅
   - 3 entries in database (2 paid, 1 free) ✅
   - Redirected to profile ✅
   - Entries show up on profile page ✅

---

**Counter resets each session!** 🔄

