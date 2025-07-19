import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, LoginData, RegisterData } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";

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
      // Use form submission to let server handle redirect
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/login';
      
      const emailInput = document.createElement('input');
      emailInput.type = 'hidden';
      emailInput.name = 'email';
      emailInput.value = credentials.email;
      
      const passwordInput = document.createElement('input');
      passwordInput.type = 'hidden';
      passwordInput.name = 'password';
      passwordInput.value = credentials.password;
      
      form.appendChild(emailInput);
      form.appendChild(passwordInput);
      document.body.appendChild(form);
      form.submit();
    },
    onError: (error: Error) => {
      console.error("Login failed:", error.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      // Use form submission to let server handle redirect
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/register';
      
      Object.entries(credentials).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
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