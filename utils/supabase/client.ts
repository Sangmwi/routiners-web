import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance for better performance
let browserClient: SupabaseClient | null = null

export function createClient() {
  // Return existing client if already initialized
  if (browserClient) {
    return browserClient
  }

  // Create new client and store it
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return browserClient
}

