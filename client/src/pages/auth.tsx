import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, Shield, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    setIsLoading(true);
    setError("");
    
    // Inject CSS to hide any Replit branding during login
    const hideReplitCSS = document.createElement('style');
    hideReplitCSS.id = 'hide-replit-branding';
    hideReplitCSS.textContent = `
      /* Hide any Replit banners or branding */
      [src*="replit.com/public/js"], 
      [src*="replit-dev-banner"],
      .replit-banner,
      .replit-dev-banner,
      iframe[src*="replit"],
      div[class*="replit"],
      div[id*="replit"],
      .auth0-lock,
      .auth0-lock-container,
      [class*="auth0"],
      [id*="auth0"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        position: absolute !important;
        left: -9999px !important;
        width: 0 !important;
        height: 0 !important;
      }
      
      /* Hide any "Secured by" or provider branding */
      *:contains("Replit"), 
      *:contains("secured by"),
      *:contains("Powered by") {
        display: none !important;
      }
    `;
    document.head.appendChild(hideReplitCSS);
    
    // Create premium loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          text-align: center;
          padding: 3rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          max-width: 400px;
          animation: slideIn 0.6s ease-out;
        ">
          <h1 style="
            font-size: 2rem;
            margin-bottom: 1rem;
            font-weight: 600;
            background: linear-gradient(45deg, #fff, #e0e7ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          ">Connecting to myRoommate</h1>
          <p style="opacity: 0.9; font-size: 1.1rem; margin-bottom: 2rem;">
            Securing your connection and setting up your account...
          </p>
          <div style="
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          "></div>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        body { overflow: hidden !important; }
      </style>
    `;
    document.body.appendChild(overlay);
    
    // Redirect to login after overlay is shown
    setTimeout(() => {
      window.location.href = '/api/login';
    }, 800);
  };

  // Handle authentication states
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('success') === 'true') {
      // Remove any overlays and redirect immediately
      const overlay = document.getElementById('auth-overlay');
      if (overlay) overlay.remove();
      
      // Show success briefly then redirect
      document.body.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">✓</div>
            <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">Welcome to myRoommate!</h1>
            <p style="opacity: 0.9;">Taking you to your dashboard...</p>
          </div>
        </div>
      `;
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      return;
    }
    
    if (urlParams.get('error') === 'true') {
      setError("Authentication failed. Please try again.");
      setIsLoading(false);
      // Clean up any overlays
      const overlay = document.getElementById('auth-overlay');
      if (overlay) overlay.remove();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Hero Section */}
        <div className="text-center lg:text-left space-y-6">
          <div className="flex items-center justify-center lg:justify-start space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center">
              <Home className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              myRoommate
            </h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Simplify your
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                shared living
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Manage expenses, coordinate chores, and connect with the perfect roommates – all in one beautifully designed app.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Secure & Private</span>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Real-time Sync</span>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur">
              <Zap className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Smart Features</span>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="glass-card border-0 shadow-2xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Welcome back
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to your myRoommate account
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-70 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                "Continue with myRoommate"
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                New to myRoommate?{" "}
                <button 
                  onClick={handleLogin}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Create your account
                </button>
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                By continuing, you agree to our Terms of Service and Privacy Policy. 
                Your data is encrypted and secure.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}