import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Get token from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
    } else {
      setToken(tokenParam);
    }
  }, []);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>();
  const watchPassword = watch('newPassword');

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError('Invalid reset link');
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(result.message);
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      <div className="w-full max-w-md">
        <Card className="glass-card border-0">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 mb-4">
                <Home className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-primary mb-2">Reset Password</h1>
              <p className="text-secondary text-sm">Enter your new password below</p>
            </div>

            {/* Success State */}
            {isSuccess ? (
              <div className="space-y-6">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {message}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <Link href="/auth">
                    <Button className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium rounded-xl transition-all duration-200 hover:scale-[1.02]">
                      Sign In
                    </Button>
                  </Link>
                  
                  <Link href="/">
                    <Button variant="outline" className="w-full h-12 rounded-xl">
                      <Home className="h-4 w-4 mr-2" />
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Error Message */}
                {error && (
                  <Alert className="mb-6 bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Password Reset Form */}
                {token && !error && (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                          New Password
                        </label>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          className="h-12 rounded-xl"
                          {...register('newPassword', {
                            required: 'Password is required',
                            minLength: {
                              value: 6,
                              message: 'Password must be at least 6 characters'
                            }
                          })}
                        />
                        {errors.newPassword && (
                          <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                          Confirm Password
                        </label>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          className="h-12 rounded-xl"
                          {...register('confirmPassword', {
                            required: 'Please confirm your password',
                            validate: value => value === watchPassword || 'Passwords do not match'
                          })}
                        />
                        {errors.confirmPassword && (
                          <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </form>
                )}

                {/* Back to Sign In */}
                <div className="mt-6 text-center">
                  <Link href="/auth" className="inline-flex items-center text-secondary hover:text-primary transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Sign In
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}