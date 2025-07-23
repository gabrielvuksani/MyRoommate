import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          profile_image_url: string | null
          profile_color: string | null
          phone_number: string | null
          date_of_birth: string | null
          id_verified: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          profile_image_url?: string | null
          profile_color?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          id_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          profile_image_url?: string | null
          profile_color?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          id_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']