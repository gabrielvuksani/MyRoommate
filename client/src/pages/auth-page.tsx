import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, Home, User, Mail, Lock, Phone, Calendar } from "lucide-react";

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
    phoneNumber: "",
    dateOfBirth: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

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
          phoneNumber: formData.phoneNumber || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
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

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Welcome to myRoommate
            </h1>
            <p className="text-lg mt-2" style={{ color: 'var(--text-secondary)' }}>
              {isLogin ? "Sign in to your account" : "Create your account"}
            </p>
          </div>

          {/* Form */}
          <Card className="glass-card">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      className={`pl-10 h-12 ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Names (Register only) */}
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                        <Input
                          placeholder="John"
                          value={formData.firstName}
                          onChange={(e) => updateFormData("firstName", e.target.value)}
                          className={`pl-10 h-12 ${errors.firstName ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Last Name
                      </label>
                      <Input
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => updateFormData("lastName", e.target.value)}
                        className={`h-12 ${errors.lastName ? 'border-red-500' : ''}`}
                      />
                      {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                    </div>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => updateFormData("password", e.target.value)}
                      className={`pl-10 pr-10 h-12 ${errors.password ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      style={{ color: 'var(--text-secondary)' }}
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
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                        className={`pl-10 pr-10 h-12 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                )}

                {/* Optional Fields (Register only) */}
                {!isLogin && (
                  <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Optional Information
                    </p>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={formData.phoneNumber}
                          onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Date of Birth
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                        <Input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loginMutation.isPending || registerMutation.isPending}
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-white border-0"
                >
                  {(loginMutation.isPending || registerMutation.isPending) ? (
                    "Please wait..."
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {/* Error Display */}
                {(loginMutation.error || registerMutation.error) && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      {loginMutation.error?.message || registerMutation.error?.message}
                    </p>
                  </div>
                )}
              </form>

              {/* Toggle Form */}
              <div className="mt-6 text-center">
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
                      phoneNumber: "",
                      dateOfBirth: "",
                    });
                  }}
                  className="text-sm hover:underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {isLogin ? (
                    <>Don't have an account? <span className="font-semibold text-emerald-500">Sign up</span></>
                  ) : (
                    <>Already have an account? <span className="font-semibold text-emerald-500">Sign in</span></>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column - Hero */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-32 h-32 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Home className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Your roommate journey starts here
          </h2>
          <p className="text-xl mb-8" style={{ color: 'var(--text-secondary)' }}>
            Manage chores, split expenses, coordinate schedules, and find the perfect roommate match.
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>Smart expense splitting</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>Chore management system</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>Real-time messaging</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>Roommate marketplace</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}