import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase config debug:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlPrefix: supabaseUrl?.substring(0, 20),
  keyPrefix: supabaseAnonKey?.substring(0, 20)
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl.substring(0, 50)}... Should start with https://`)
}

// Validate anon key format (should be a JWT)
if (!supabaseAnonKey.startsWith('eyJ')) {
  throw new Error(`Invalid Supabase anon key format: ${supabaseAnonKey.substring(0, 20)}... Should be a JWT starting with eyJ`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Storage bucket name for profile images
export const PROFILE_IMAGES_BUCKET = 'profile-images'
export const LISTING_IMAGES_BUCKET = 'listing-images'