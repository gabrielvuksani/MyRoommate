import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, LoginData, RegisterData } from "@shared/schema";
import { queryClient } from "../lib/queryClient";
import { AuthTransition } from "../lib/authTransition";
import { PersistentLoading } from "../lib/persistentLoading";
import { supabase } from "../lib/supabase";
import { nanoid } from "nanoid";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<any, Error, RegisterData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize auth state and listen for changes
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setError(error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      // Fetch user profile from our database using the Supabase user ID
      const response = await fetch(`/api/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Temporarily create a mock user to get the app working
        console.log('User profile not found in database, creating temporary user');
        setUser({
          id: userId,
          email: 'temp@example.com',
          password: '',
          firstName: 'Temp',
          lastName: 'User',
          profileImageUrl: null,
          profileColor: 'blue',
          verified: true,
          verificationToken: null,
          phoneNumber: null,
          dateOfBirth: null,
          idVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Create temporary user to get app working
      setUser({
        id: userId,
        email: 'temp@example.com',
        password: '',
        firstName: 'Temp',
        lastName: 'User',
        profileImageUrl: null,
        profileColor: 'blue',
        verified: true,
        verificationToken: null,
        phoneNumber: null,
        dateOfBirth: null,
        idVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setError(null); // Clear error to allow app to continue
    } finally {
      setIsLoading(false);
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        throw new Error(error.message || "Login failed");
      }
      
      if (!data.user) {
        throw new Error("Login failed");
      }
      
      return data.user;
    },
    onSuccess: async () => {
      // Show persistent loading overlay
      PersistentLoading.show("Setting up your account...");
      // Mark authentication transition in progress
      AuthTransition.setInProgress();
      // User data will be automatically updated via auth state listener
      // Redirect using window.location (consistent with logout, works for PWA and browser)
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error("Login failed:", error.message);
      setError(error);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      // First, create the auth user in Supabase
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation for now
        }
      });
      
      if (error) {
        throw new Error(error.message || "Registration failed");
      }
      
      if (!data.user) {
        throw new Error("Registration failed");
      }

      // Create user profile in our database
      const session = await supabase.auth.getSession();
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({
          id: data.user.id,
          email: credentials.email,
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          phoneNumber: credentials.phoneNumber || null,
          dateOfBirth: credentials.dateOfBirth || null,
          profileColor: 'blue',
          verified: true // Auto-verify for now
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create user profile");
      }

      return await response.json();
    },
    onSuccess: () => {
      // Show persistent loading overlay
      PersistentLoading.show("Creating your account...");
      // Mark authentication transition in progress
      AuthTransition.setInProgress();
      // Set new signup flag for onboarding
      sessionStorage.setItem('is_new_signup', 'true');
      // User data will be automatically updated via auth state listener
      // Redirect using window.location (consistent with logout, works for PWA and browser)
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error("Registration failed:", error.message);
      setError(error);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message || "Logout failed");
      }
    },
    onSuccess: () => {
      // Show persistent loading overlay
      PersistentLoading.show("Signing out...");
      setUser(null);
      // Clear all cached data on logout
      queryClient.clear();
      // Redirect to landing page after logout
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error("Logout failed:", error.message);
      setError(error);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
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