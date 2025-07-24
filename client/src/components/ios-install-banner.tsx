/**
 * iOS Install Banner
 * Encourages iOS users to install the PWA to their home screen for better experience
 * Uses detection for iOS Safari and shows step-by-step installation instructions
 */

import { useState, useEffect } from 'react';
import { X, Share, Plus, Download } from 'lucide-react';
import { pwaDetection } from '@/lib/pwa-detection';

export function IOSInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const environment = pwaDetection.getEnvironment();
    
    // Show banner if:
    // 1. On iOS platform
    // 2. Not already installed as PWA
    // 3. Not previously dismissed (check localStorage)
    // 4. Using Safari (where installation is possible)
    const shouldShow = 
      environment.platform === 'ios' && 
      !environment.isInstalled && 
      !localStorage.getItem('ios-install-banner-dismissed') &&
      environment.canInstall;

    if (shouldShow) {
      // Delay showing banner by 2 seconds to not overwhelm user
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Remember dismissal for 30 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    localStorage.setItem('ios-install-banner-dismissed', expiryDate.toISOString());
  };

  const handleInstall = () => {
    // On iOS, we can't programmatically install, so we show instructions
    // The banner will stay visible to guide the user through the process
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto">
      <div 
        className="glass-card rounded-3xl p-5 animate-slide-up relative overflow-hidden dark:bg-opacity-90 dark:border-white/10"
        style={{
          background: 'var(--surface)',
          backdropFilter: 'blur(30px) saturate(2)',
          WebkitBackdropFilter: 'blur(30px) saturate(2)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5) inset, 0 1px 0 0 rgba(255, 255, 255, 0.8) inset',
        }}
      >
        {/* Gradient overlay for premium effect */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none dark:opacity-20"
          style={{
            background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
          }}
        />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-semibold text-base block" style={{ color: 'var(--text-primary)' }}>
                Install myRoommate
              </span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Add to Home Screen for best experience
              </span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative"
            style={{ 
              background: 'rgba(255, 255, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'var(--text-secondary)'
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Get the full app experience with instant notifications, offline access, and smooth performance.
        </p>

        {/* Installation Steps */}
        <div className="space-y-3 mb-5 p-4 rounded-2xl" style={{
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <span className="text-xs font-bold">1</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-primary)' }} className="text-sm">Tap the</span>
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <Share className="w-4 h-4 text-blue-500" />
              </div>
              <span style={{ color: 'var(--text-primary)' }} className="text-sm">Share button</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
              <span className="text-xs font-bold">2</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-primary)' }} className="text-sm">Select</span>
              <div className="px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                <Plus className="w-3 h-3 text-purple-500" />
                <span className="text-xs font-medium text-purple-500">Add to Home Screen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleInstall}
          className="w-full py-3.5 rounded-2xl font-semibold text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            color: 'white',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3), 0 1px 0 0 rgba(255, 255, 255, 0.5) inset'
          }}
        >
          <span className="relative z-10">Get Started</span>
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
               style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)' }} />
        </button>

        {/* Skip Option */}
        <button
          onClick={handleDismiss}
          className="w-full py-2 text-sm mt-3 transition-all hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}