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
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Check URL params for verification status and scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('verified') === 'true') {
      setVerificationMessage('Email verified successfully! You can now sign in.');
      setIsLogin(true); // Switch to login form
    } else if (urlParams.get('error') === 'invalid-token') {
      setVerificationMessage('Invalid verification link. Please sign up again or contact support.');
    } else if (urlParams.get('error') === 'verification-failed') {
      setVerificationMessage('Email verification failed. Please try again or contact support.');
    }
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
    } else if (!isLogin) {
      // Enhanced password validation for registration
      const hasUppercase = /[A-Z]/.test(formData.password);
      const hasLowercase = /[a-z]/.test(formData.password);
      const hasNumber = /\d/.test(formData.password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
      
      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
        newErrors.password = "Password must contain uppercase, lowercase, number, and special character";
      }
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

    try {
      if (isLogin) {
        loginMutation.mutate({
          email: formData.email,
          password: formData.password,
        });
      } else {
        registerMutation.mutate({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setErrors({ resetEmail: "Email is required" });
      return;
    }

    setResetLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const result = await response.json();
      setResetMessage(result.message);
      setResetEmail("");
    } catch (error) {
      console.error('Password reset error:', error);
      setErrors({ resetEmail: "Failed to send reset email. Please try again." });
    } finally {
      setResetLoading(false);
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

            {/* Form Card */}
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-slate-900/50">
              <CardContent className="p-8">
                {/* Verification Messages */}
                {verificationMessage && (
                  <div className={`p-4 rounded-xl mb-6 ${
                    verificationMessage.includes('successfully') 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      <CheckCircle className={`h-5 w-5 mr-2 ${
                        verificationMessage.includes('successfully') 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`} />
                      <p className={`text-sm ${
                        verificationMessage.includes('successfully') 
                          ? 'text-green-800' 
                          : 'text-red-800'
                      }`}>
                        {verificationMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Password Reset Form */}
                {showForgotPassword ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Reset Password
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Enter your email to receive a password reset link
                      </p>
                    </div>

                    {resetMessage && (
                      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                        <p className="text-sm text-blue-800">{resetMessage}</p>
                      </div>
                    )}

                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className={`pl-10 h-12 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-gray-200/50 dark:border-slate-600/50 ${errors.resetEmail ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {errors.resetEmail && <p className="text-red-500 text-sm mt-1">{errors.resetEmail}</p>}
                      </div>

                      <div className="space-y-3">
                        <Button
                          type="submit"
                          disabled={resetLoading}
                          className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
                        >
                          {resetLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowForgotPassword(false)}
                          className="w-full h-12 rounded-xl"
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Display - Moved to top */}
                    {(loginMutation.error || registerMutation.error) && (
                      <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-900/20 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50">
                        <p className="text-red-600 dark:text-red-400 text-sm">
                          {loginMutation.error?.message || registerMutation.error?.message}
                        </p>
                      </div>
                    )}

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => updateFormData("email", e.target.value)}
                          className={`pl-10 h-12 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-gray-200/50 dark:border-slate-600/50 ${errors.email ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    {/* Names (Register only) */}
                    {!isLogin && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            First Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              placeholder="John"
                              value={formData.firstName}
                              onChange={(e) => updateFormData("firstName", e.target.value)}
                              className={`pl-10 h-12 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-gray-200/50 dark:border-slate-600/50 ${errors.firstName ? 'border-red-500' : ''}`}
                            />
                          </div>
                          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Last Name
                          </label>
                          <Input
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={(e) => updateFormData("lastName", e.target.value)}
                            className={`h-12 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-gray-200/50 dark:border-slate-600/50 ${errors.lastName ? 'border-red-500' : ''}`}
                          />
                          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                        </div>
                      </div>
                    )}

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => updateFormData("password", e.target.value)}
                          className={`pl-10 pr-10 h-12 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-gray-200/50 dark:border-slate-600/50 ${errors.password ? 'border-red-500' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>

                    {/* Confirm Password (Register only) */}
                    {!isLogin && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                            className={`pl-10 pr-10 h-12 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border-gray-200/50 dark:border-slate-600/50 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loginMutation.isPending || registerMutation.isPending}
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]"
                    >
                      {(loginMutation.isPending || registerMutation.isPending) ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span>Please wait...</span>
                        </div>
                      ) : isLogin ? (
                        <div className="flex items-center space-x-2">
                          <Sparkles size={20} />
                          <span>Sign In</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CheckCircle size={20} />
                          <span>Create Account</span>
                        </div>
                      )}
                    </Button>



                    {/* Forgot Password Link - Only for login */}
                    {isLogin && (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                        >
                          Forgot your password?
                        </button>
                      </div>
                    )}
                  </form>
                )}

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