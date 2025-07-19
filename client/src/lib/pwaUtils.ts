/**
 * Utility functions for PWA detection and management
 */

/**
 * Detects if the app is currently running as a PWA (Progressive Web App)
 * Checks multiple indicators:
 * - Standalone display mode (Android/Desktop)
 * - iOS standalone mode
 * - Minimal UI display mode
 * - Development environment safety checks
 */
export function isPWA(): boolean {
  // Check if running in browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  // Check URL parameters for PWA launch
  if (window.location?.search?.includes('pwa=true')) {
    return true;
  }

  // Add safety check for development environment
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    // In development, allow manual PWA testing via localStorage
    const forcePWA = localStorage.getItem('force-pwa-mode');
    if (forcePWA === 'true') {
      console.log('PWA mode forced via localStorage for development testing');
      return true;
    }
  }

  try {
    // Check for standalone display mode (most PWAs)
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }

    // Check for iOS standalone mode
    if ((window.navigator as any).standalone === true) {
      return true;
    }

    // Check for minimal-ui display mode
    if (window.matchMedia && window.matchMedia('(display-mode: minimal-ui)').matches) {
      return true;
    }

    // Check for fullscreen display mode
    if (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) {
      return true;
    }
  } catch (error) {
    // Fallback for environments where matchMedia is not available
    console.warn('PWA detection failed, falling back to regular web mode:', error);
    return false;
  }

  return false;
}

/**
 * Gets the appropriate initial route for non-authenticated users
 * Returns '/auth' for PWA mode, '/landing' for regular web
 */
export function getInitialRoute(): string {
  return isPWA() ? '/auth' : '/landing';
}

/**
 * Debug utility to test PWA mode in development
 * Call this from browser console: window.testPWAMode(true/false)
 */
export function setupPWADebugTools() {
  if (typeof window !== 'undefined' && (window as any).location?.hostname === 'localhost' || (window as any).location?.hostname?.includes('.replit.')) {
    (window as any).testPWAMode = (enable: boolean) => {
      if (enable) {
        localStorage.setItem('force-pwa-mode', 'true');
        console.log('PWA mode enabled for testing. Reload the page to see changes.');
      } else {
        localStorage.removeItem('force-pwa-mode');
        console.log('PWA mode disabled. Reload the page to see changes.');
      }
    };
    
    (window as any).checkPWAStatus = () => {
      const pwaStatus = isPWA();
      const forcedMode = localStorage.getItem('force-pwa-mode') === 'true';
      console.log('PWA Status:', {
        isPWA: pwaStatus,
        forcedMode,
        initialRoute: getInitialRoute(),
        displayMode: window.matchMedia ? {
          standalone: window.matchMedia('(display-mode: standalone)').matches,
          minimalUi: window.matchMedia('(display-mode: minimal-ui)').matches,
          fullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
        } : 'matchMedia not available',
        iosStandalone: (window.navigator as any).standalone
      });
    };
    
    console.log('PWA Debug Tools loaded. Use window.testPWAMode(true/false) or window.checkPWAStatus()');
  }
}