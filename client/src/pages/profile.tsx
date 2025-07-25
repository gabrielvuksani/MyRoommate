import { useQuery, useMutation } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Edit3, Copy, UserMinus, RefreshCw, Moon, Sun, Check, Bell, Trash2, Smartphone, Monitor, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { getProfileInitials } from "@/lib/nameUtils";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useTheme } from "@/lib/ThemeProvider";
import BackButton from "../components/back-button";
import { PersistentLoading } from "@/lib/persistentLoading";
import { unifiedNotifications } from "@/lib/unified-notifications";
import { pwaDetection } from "@/lib/pwa-detection";

import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Profile() {
  const { user } = useAuth();
  const { theme, effectiveTheme, setTheme } = useTheme();

  const [, setLocation] = useLocation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState({ firstName: "", lastName: "" });
  const [isHouseholdEditOpen, setIsHouseholdEditOpen] = useState(false);
  const [editHouseholdName, setEditHouseholdName] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);


  const [isCopied, setIsCopied] = useState(false);
  const [notificationInfo, setNotificationInfo] = useState<any>(null);
  const [notificationSettings, setNotificationSettings] = useState<any>(null);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [canShowNotifications, setCanShowNotifications] = useState(false);

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  // Check if current user is admin
  const isAdmin = (household as any)?.members?.find(
    (member: any) => member.userId === user?.id
  )?.role === 'admin';

  // Function to check if notifications can be shown
  const checkNotificationCapability = () => {
    const info = unifiedNotifications.getEnvironmentInfo();
    const settings = unifiedNotifications.getSettings();
    
    // Notifications can be shown if:
    // 1. We have a valid strategy (not 'none')
    // 2. Browser supports notifications
    // 3. User hasn't permanently blocked notifications in all contexts
    const canShow = info.strategy !== 'none' || 
                   ('Notification' in window && Notification.permission !== 'denied');
    
    setNotificationInfo(info);
    setNotificationSettings(settings);
    setCanShowNotifications(canShow);
    
    return canShow;
  };

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);

    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    
    // Check notification capability
    checkNotificationCapability();
    
    // Listen for permission changes
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then(permissionStatus => {
          permissionStatus.onchange = () => {
            checkNotificationCapability();
          };
        })
        .catch(() => {
          // Fallback for browsers that don't support permission query
        });
    }
    
    // Check for focus changes to update notification status
    const handleFocus = () => {
      checkNotificationCapability();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const updateNameMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      return await apiRequest("PATCH", "/api/auth/user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditOpen(false);
    },
    onError: (error: any) => {
      console.error("Failed to update name:", error);
    },
  });

  const updateHouseholdNameMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("PATCH", "/api/households/current", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households/current"] });
      setIsHouseholdEditOpen(false);
    },
    onError: (error: any) => {
      console.error("Failed to update household name:", error);
    },
  });

  const leaveHouseholdMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest("POST", "/api/households/leave", {});
      return result;
    },
    onSuccess: () => {
      // Don't modify loading state here - button handler controls entire sequence
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      console.error("Failed to leave household:", error);
      // Don't modify loading state here - button handler will handle it
    },
  });

  const deleteAllDataMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest("DELETE", "/api/dev/delete-all-data", {});
      return result;
    },
    onSuccess: () => {
      queryClient.clear();
    },
    onError: (error: any) => {
      console.error("Failed to delete all data:", error);
    },
  });

  const kickMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await apiRequest("DELETE", `/api/households/members/${userId}`, {});
      return result;
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/households/current"] });
      // Update the invite code if a new one was generated
      if (data.newInviteCode) {
        queryClient.setQueryData(["/api/households/current"], (old: any) => {
          if (old) {
            return { ...old, inviteCode: data.newInviteCode };
          }
          return old;
        });
      }
    },
    onError: (error: any) => {
      console.error("Failed to remove member:", error);
      alert("Failed to remove member from household");
    },
  });

  const handleUpdateName = () => {
    if (!editName.firstName.trim()) return;
    updateNameMutation.mutate(editName);
  };

  const handleUpdateHouseholdName = () => {
    if (!editHouseholdName.trim()) return;
    updateHouseholdNameMutation.mutate(editHouseholdName);
  };

  const logout = () => {
    // Show persistent loading overlay
    PersistentLoading.show("Signing out...");
    window.location.href = "/api/logout";
  };

  const copyInviteCode = async () => {
    if ((household as any)?.inviteCode) {
      try {
        await navigator.clipboard.writeText((household as any).inviteCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy invite code:', err);
      }
    }
  };

  const handleRefresh = async () => {
    try {
      // Show loading state
      PersistentLoading.show("Refreshing app data...");
      
      // Clear React Query cache only - preserve authentication
      await queryClient.clear();
      
      // Selectively clear localStorage while preserving critical data
      const keysToPreserve = ['theme', 'auth-cache', 'user-settings'];
      const preservedData: Record<string, string> = {};
      
      // Save critical data
      keysToPreserve.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) preservedData[key] = value;
      });
      
      // Clear and restore
      localStorage.clear();
      Object.entries(preservedData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      
      // Clear only myRoommate-specific service worker caches
      if ('serviceWorker' in navigator && 'caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames
              .filter(name => name.includes('myroommate'))
              .map(cacheName => caches.delete(cacheName))
          );
        } catch (e) {
          console.log('Cache clearing failed:', e);
        }
      }
      
      // Refresh push subscription if needed
      if (unifiedNotifications.getEnvironmentInfo().permission === 'granted') {
        // Re-initialize notifications to refresh subscription
        await unifiedNotifications.requestPermission();
      }
      
      // Smooth navigation without aggressive reload
      setTimeout(() => {
        PersistentLoading.hide();
        
        // Invalidate all queries to refetch fresh data
        queryClient.invalidateQueries();
        
        // Only reload if not on home page
        if (window.location.pathname !== '/') {
          window.location.replace('/');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Refresh error:', error);
      PersistentLoading.hide();
      // Fallback: just invalidate queries
      queryClient.invalidateQueries();
    }
  };

  const handleDeleteAllData = async () => {
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to delete all household data? This action cannot be undone and will remove all chores, expenses, messages, calendar events, and household members. Your roommate listings will be preserved.')) {
      return;
    }

    try {
      // Show loading state
      PersistentLoading.show("Deleting all data...");
      
      await deleteAllDataMutation.mutateAsync();
      
      // Navigate to home after successful deletion
      setTimeout(() => {
        PersistentLoading.hide();
        window.location.replace('/');
      }, 1000);
      
    } catch (error) {
      console.error('Delete all data error:', error);
      // Hide loading on error
      PersistentLoading.hide();
      alert('Failed to delete all data. Please try again.');
    }
  };

  const handleTestNotification = async () => {
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
      
      // Request permission if needed
      if (info.canRequest) {
        success = await unifiedNotifications.requestPermission();
        if (!success) {
          alert('Notification permission was denied. Please enable notifications in your browser settings.');
          checkNotificationCapability(); // Re-check after denial
          return;
        }
      }
      
      // Send test notification based on support level
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
      
      // Re-check capability after permission change
      checkNotificationCapability();
      
    } catch (error) {
      console.error('Test notification failed:', error);
      alert('Failed to send test notification. Please check your browser settings.');
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleNotificationToggle = async (type: string, enabled: boolean) => {
    // If enabling master toggle and no permission yet, request it
    if (type === 'enabled' && enabled && notificationInfo?.permission === 'default') {
      const granted = await unifiedNotifications.requestPermission();
      if (!granted) {
        // Permission denied, don't enable
        return;
      }
      // Re-check capability after permission change
      checkNotificationCapability();
    }
    
    if (type === 'enabled') {
      unifiedNotifications.updateSettings({ enabled });
    } else {
      unifiedNotifications.updateTypeSettings(type as any, enabled);
    }
    setNotificationSettings(unifiedNotifications.getSettings());
  };

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
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <ProfileAvatar 
                  user={user as any} 
                  size="xl" 
                  editable={true} 
                  gradientType="emerald"
                  className="rounded-3xl"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {(user as any).firstName && (user as any).lastName
                      ? `${(user as any).firstName} ${(user as any).lastName}`
                      : (user as any).firstName ||
                        (user as any).email?.split("@")[0] ||
                        "Unknown User"}
                  </h2>
                  <p className="truncate" style={{ color: 'var(--text-secondary)' }} title={(user as any).email}>
                    {(user as any).email}
                  </p>
                </div>
              </div>

              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditName({
                        firstName: (user as any).firstName || "",
                        lastName: (user as any).lastName || "",
                      });
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all p-0 flex-shrink-0"
                    style={{
                      background: 'var(--surface-secondary)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Edit3 size={16} />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader className="px-6 pt-6 pb-6">
                    <DialogTitle className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      Edit Name
                    </DialogTitle>
                  </DialogHeader>
                  <div className="px-6 pb-6 space-y-4">
                    <Input
                      placeholder="First name"
                      value={editName.firstName}
                      onChange={(e) =>
                        setEditName({ ...editName, firstName: e.target.value })
                      }
                      className="w-full p-4 rounded-xl"
                      style={{
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <Input
                      placeholder="Last name"
                      value={editName.lastName}
                      onChange={(e) =>
                        setEditName({ ...editName, lastName: e.target.value })
                      }
                      className="w-full p-4 rounded-xl"
                      style={{
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <Button
                      onClick={handleUpdateName}
                      disabled={
                        !editName.firstName.trim() ||
                        updateNameMutation.isPending
                      }
                      className="w-full bg-primary text-white py-3 rounded-xl font-semibold"
                    >
                      {updateNameMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Theme Picker */}
            <div className="pt-6 mt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <h4 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
                Appearance
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => setTheme("auto")}
                  className={`h-20 rounded-2xl font-medium flex flex-col items-center justify-center space-y-2 transition-all border-2 ${
                    theme === 'auto' ? 'border-blue-500 shadow-lg' : 'border-transparent'
                  }`}
                  style={{
                    background: theme === 'auto' ? 'var(--primary)' : 'var(--surface-secondary)',
                    color: theme === 'auto' ? '#ffffff' : 'var(--text-primary)'
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-orange-400 to-blue-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-slate-800 rounded-full" style={{ 
                      clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)' 
                    }}></div>
                  </div>
                  <span className="text-xs font-semibold">Auto</span>
                </Button>
                <Button
                  onClick={() => setTheme("light")}
                  className={`h-20 rounded-2xl font-medium flex flex-col items-center justify-center space-y-2 transition-all border-2 ${
                    theme === 'light' ? 'border-blue-500 shadow-lg' : 'border-transparent'
                  }`}
                  style={{
                    background: theme === 'light' ? 'var(--primary)' : 'var(--surface-secondary)',
                    color: theme === 'light' ? '#ffffff' : 'var(--text-primary)'
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-sm">
                    <Sun size={16} className="text-white drop-shadow-sm" />
                  </div>
                  <span className="text-xs font-semibold">Light</span>
                </Button>
                <Button
                  onClick={() => setTheme("dark")}
                  className={`h-20 rounded-2xl font-medium flex flex-col items-center justify-center space-y-2 transition-all border-2 ${
                    theme === 'dark' ? 'border-blue-500 shadow-lg' : 'border-transparent'
                  }`}
                  style={{
                    background: theme === 'dark' ? 'var(--primary)' : 'var(--surface-secondary)',
                    color: theme === 'dark' ? '#ffffff' : 'var(--text-primary)'
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-sm">
                    <Moon size={16} className="text-slate-300 drop-shadow-sm" />
                  </div>
                  <span className="text-xs font-semibold">Dark</span>
                </Button>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
                {theme === 'auto' 
                  ? `Following system (currently ${effectiveTheme || 'light'})`
                  : `Using ${theme} mode`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        {user && (
          <Card 
            className="glass-card" 
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)'
            }}
          >
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Account details
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>User ID</span>
                  <span
                    className="font-mono text-sm truncate ml-4"
                    style={{ color: 'var(--text-primary)' }}
                    title={String((user as any).id || '')}
                  >
                    {String((user as any).id || 'N/A')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span style={{ color: 'var(--text-secondary)' }}>Member since</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {(user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification Settings - Only show if notifications can be served */}
        {canShowNotifications && (
          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Notifications
              </h3>
              <Bell className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </div>

            {/* Environment Info */}
            {notificationInfo && (
              <div className="mb-6 p-4 rounded-xl" style={{ 
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border)'
              }}>
                <div className="flex items-center gap-2 mb-2">
                  {notificationInfo.supportLevel === 'full' && <Smartphone className="w-4 h-4 text-green-600" />}
                  {notificationInfo.supportLevel === 'partial' && <Monitor className="w-4 h-4 text-blue-600" />}
                  {notificationInfo.supportLevel === 'none' && <AlertTriangle className="w-4 h-4 text-orange-600" />}

                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {notificationInfo.supportLevel === 'full' && 'Full Support - Push Notifications'}
                    {notificationInfo.supportLevel === 'partial' && 'Partial Support - Browser Notifications'}
                    {notificationInfo.supportLevel === 'none' && (
                      notificationInfo.requiresInstall ? 'Installation Required' : 'Limited Support'
                    )}
                  </span>
                </div>

                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {notificationInfo.supportLevel === 'full' && 'You can receive notifications even when the app is closed.'}
                  {notificationInfo.supportLevel === 'partial' && 'You can receive notifications while using the browser.'}
                  {notificationInfo.supportLevel === 'none' && (
                    notificationInfo.requiresInstall 
                      ? 'Install the app to your home screen to enable push notifications.'
                      : notificationInfo.permission === 'denied' 
                        ? 'Notifications are blocked in your browser settings.'
                        : 'Click "Enable Notifications" below to get started.'
                  )}
                </p>

                {/* Install prompt for mobile users */}
                {notificationInfo.requiresInstall && (
                  <button 
                    className="mt-3 text-xs text-blue-600 underline hover:text-blue-700"
                    onClick={() => {
                      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                      if (isIOS) {
                        alert('To install on iOS:\n\n1. Tap the Share button (box with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right');
                      } else {
                        alert('To install on Android:\n\n1. Tap the menu button (three dots)\n2. Tap "Add to Home screen"\n3. Follow the prompts');
                      }
                    }}
                  >
                    How to install the app
                  </button>
                )}
              </div>
            )}

            {/* Master Toggle */}
            {notificationSettings && (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        Enable Notifications
                      </span>
                      {notificationInfo.permission === 'granted' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Allowed
                        </span>
                      )}
                      {notificationInfo.permission === 'denied' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Blocked
                        </span>
                      )}
                      {notificationInfo.permission === 'default' && notificationSettings.enabled && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Permission needed
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {notificationInfo.permission === 'denied' 
                        ? 'Enable in browser settings to continue'
                        : 'Master control for all notification types'}
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.enabled && notificationInfo?.permission === 'granted'}
                    onCheckedChange={(checked) => handleNotificationToggle('enabled', checked)}
                    disabled={notificationInfo?.permission === 'denied' || notificationInfo?.requiresInstall}
                  />
                </div>

                {/* Individual Type Controls - Only show when notifications are enabled and allowed */}
                {notificationSettings.enabled && notificationInfo?.permission === 'granted' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Messages
                        </span>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          New messages from roommates
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.types.message}
                        onCheckedChange={(checked) => handleNotificationToggle('message', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Chores
                        </span>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Chore assignments and completions
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.types.chore}
                        onCheckedChange={(checked) => handleNotificationToggle('chore', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Expenses
                        </span>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          New expenses and bill splits
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.types.expense}
                        onCheckedChange={(checked) => handleNotificationToggle('expense', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Calendar
                        </span>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          New events and reminders
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.types.calendar}
                        onCheckedChange={(checked) => handleNotificationToggle('calendar', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Household
                        </span>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Important household updates
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.types.household}
                        onCheckedChange={(checked) => handleNotificationToggle('household', checked)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Household Information */}
        {household && (
          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Household Information
              </h3>
              <div style={{padding: '0px 0 0px 0'}}>
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>Name</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className="font-semibold truncate"
                      style={{ color: 'var(--text-primary)' }}
                      title={(household as any).name}
                    >
                      {(household as any).name}
                    </span>
                    <Dialog open={isHouseholdEditOpen} onOpenChange={setIsHouseholdEditOpen}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setEditHouseholdName((household as any)?.name || "");
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-all p-0 flex-shrink-0"
                          style={{
                            background: 'var(--surface-secondary)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <Edit3 size={16} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader className="px-6 pt-6 pb-6">
                          <DialogTitle className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            Edit Household Name
                          </DialogTitle>
                        </DialogHeader>
                        <div className="px-6 pb-6 space-y-4">
                          <Input
                            placeholder="Household name"
                            value={editHouseholdName}
                            onChange={(e) => setEditHouseholdName(e.target.value)}
                            className="w-full p-4 rounded-xl"
                            style={{
                              background: 'var(--surface-secondary)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-primary)'
                            }}
                          />
                          <Button
                            onClick={() => handleUpdateHouseholdName()}
                            disabled={updateHouseholdNameMutation.isPending}
                            className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
                            style={{
                              background: updateHouseholdNameMutation.isPending
                                ? 'var(--surface-secondary)'
                                : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                              color: updateHouseholdNameMutation.isPending
                                ? 'var(--text-secondary)'
                                : '#ffffff'
                            }}
                          >
                            {updateHouseholdNameMutation.isPending
                              ? "Saving..."
                              : "Save Changes"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 pt-4 pb-4">
                  <span style={{ color: 'var(--text-secondary)' }}>Invite Code</span>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm px-2 py-1 rounded" style={{
                      color: 'var(--text-primary)',
                      background: 'var(--surface-secondary)'
                    }}>
                      {(household as any).inviteCode}
                    </span>
                    <button
                      onClick={copyInviteCode}
                      className="p-2 rounded-lg btn-animated transition-all duration-300 relative"
                      style={{
                        background: 'var(--surface-secondary)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <div className={`transition-all duration-300 ease-in-out ${isCopied ? 'scale-0 opacity-0 rotate-90' : 'scale-100 opacity-100 rotate-0'}`}>
                        <Copy size={14} />
                      </div>
                      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${isCopied ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-90'}`}>
                        <Check size={14} style={{ color: '#10b981' }} />
                      </div>
                    </button>
                  </div>
                </div>
                {(household as any).rentAmount && (
                  <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Monthly Rent</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      ${(household as any).rentAmount}
                    </span>
                  </div>
                )}
                {(household as any).rentDueDay && (
                  <div className="flex justify-between items-center py-3">
                    <span style={{ color: 'var(--text-secondary)' }}>Rent Due Day</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {(household as any).rentDueDay}
                    </span>
                  </div>
                )}
              </div>
              {(household as any)?.members && (household as any).members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3 last:border-b-0"
                  style={{ borderBottom: '1px solid var(--border)',
                         borderTop: '1px solid var(--border)'}}>
                  <div className="flex items-center space-x-3">
                    <ProfileAvatar 
                      user={member.user} 
                      size="md" 
                      gradientType="blue"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {member.user.firstName && member.user.lastName
                          ? `${member.user.firstName} ${member.user.lastName}`
                          : member.user.firstName ||
                            member.user.email?.split("@")[0] ||
                            "Unknown"}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {member.role === "admin" ? "Administrator" : "Member"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isAdmin && member.userId !== user?.id && (
                      <Button
                        onClick={async () => {
                          if (confirm(`Are you sure you want to remove ${member.user.firstName || member.user.email?.split('@')[0]} from the household?`)) {
                            await kickMemberMutation.mutateAsync(member.userId);
                          }
                        }}
                        className="w-9 h-9 p-0 rounded-xl transition-all hover:scale-[1.1] hover:shadow-lg flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)'
                        }}
                      >
                        <UserMinus size={16} style={{ color: '#DC2626' }} />
                      </Button>
                    )}
                    {member.role && (
                      <span className="text-sm capitalize px-2 py-1 rounded flex-shrink-0" style={{
                        color: 'var(--text-secondary)',
                        background: 'var(--surface-secondary)'
                      }}>
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div className="space-y-3 pt-3">
                {(household as any) && (
                  <Button
                    onClick={async () => {
                      // Show persistent loading overlay
                      PersistentLoading.show("Leaving household...");
  
                      try {
                        await leaveHouseholdMutation.mutateAsync();
  
                        // Navigate immediately - loading will persist through refresh
                        setTimeout(() => {
                          window.location.href = '/';
                        }, 500);
                      } catch (error) {
                        console.error("Failed to leave household:", error);
                        setTimeout(() => {
                          window.location.href = '/';
                        }, 500);
                      }
                    }}
                    disabled={leaveHouseholdMutation.isPending}
                    className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-orange-700 disabled:opacity-50"
                  >
                    <UserMinus size={20} />
                    <span>
                      {leaveHouseholdMutation.isPending
                        ? "Leaving..."
                        : "Leave Household"}
                    </span>
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    onClick={handleDeleteAllData}
                    disabled={deleteAllDataMutation.isPending}
                    className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={20} />
                    <span>
                      {deleteAllDataMutation.isPending
                        ? "Deleting All Household Data..."
                        : "Delete All Household Data"}
                    </span>
                  </Button>
                )}
                <Button
                  onClick={logout}
                  className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-red-700"
                >
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Developer Tools */}
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Developer Tools
            </h3>
            <div className="space-y-3">
              <Button
                onClick={handleRefresh}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-blue-700"
              >
                <RefreshCw size={20} />
                <span>Refresh App & Data</span>
              </Button>
              <Button
                onClick={handleTestNotification}
                disabled={isTestingNotification || (!notificationSettings?.enabled && !notificationInfo?.requiresInstall)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bell size={20} className={isTestingNotification ? "animate-pulse" : ""} />
                <span>
                  {isTestingNotification ? "Sending test notification..." : 
                   notificationInfo?.requiresInstall ? "Install App for Notifications" :
                   notificationInfo?.permission === 'denied' ? "Enable in Browser Settings" :
                   "Test Notifications"}
                </span>
              </Button>
              
              {/* PWA Environment Information */}
              <div className="mt-4 p-4 rounded-xl border" style={{ 
                background: 'var(--surface-secondary)', 
                borderColor: 'var(--border)' 
              }}>
                <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                  Environment Info
                </h4>
                <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <div>Platform: {notificationInfo?.environment?.platform || 'Unknown'}</div>
                  <div>Installed: {notificationInfo?.environment?.isInstalled ? 'Yes' : 'No'}</div>
                  <div>Strategy: {notificationInfo?.strategy || 'None'}</div>
                  <div>Permission: {notificationInfo?.environment?.permission || 'N/A'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
