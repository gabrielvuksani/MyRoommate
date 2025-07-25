import React, { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/ThemeProvider";
import { useLocation } from "wouter";
import BackButton from "@/components/back-button";
import { unifiedNotifications } from "@/lib/unified-notifications";

// Import modular components
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { HouseholdSection } from "@/components/profile/HouseholdSection";
import { AccountDetails } from "@/components/profile/AccountDetails";
import { NotificationSettings } from "@/components/profile/NotificationSettings";
import { DeveloperTools } from "@/components/profile/DeveloperTools";

// Import types
import type { User, Household, NotificationInfo, NotificationSettings as NotificationSettingsType } from "@/types/profile";

// Lazy load heavy components for better performance
const AuthPage = React.lazy(() => import("./auth-page"));

export default function Profile() {
  const { user } = useAuth();
  const { theme, effectiveTheme, setTheme } = useTheme();
  const [, setLocation] = useLocation();

  // State management with proper types
  const [headerScrolled, setHeaderScrolled] = React.useState(false);
  const [notificationInfo, setNotificationInfo] = React.useState<NotificationInfo | null>(null);
  const [notificationSettings, setNotificationSettings] = React.useState<NotificationSettingsType | null>(null);
  const [isTestingNotification, setIsTestingNotification] = React.useState(false);
  const [canShowNotifications, setCanShowNotifications] = React.useState(false);

  // Fetch household data with proper error handling
  const { data: household, error: householdError } = useQuery<Household>({
    queryKey: ["/api/households/current"],
    enabled: !!user,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Memoized admin check for performance
  const isAdmin = useMemo(() => {
    if (!household?.members || !user?.id) return false;
    return household.members.find(
      (member) => member.userId === user.id
    )?.role === 'admin';
  }, [household?.members, user?.id]);

  // Notification capability check with debouncing
  const checkNotificationCapability = useCallback(() => {
    const info = unifiedNotifications.getEnvironmentInfo();
    const settings = unifiedNotifications.getSettings();
    
    const canShow = info.strategy !== 'none' || 
                   ('Notification' in window && Notification.permission !== 'denied');
    
    setNotificationInfo(info);
    setNotificationSettings(settings);
    setCanShowNotifications(canShow);
    
    return canShow;
  }, []);

  // Setup event listeners with cleanup
  useEffect(() => {
    window.scrollTo(0, 0);

    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };

    // Debounced scroll handler
    let scrollTimeout: NodeJS.Timeout;
    const debouncedHandleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 16); // ~60fps
    };

    window.addEventListener("scroll", debouncedHandleScroll, { passive: true });
    
    checkNotificationCapability();
    
    // Permission monitoring with error handling
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then(permissionStatus => {
          permissionStatus.onchange = () => {
            checkNotificationCapability();
          };
        })
        .catch(() => {
          // Fallback for browsers without permission query support
        });
    }
    
    const handleFocus = () => {
      checkNotificationCapability();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener("scroll", debouncedHandleScroll);
      window.removeEventListener('focus', handleFocus);
      clearTimeout(scrollTimeout);
    };
  }, [checkNotificationCapability]);

  // Test notification handler with proper error handling
  const handleTestNotification = useCallback(async () => {
    const info = unifiedNotifications.getEnvironmentInfo();
    
    if (info.requiresInstall) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('To receive notifications on iOS:\n\n1. Tap the Share button (box with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right\n4. Open the app from your home screen');
      } else {
        alert('To receive notifications on Android:\n\n1. Tap the menu button (three dots)\n2. Tap "Add to Home screen"\n3. Follow the prompts\n4. Open the app from your home screen');
      }
      return;
    }
    
    if (info.permission === 'denied') {
      alert('Notifications are blocked. To enable them:\n\n1. Click the lock icon in your address bar\n2. Select "Allow" for notifications\n3. Refresh the page and try again');
      return;
    }
    
    setIsTestingNotification(true);
    try {
      let success = false;
      
      if (info.canRequest) {
        success = await unifiedNotifications.requestPermission();
        if (!success) {
          alert('Notification permission was denied. Please enable notifications in your browser settings.');
          checkNotificationCapability();
          return;
        }
      }
      
      if (info.permission === 'granted' || success) {
        const testSuccess = await unifiedNotifications.testNotification();
        if (testSuccess) {
          if (info.supportLevel === 'full') {
            alert('Success! You will receive notifications even when the app is closed.');
          } else if (info.supportLevel === 'partial') {
            alert('Success! You will receive notifications while the browser is open.');
          }
        }
      }
      
      checkNotificationCapability();
    } catch (error) {
      console.error('Test notification failed:', error);
      alert('Failed to send test notification. Please check your browser settings.');
    } finally {
      setIsTestingNotification(false);
    }
  }, [checkNotificationCapability]);

  // Notification toggle handler
  const handleNotificationToggle = useCallback(async (type: string, enabled: boolean) => {
    if (type === 'enabled' && enabled && notificationInfo?.permission === 'default') {
      const granted = await unifiedNotifications.requestPermission();
      if (!granted) {
        return;
      }
      checkNotificationCapability();
    }
    
    if (type === 'enabled') {
      unifiedNotifications.updateSettings({ enabled });
    } else {
      unifiedNotifications.updateTypeSettings(type as any, enabled);
    }
    setNotificationSettings(unifiedNotifications.getSettings());
  }, [notificationInfo?.permission, checkNotificationCapability]);

  // Show loading state while checking auth
  if (!user) {
    return (
      <div className="page-container page-transition">
        <div className="floating-header">
          <div className="page-header">
            <h1 className="page-title">Profile & Settings</h1>
            <p className="page-subtitle">Not logged in</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-transition">
      <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
        <div className="page-header">
          <div className="flex items-center space-x-4">
            <BackButton to="/" />
            <div>
              <h1 className="page-title">Settings</h1>
              <p className="page-subtitle">
                Manage account & app settings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="content-with-header-compact px-6 space-y-6">
        {/* Profile Header */}
        <ProfileHeader user={user as User} />

        {/* Theme Selector */}
        <ThemeSelector 
          theme={theme}
          effectiveTheme={effectiveTheme}
          setTheme={setTheme}
        />

        {/* Account Details */}
        <AccountDetails user={user as User} />

        {/* Notification Settings */}
        <NotificationSettings
          canShowNotifications={canShowNotifications}
          notificationInfo={notificationInfo}
          notificationSettings={notificationSettings}
          isTestingNotification={isTestingNotification}
          onToggle={handleNotificationToggle}
          onTest={handleTestNotification}
        />

        {/* Household Section */}
        {household && (
          <HouseholdSection 
            household={household}
            isAdmin={isAdmin}
          />
        )}

        {/* Developer Tools */}
        <DeveloperTools
          notificationInfo={notificationInfo}
          notificationSettings={notificationSettings}
          isTestingNotification={isTestingNotification}
          onTestNotification={handleTestNotification}
        />
      </div>
    </div>
  );
}