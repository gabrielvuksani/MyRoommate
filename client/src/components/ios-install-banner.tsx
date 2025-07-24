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
    const shouldShow = environment.platform === 'ios' && 
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
    <div className="fixed p-6 bottom-20 left-6 right-6 z-50 max-w mx-auto">
      <div 
        className="glass-card rounded-2xl animate-slide-up backdrop-blur-xl border shadow-lg "
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          padding: '20px'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
              <Download className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Install myRoommate
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
            style={{ 
              background: 'var(--surface-secondary)',
              color: 'var(--text-secondary)'
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          Add to your home screen for the best experience with push notifications and offline access.
        </p>

        {/* Installation Steps */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold">1</span>
            </div>
            <div className="flex items-center gap-1">
              <span style={{ color: 'var(--text-secondary)' }}>Tap</span>
              <Share className="w-3 h-3 text-blue-500" />
              <span style={{ color: 'var(--text-secondary)' }}>below</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold">2</span>
            </div>
            <div className="flex items-center gap-1">
              <span style={{ color: 'var(--text-secondary)' }}>Select "Add to Home Screen"</span>
              <Plus className="w-3 h-3 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleInstall}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            color: 'white'
          }}
        >
          Install App
        </button>
      </div>
    </div>
  );
}