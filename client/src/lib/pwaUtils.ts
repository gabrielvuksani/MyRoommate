// PWA and native app detection utilities

/**
 * Detects if the app is running in PWA mode
 */
export function isPWA(): boolean {
  // Check if running in standalone mode (PWA installed)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check for iOS PWA
  if ((window.navigator as any).standalone) {
    return true;
  }
  
  // Check for Android TWA (Trusted Web Activity)
  if (document.referrer.includes('android-app://')) {
    return true;
  }
  
  // Check for various PWA indicators
  if (window.location.search.includes('utm_source=pwa')) {
    return true;
  }
  
  return false;
}

/**
 * Detects if the app is running in a native mobile context
 */
export function isMobileApp(): boolean {
  // Check for common mobile app user agents
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  // Check for Capacitor (if used)
  if (userAgent.includes('capacitor')) {
    return true;
  }
  
  // Check for Cordova/PhoneGap
  if (userAgent.includes('cordova') || userAgent.includes('phonegap')) {
    return true;
  }
  
  return false;
}

/**
 * Checks if the app should skip the landing page
 * Returns true for PWA or native app contexts
 */
export function shouldSkipLanding(): boolean {
  return isPWA() || isMobileApp();
}

/**
 * Gets the app context type for analytics or debugging
 */
export function getAppContext(): 'web' | 'pwa' | 'mobile' {
  if (isMobileApp()) return 'mobile';
  if (isPWA()) return 'pwa';
  return 'web';
}