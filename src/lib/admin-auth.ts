/**
 * Admin Authentication Helper
 * Works around Supabase auth hanging issues
 */

/**
 * Get auth token from localStorage
 * This is our only option since getSession() hangs
 */
export async function getValidAuthToken(): Promise<string> {
  console.log('🔑 Getting auth token from localStorage...')

  // Read from localStorage (only option that doesn't hang)
  const authData = localStorage.getItem('sb-auth-token')
  
  if (!authData) {
    throw new Error('🔐 Not authenticated. Please refresh the page and log in.')
  }

  try {
    const parsed = JSON.parse(authData)
    const token = parsed?.access_token || parsed?.currentSession?.access_token
    
    if (!token) {
      throw new Error('🔐 No auth token found. Please refresh the page.')
    }

    console.log('✅ Token obtained from localStorage')
    return token
    
  } catch (e) {
    throw new Error('🔐 Auth data corrupted. Please refresh the page.')
  }
}

/**
 * Make an authenticated API call
 * If token expired, shows helpful error message
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getValidAuthToken()
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  }

  const response = await fetch(url, { ...options, headers })

  // Check for auth errors but don't consume body
  if (response.status === 403) {
    // Clone response so we can read it without consuming original
    const clonedResponse = response.clone()
    
    try {
      const error = await clonedResponse.json()
      
      if (error.error && (error.error.includes('expired') || error.error.includes('invalid'))) {
        throw new Error(
          '⏰ Your session has expired.\n\n' +
          '👉 Solution: Press F5 to refresh the page.\n\n' +
          '(Tokens expire after ~1 hour of inactivity)'
        )
      }
    } catch (e) {
      // If we can't parse, just return original response
    }
  }

  return response
}

