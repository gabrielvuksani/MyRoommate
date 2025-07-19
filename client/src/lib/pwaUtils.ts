/**
 * Utility functions for PWA detection and management
 */

/**
 * Detects if the app is currently running as a PWA (Progressive Web App)
 * Checks multiple indicators:
 * - Standalone display mode (Android/Desktop)
 * - iOS standalone mode
 * - Minimal UI display mode
 */
export function isPWA(): boolean {
  // Check if running in browser environment
  if (typeof window === 'undefined') {
    return false;
  }

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

  return false;
}

/**
 * Gets the appropriate initial route for non-authenticated users
 * Returns '/auth' for PWA mode, '/landing' for regular web
 */
export function getInitialRoute(): string {
  return isPWA() ? '/auth' : '/landing';
}