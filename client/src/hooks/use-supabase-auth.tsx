import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { 
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { queryClient } from "../lib/queryClient";
import { AuthTransition } from "../lib/authTransition";
import { PersistentLoading } from "../lib/persistentLoading";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@shared/schema";
import { createLegacyUser } from "../lib/supabase-auth-adapter";

export interface AuthContextType {
  user: any | null; // Legacy user format for compatibility
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  forgotPasswordMutation: UseMutationResult<void, Error, { email: string }>;
  resetPasswordMutation: UseMutationResult<void, Error, { password: string }>;
  updateProfileMutation: UseMutationResult<Profile, Error, Partial<Profile>>;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile query - only fetch if user exists
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["profile", supabaseUser?.id],
    queryFn: async () => {
      if (!supabaseUser?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // Row not found
        throw error;
      }
      
      return data;
    },
    enabled: !!supabaseUser?.id,
  });

  // Create legacy user object for compatibility
  const user = createLegacyUser(supabaseUser, profile);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSupabaseUser(session?.user ?? null);
        setIsLoading(false);
        
        // Clear all queries when user logs out
        if (event === 'SIGNED_OUT') {
          queryClient.clear();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) throw error;
      if (!data.user) throw new Error('Login failed');
      
      return data.user;
    },
    onSuccess: () => {
      PersistentLoading.show("Setting up your account...");
      AuthTransition.setInProgress();
      // Redirect will happen automatically via auth state change
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Login failed:", error.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) throw error;
      if (!data.user) throw new Error('Registration failed');
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: credentials.email,
          first_name: credentials.firstName,
          last_name: credentials.lastName,
          profile_color: 'blue',
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw here as the user account was created successfully
      }
      
      return data.user;
    },
    onSuccess: () => {
      PersistentLoading.show("Setting up your account...");
      AuthTransition.setInProgress();
      sessionStorage.setItem('is_new_signup', 'true');
      // Redirect will happen automatically via auth state change
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Registration failed:", error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      PersistentLoading.show("Logging out...");
      AuthTransition.setInProgress();
      queryClient.clear();
      // Redirect will happen automatically via auth state change
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Logout failed:", error.message);
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!supabaseUser?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', supabaseUser.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update the profile cache
      queryClient.setQueryData(["profile", supabaseUser?.id], data);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: profile ?? null,
        isLoading,
        error: null,
        loginMutation,
        registerMutation,
        logoutMutation,
        forgotPasswordMutation,
        resetPasswordMutation,
        updateProfileMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}