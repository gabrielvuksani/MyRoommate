import { createClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration error:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPreview: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'missing'
  })
  throw new Error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Check if URL and key are swapped (common mistake)
if (supabaseUrl.startsWith('eyJ') && !supabaseAnonKey.startsWith('eyJ')) {
  console.warn('It appears VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are swapped. Auto-correcting...')
  const tempUrl = supabaseUrl
  supabaseUrl = supabaseAnonKey
  supabaseAnonKey = tempUrl
  console.log('Auto-correction applied')
}

// Validate URL format after potential swap
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('Invalid Supabase URL format:', supabaseUrl)
  throw new Error('VITE_SUPABASE_URL must be a valid Supabase URL (https://your-project.supabase.co)')
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