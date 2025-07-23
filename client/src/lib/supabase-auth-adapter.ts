// Adapter to bridge between old custom auth and new Supabase auth
// This allows us to maintain the same user interface while migrating

import { Profile } from "@shared/schema";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Convert Supabase user + profile to our legacy User interface
export function createLegacyUser(supabaseUser: SupabaseUser | null, profile: Profile | null) {
  if (!supabaseUser) return null;
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    profileImageUrl: profile?.profileImageUrl || '',
    profileColor: profile?.profileColor || 'blue',
    verified: supabaseUser.email_confirmed_at !== null,
    phoneNumber: profile?.phoneNumber || '',
    dateOfBirth: profile?.dateOfBirth || null,
    idVerified: profile?.idVerified || false,
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: profile?.updatedAt || new Date(),
  };
}

// Helper to check if user needs onboarding
export function needsOnboarding(user: any): boolean {
  return !user?.firstName || !user?.lastName;
}