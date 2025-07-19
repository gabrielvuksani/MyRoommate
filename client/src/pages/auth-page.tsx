import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, Home, User, Mail, Lock, Sparkles, CheckCircle } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState("");

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Only redirect if user was already logged in when page loaded (not after auth mutations)
  React.useEffect(() => {
    if (user && !loginMutation.isPending && !registerMutation.isPending && !loginMutation.isSuccess && !registerMutation.isSuccess) {
      // User was already logged in when they accessed this page
      window.location.href = "/";
    }
  }, [user, loginMutation.isPending, registerMutation.isPending, loginMutation.isSuccess, registerMutation.isSuccess]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!isLogin) {
      if (!formData.firstName) {
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName) {
        newErrors.lastName = "Last name is required";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords don't match";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Clear any previous auth errors
    setAuthError("");

    try {
      if (isLogin) {
        await loginMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await registerMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      // Extract and format error message
      const rawErrorMessage = error.message || "Authentication failed. Please try again.";
      const cleanErrorMessage = formatErrorMessage(rawErrorMessage);
      setAuthError(cleanErrorMessage);
    }
  };

  const formatErrorMessage = (errorMessage: string) => {
    // Clean up common error patterns
    let cleanMessage = errorMessage
      .replace(/^\d+:\s*/, '') // Remove error codes like "401: "
      .replace(/[{}]/g, '') // Remove curly braces
      .replace(/^"message":"/, '') // Remove JSON structure
      .replace(/^"/, '').replace(/"$/, '') // Remove quotes
      .replace(/message":"/, '') // Remove remaining message structure
      .trim();

    // Add more user-friendly messaging
    if (cleanMessage.toLowerCase().includes('invalid email or password')) {
      return 'Invalid email or password, please try again.';
    }

    if (cleanMessage.toLowerCase().includes('user already exists') || cleanMessage.toLowerCase().includes('username already exists')) {
      return 'An account with this email already exists. Please try signing in instead.';
    }
    if (cleanMessage.toLowerCase().includes('authentication failed')) {
      return 'Authentication failed. Please check your credentials and try again.';
    }
    if (cleanMessage.toLowerCase().includes('registration failed')) {
      return 'Registration failed. Please check your information and try again.';
    }

    // Return cleaned message with fallback
    return cleanMessage || 'Something went wrong. Please try again.';
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    // Clear auth error when user starts typing
    if (authError) {
      setAuthError("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="min-h-screen flex">
        {/* Left Column - Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/25">
                <Home size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-[#1a1a1a] dark:text-white mb-3">
                Welcome to myRoommate
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {isLogin ? "Sign in to your account" : "Create your account"}
              </p>
            </div>

            {/* Error Message */}
            {authError && (
              <Card className="glass-card border-red-200 dark:border-red-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Authentication Error</h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {authError}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Card */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {isLogin ? "Sign In" : "Create Account"}
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {isLogin ? "Welcome back to myRoommate" : "Join the myRoommate community"}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      className={`input-modern h-12 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                      style={{
                        background: 'var(--surface)',
                        borderColor: errors.email ? '#ef4444' : 'var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px 20px',
                        fontSize: '16px',
                        color: 'var(--text-primary)',
                        transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)'
                      }}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  {/* Names (Register only) */}
                  {!isLogin && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          First Name *
                        </label>
                        <Input
                          type="text"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={(e) => updateFormData("firstName", e.target.value)}
                          className={`input-modern h-12 ${errors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
                          style={{
                            background: 'var(--surface)',
                            borderColor: errors.firstName ? '#ef4444' : 'var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px 20px',
                            fontSize: '16px',
                            color: 'var(--text-primary)',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)'
                          }}
                        />
                        {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Last Name *
                        </label>
                        <Input
                          type="text"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={(e) => updateFormData("lastName", e.target.value)}
                          className={`input-modern h-12 ${errors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
                          style={{
                            background: 'var(--surface)',
                            borderColor: errors.lastName ? '#ef4444' : 'var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px 20px',
                            fontSize: '16px',
                            color: 'var(--text-primary)',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)'
                          }}
                        />
                        {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Password *
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => updateFormData("password", e.target.value)}
                        className={`input-modern h-12 pr-12 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                        style={{
                          background: 'var(--surface)',
                          borderColor: errors.password ? '#ef4444' : 'var(--border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 48px 16px 20px',
                          fontSize: '16px',
                          color: 'var(--text-primary)',
                          transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:scale-105 transition-all duration-200 rounded-lg p-1"
                        style={{ 
                          color: 'var(--text-tertiary)',
                          background: 'transparent'
                        }}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>

                  {/* Confirm Password (Register only) */}
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                          className={`input-modern h-12 pr-12 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                          style={{
                            background: 'var(--surface)',
                            borderColor: errors.confirmPassword ? '#ef4444' : 'var(--border)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px 48px 16px 20px',
                            fontSize: '16px',
                            color: 'var(--text-primary)',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:scale-105 transition-all duration-200 rounded-lg p-1"
                          style={{ 
                            color: 'var(--text-tertiary)',
                            background: 'transparent'
                          }}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loginMutation.isPending || registerMutation.isPending}
                      className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                    >
                      {(loginMutation.isPending || registerMutation.isPending) ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span>Please wait...</span>
                        </div>
                      ) : isLogin ? (
                        "Sign In"
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </form>

                {/* Toggle Form */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrors({});
                      setFormData({
                        email: "",
                        password: "",
                        confirmPassword: "",
                        firstName: "",
                        lastName: "",
                      });
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    {isLogin ? (
                      <>Don't have an account? <span className="font-semibold text-emerald-500 hover:text-emerald-600">Sign up</span></>
                    ) : (
                      <>Already have an account? <span className="font-semibold text-emerald-500 hover:text-emerald-600">Sign in</span></>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Hero */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-50/80 to-cyan-50/80 dark:from-emerald-950/80 dark:to-cyan-950/80 backdrop-blur-lg items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/25">
              <Home className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-[#1a1a1a] dark:text-white">
              Your roommate journey starts here
            </h2>
            <p className="text-xl mb-8 text-gray-600 dark:text-gray-300 leading-relaxed">
              Manage chores, split expenses, coordinate schedules, and find the perfect roommate match.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100/70 dark:bg-emerald-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Smart expense splitting</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cyan-100/70 dark:bg-cyan-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Chore management system</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100/70 dark:bg-emerald-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Real-time messaging</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cyan-100/70 dark:bg-cyan-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Roommate marketplace</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Hero */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-50/80 to-cyan-50/80 dark:from-emerald-950/80 dark:to-cyan-950/80 backdrop-blur-lg items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/25">
              <Home className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-[#1a1a1a] dark:text-white">
              Your roommate journey starts here
            </h2>
            <p className="text-xl mb-8 text-gray-600 dark:text-gray-300 leading-relaxed">
              Manage chores, split expenses, coordinate schedules, and find the perfect roommate match.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100/70 dark:bg-emerald-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Smart expense splitting</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cyan-100/70 dark:bg-cyan-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Chore management system</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100/70 dark:bg-emerald-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Real-time messaging</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cyan-100/70 dark:bg-cyan-900/40 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Roommate marketplace</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}