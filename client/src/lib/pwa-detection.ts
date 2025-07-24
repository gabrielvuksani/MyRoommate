/**
 * PWA Detection and Environment Management
 * Unified system for detecting PWA vs web browser environments
 */

export interface PWAEnvironment {
  platform: 'iOS' | 'Android' | 'Desktop';
  isInstalled: boolean;
  displayMode: 'browser' | 'standalone' | 'standalone-ios' | 'twa' | 'fullscreen' | 'minimal-ui';
  canInstall: boolean;
  isIOSSafari: boolean;
  isAndroidChrome: boolean;
}

export class PWADetectionService {
  private static instance: PWADetectionService;
  private environment: PWAEnvironment | null = null;
  private installPrompt: BeforeInstallPromptEvent | null = null;

  private constructor() {
    this.detectEnvironment();
    this.setupInstallPromptListener();
  }

  static getInstance(): PWADetectionService {
    if (!PWADetectionService.instance) {
      PWADetectionService.instance = new PWADetectionService();
    }
    return PWADetectionService.instance;
  }

  private detectEnvironment(): void {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isIOSSafari = isIOS && /Safari/.test(userAgent) && !/CriOS|FxiOS|OPiOS/.test(userAgent);
    const isAndroidChrome = isAndroid && /Chrome/.test(userAgent);

    let environment: PWAEnvironment = {
      platform: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop',
      isInstalled: false,
      displayMode: 'browser',
      canInstall: false,
      isIOSSafari,
      isAndroidChrome
    };

    // Check for Trusted Web Activity (Android)
    if (document.referrer.startsWith('android-app://')) {
      environment.isInstalled = true;
      environment.displayMode = 'twa';
      environment.canInstall = false;
    }
    // Check for iOS standalone mode
    else if ((navigator as any).standalone) {
      environment.isInstalled = true;
      environment.displayMode = 'standalone-ios';
      environment.canInstall = false;
    }
    // Check for standard PWA display modes
    else {
      const displayModes = ['fullscreen', 'standalone', 'minimal-ui'];
      for (const mode of displayModes) {
        if (window.matchMedia(`(display-mode: ${mode})`).matches) {
          environment.isInstalled = true;
          environment.displayMode = mode as PWAEnvironment['displayMode'];
          environment.canInstall = false;
          break;
        }
      }
    }

    // Determine if app can be installed
    if (!environment.isInstalled) {
      environment.canInstall = isIOSSafari || isAndroidChrome || this.installPrompt !== null;
    }

    this.environment = environment;
  }

  private setupInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as BeforeInstallPromptEvent;
      if (this.environment) {
        this.environment.canInstall = true;
      }
    });

    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      this.detectEnvironment(); // Re-detect after installation
    });
  }

  getEnvironment(): PWAEnvironment {
    if (!this.environment) {
      this.detectEnvironment();
    }
    return this.environment!;
  }

  isPWA(): boolean {
    return this.getEnvironment().isInstalled;
  }

  canShowInstallPrompt(): boolean {
    return this.getEnvironment().canInstall && !this.getEnvironment().isInstalled;
  }

  async showInstallPrompt(): Promise<boolean> {
    if (this.installPrompt) {
      this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;
      return result.outcome === 'accepted';
    }
    return false;
  }

  // Get notification strategy based on environment
  getNotificationStrategy(): 'pwa' | 'web' | 'none' {
    const env = this.getEnvironment();
    
    if (env.isInstalled) {
      return 'pwa'; // Use push notifications for PWA
    }
    
    if (env.platform === 'desktop' || (env.platform === 'android' && env.isAndroidChrome)) {
      return 'web'; // Use web notifications for desktop and Android browsers
    }
    
    return 'none'; // Mobile browsers (especially iOS Safari) can't receive notifications
  }

  shouldShowInstallBanner(): boolean {
    const env = this.getEnvironment();
    return !env.isInstalled && env.canInstall && env.isIOSSafari;
  }
}

// Global instance
export const pwaDetection = PWADetectionService.getInstance();

// Type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}