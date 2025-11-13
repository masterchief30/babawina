# 🍪 Auth Cookie Issue & Fix

## 🐛 **The Problem**

**Profile page wasn't showing competitions** because:

1. ✅ **Client-side:** User logged in → stored in `localStorage`
2. ❌ **Server-side:** Can't read `localStorage` → No user detected → Empty data

### **Evidence:**
```
🍪 Server cookies: [ '__stripe_mid', '__stripe_sid', '__next_hmr_refresh_hash__' ]
❌ No Supabase auth cookies!
```

**Supabase cookies should be:**
- `sb-<project>-auth-token`
- `sb-<project>-auth-token-code-verifier`

---

## 🔍 **Root Cause**

Your authentication flow:
1. User signs up/logs in
2. Supabase client saves session to **localStorage only**
3. **No cookies set!**
4. Server components can't read localStorage
5. Server thinks user is not logged in
6. Returns empty competition data

---

## ✅ **The Fix: Client-Side Data Fetching**

Since auth is client-side only, we now fetch competition data client-side too!

### **Changes Made:**

**File:** `src/components/profile/profile-client-content.tsx`

**Added:**
```typescript
// Fetch competitions client-side if server-side fetch failed
useEffect(() => {
  if (user && userCompetitions.length === 0 && !isLoadingCompetitions) {
    console.log('🔄 Client-side: Fetching competitions...')
    
    const fetchCompetitions = async () => {
      // Fetch entries from Supabase (client-side has auth!)
      const { data: userEntries } = await supabase
        .from('competition_entries')
        .select('*')
        .eq('user_id', user.id)
      
      // Group by competition
      // Update state
      setUserCompetitions(groupedCompetitions)
    }
    
    fetchCompetitions()
  }
}, [user, userCompetitions.length])
```

**How it works:**
1. ✅ Profile page renders (server-side returns empty `[]`)
2. ✅ Client hydrates, AuthContext detects user from localStorage
3. ✅ useEffect triggers: "Hey, user exists but competitions is empty!"
4. ✅ Fetches data client-side (client has auth token!)
5. ✅ Updates state → Competitions appear!

---

## 🧪 **Test It**

1. **Refresh `/profile?tab=competitions`**
2. **Watch browser console:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 ProfileClientContent rendered
📊 Received initialCompetitions: []
📦 Competition count: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Client-side: Fetching competitions for user: xxx
📊 Client-side: Fetched 19 entries
✅ Client-side: Grouped into 1 competitions
```

3. **Competitions should appear!** 🎉

---

## 🔮 **Future: Proper Cookie-Based Auth**

For production, you should configure Supabase to use **cookies** instead of localStorage:

### **Option 1: Middleware (Recommended)**

Create `middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getSession()
  return response
}
```

### **Option 2: Server Actions for Auth**

Use Next.js server actions for login/signup to properly set cookies.

---

## 📊 **Current State**

**Working:**
- ✅ Batch submission (Buy 2 Get 1 Free per session)
- ✅ Payment processing
- ✅ Entry saving
- ✅ Profile page competitions (client-side fetch)

**Known Limitation:**
- ⚠️ Auth is localStorage-based (client-side only)
- ⚠️ Initial page load shows "No competitions" briefly
- ⚠️ Server components can't access user data

**Acceptable for development/testing!** ✅

