# 🎯 Auto-Close Competitions & Calculate Winners

## ✅ What Was Implemented

Competitions now **automatically close** and **winners are calculated** using:
- **pg_cron** - Supabase's built-in scheduler
- Runs every hour automatically
- No external services needed!

---

## 🔧 Setup Instructions

### 1. Run the SQL Migration

**Go to Supabase SQL Editor and run:**

```sql
-- =====================================================
-- AUTO-CLOSE EXPIRED COMPETITIONS & CALCULATE WINNERS
-- =====================================================

-- Function to close expired competitions and calculate winners
CREATE OR REPLACE FUNCTION close_expired_competitions()
RETURNS TABLE (
  competition_id uuid,
  competition_title text,
  action_taken text,
  winner_user_id uuid,
  winner_distance numeric
) AS $$
DECLARE
  comp_record RECORD;
  closest_entry RECORD;
  judged_x_val numeric;
  judged_y_val numeric;
BEGIN
  -- Find all competitions that should be closed
  -- (status is 'live' and end date has passed)
  FOR comp_record IN
    SELECT 
      id,
      title,
      judged_x_norm,
      judged_y_norm
    FROM competitions
    WHERE status = 'live'
    AND ends_at < NOW()
  LOOP
    -- Update competition status to 'closed'
    UPDATE competitions
    SET status = 'closed'
    WHERE id = comp_record.id;
    
    -- Return the action taken
    competition_id := comp_record.id;
    competition_title := comp_record.title;
    action_taken := 'closed';
    winner_user_id := NULL;
    winner_distance := NULL;
    
    RETURN NEXT;
    
    -- Calculate winner if judged coordinates exist
    IF comp_record.judged_x_norm IS NOT NULL AND comp_record.judged_y_norm IS NOT NULL THEN
      judged_x_val := comp_record.judged_x_norm;
      judged_y_val := comp_record.judged_y_norm;
      
      -- Find the entry closest to the judged position
      SELECT 
        ce.id,
        ce.user_id,
        ce.guess_x,
        ce.guess_y,
        SQRT(
          POWER(ce.guess_x - judged_x_val, 2) + 
          POWER(ce.guess_y - judged_y_val, 2)
        ) as distance
      INTO closest_entry
      FROM competition_entries ce
      WHERE ce.competition_id = comp_record.id
      ORDER BY distance ASC
      LIMIT 1;
      
      -- If we found a closest entry, mark it as winner
      IF closest_entry.id IS NOT NULL THEN
        -- Mark the winning entry
        UPDATE competition_entries
        SET is_winner = true
        WHERE id = closest_entry.id;
        
        -- Update competition to 'judged' status
        UPDATE competitions
        SET status = 'judged'
        WHERE id = comp_record.id;
        
        -- Return winner info
        competition_id := comp_record.id;
        competition_title := comp_record.title;
        action_taken := 'judged_winner_calculated';
        winner_user_id := closest_entry.user_id;
        winner_distance := closest_entry.distance;
        
        RETURN NEXT;
      END IF;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;
```

---

### 2. Enable pg_cron in Supabase

✅ **Already done!** (You just enabled it)

---

### 3. Schedule the Cron Job

**In Supabase SQL Editor, run:**

```sql
-- Run every hour
SELECT cron.schedule(
  'close-expired-competitions',
  '0 * * * *',  -- Every hour at minute 0
  $$ SELECT close_expired_competitions(); $$
);
```

**Verify it was scheduled:**

```sql
SELECT * FROM cron.job;
```

You should see your job listed!

---

## 🎯 How It Works

### **Every Hour (Automatically):**

1. ✅ pg_cron triggers at `:00` (e.g., 1:00, 2:00, 3:00)
2. ✅ Calls the database function `close_expired_competitions()`
3. ✅ Function finds competitions where `ends_at < NOW()` and `status = 'live'`
4. ✅ Sets status to `'closed'`
5. ✅ If `judged_x_norm` and `judged_y_norm` are set:
   - Calculates which entry is closest
   - Marks that entry as winner (`is_winner = true`)
   - Updates status to `'judged'`
6. ✅ Users see updated competitions on next page load

---

## 🧪 Testing

### **Manual Test (Run the Function Now):**

**In Supabase SQL Editor:**

```sql
SELECT * FROM close_expired_competitions();
```

You'll see results like:
```
competition_id | competition_title | action_taken              | winner_user_id | winner_distance
---------------|-------------------|---------------------------|----------------|----------------
uuid...        | WIN PS5          | judged_winner_calculated  | uuid...        | 0.05
```

### **Check Cron Job History:**

```sql
-- See all cron job runs
SELECT * FROM cron.job_run_details 
WHERE jobid = 1 
ORDER BY start_time DESC 
LIMIT 10;
```

---

## ⚙️ What Happens When:

### **Competition Ends WITHOUT judged coordinates:**
- Status: `live` → `closed`
- Winner: Not calculated (needs manual judging in admin panel)

### **Competition Ends WITH judged coordinates:**
- Status: `live` → `judged`
- Winner: Automatically calculated and marked
- User can see they won on their profile!

---

## 🚀 Production Notes

When deploying to Vercel/production:

1. Update `.env.local` with your production URL:
   ```bash
   NEXT_PUBLIC_BASE_URL=https://babawina.co.za
   ```

2. The function will auto-run whenever someone visits your site

3. No additional setup needed!

---

## 📊 Monitoring

Check server logs to see when competitions close:

```
🔄 Checking for expired competitions...
✅ Processed 1 competition(s):
  - WIN PS5: judged_winner_calculated
    Winner: 93bc053d-... (distance: 0.05)
```

---

## ✨ Benefits

✅ **No cron jobs** - Runs on page load  
✅ **Automatic** - No manual intervention needed  
✅ **Fast** - Database function is efficient  
✅ **Reliable** - Works as long as people visit your site  
✅ **Winner calculation** - Instant results when coordinates are set  

---

**You're all set!** 🎉

