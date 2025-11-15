# Setup Daily Visit Counter

## 📋 What This Does:

- **Resets at midnight (00:00)** every day
- **Increments by 1** every time someone visits the landing page
- **Shows the same number** to all visitors
- **Stored in Supabase** (shared across all users)

---

## 🚀 Setup Instructions:

### **Step 1: Run the SQL Migration**

1. Go to **Supabase Dashboard** → Your project
2. Click **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy and paste the contents of `supabase-migrations/create-daily-visit-counter.sql`
5. Click **RUN** (or press F5)

You should see:
```
Success. No rows returned
```

---

### **Step 2: Verify the Table Was Created**

Run this query to check:

```sql
SELECT * FROM daily_visit_counter;
```

You should see an empty table (or 0 rows).

---

### **Step 3: Test the Counter**

1. **Refresh your landing page** → Counter should show "1 entry in the last 24 hours!"
2. **Refresh again** → Should show "2 entries in the last 24 hours!"
3. **Open in another browser/incognito** → Should show same number (3, 4, etc.)

---

## 🔧 How It Works:

### **Database Table:**
```
daily_visit_counter
├── id (uuid)
├── date (date) ← Today's date
├── visit_count (integer) ← Number of visits today
└── created_at (timestamp)
```

### **Functions:**
- `increment_daily_visits()` → Adds 1 to today's count
- `get_daily_visits()` → Returns today's count without incrementing

### **API Routes:**
- `POST /api/increment-visit` → Increments and returns new count
- `GET /api/increment-visit` → Returns current count without incrementing

---

## 🌙 Midnight Reset:

The counter automatically resets because:
- Each row has a `date` field (e.g., `2025-11-15`)
- When midnight hits → new date (e.g., `2025-11-16`)
- Next visitor creates a new row for the new date
- Old rows remain in database for analytics

---

## 📊 Optional: View All-Time Stats

Run this query to see historical data:

```sql
SELECT 
  date,
  visit_count,
  to_char(date, 'Day') as day_name
FROM daily_visit_counter
ORDER BY date DESC;
```

---

## ✅ Done!

Your visit counter is now live and will:
- Start at 0 every midnight
- Increment every time someone visits
- Show the same number to all visitors

**Test it now by refreshing your page!** 🎉

