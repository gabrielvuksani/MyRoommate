import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, userData: { firstName: string; lastName: string }) => Promise<{ user: User | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: { firstName?: string; lastName?: string; profileColor?: string }) => Promise<{ error: Error | null }>;
  uploadProfileImage: (file: File) => Promise<{ url: string | null; error: Error | null }>;
  deleteProfileImage: () => Promise<{ error: Error | null }>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: { firstName: string; lastName: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileColor: 'blue'
        }
      }
    });

    return { user: data.user, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { user: data.user, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updateProfile = async (updates: { firstName?: string; lastName?: string; profileColor?: string }) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase.auth.updateUser({
      data: updates
    });

    return { error };
  };

  const uploadProfileImage = async (file: File) => {
    if (!user) return { url: null, error: new Error('No user logged in') };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        return { url: null, error: uploadError };
      }

      // Get public URL
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update user metadata with image URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { profileImageUrl: data.publicUrl }
      });

      if (updateError) {
        return { url: null, error: updateError };
      }

      return { url: data.publicUrl, error: null };
    } catch (error) {
      return { url: null, error: error as Error };
    }
  };

  const deleteProfileImage = async () => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const fileName = `${user.id}.jpg`; // We'll need to handle different extensions
      const filePath = `profile-images/${fileName}`;

      // Delete from storage
      await supabase.storage
        .from('profile-images')
        .remove([filePath]);

      // Update user metadata to remove image URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { profileImageUrl: null }
      });

      return { error: updateError };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        uploadProfileImage,
        deleteProfileImage,
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