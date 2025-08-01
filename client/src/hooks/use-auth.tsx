import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, LoginData, RegisterData } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { AuthTransition } from "../lib/authTransition";
import { PersistentLoading } from "../lib/persistentLoading";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      return await res.json();
    },
    onSuccess: async (user: User) => {
      // Show persistent loading overlay
      PersistentLoading.show("Setting up your account...");
      // Mark authentication transition in progress
      AuthTransition.setInProgress();
      // Set user data immediately for instant UI update
      queryClient.setQueryData(["/api/user"], user);
      
      // Automatically set up push notifications after successful login
      try {
        const { notificationService } = await import('@/lib/notifications');
        await notificationService.init();
        if (notificationService.getPermissionStatus() === 'granted') {
          await notificationService.subscribeToPush();
        }
      } catch (error) {
        // Silent fail for notification setup
      }
      
      // Redirect using window.location (consistent with logout, works for PWA and browser)
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error("Login failed:", error.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      // Show persistent loading overlay
      PersistentLoading.show("Setting up your account...");
      // Mark authentication transition in progress
      AuthTransition.setInProgress();
      // Set flag for new user signup
      sessionStorage.setItem('is_new_signup', 'true');
      // Set user data immediately for instant UI update
      queryClient.setQueryData(["/api/user"], user);
      // Redirect using window.location (consistent with logout, works for PWA and browser)
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error("Registration failed:", error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      // Show persistent loading overlay
      PersistentLoading.show("Signing out...");
      queryClient.setQueryData(["/api/user"], null);
      // Clear all cached data on logout
      queryClient.clear();
      // Redirect to landing page after logout
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error("Logout failed:", error.message);
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