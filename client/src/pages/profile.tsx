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

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);

    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    
    // Check notification environment and settings
    setNotificationInfo(unifiedNotifications.getEnvironmentInfo());
    setNotificationSettings(unifiedNotifications.getSettings());
    
    return () => window.removeEventListener("scroll", handleScroll);
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
      
      // Clear all caches step by step for PWA compatibility
      await queryClient.clear();
      
      // Clear browser storage
      try {
        localStorage.clear();
      } catch (e) {
        console.log('localStorage clear failed:', e);
      }
      
      try {
        sessionStorage.clear();
      } catch (e) {
        console.log('sessionStorage clear failed:', e);
      }
      
      // Clear service worker caches if available
      if ('serviceWorker' in navigator && 'caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (e) {
          console.log('Cache clearing failed:', e);
        }
      }
      
      // Use a more PWA-friendly navigation approach
      setTimeout(() => {
        // Hide the loading first
        PersistentLoading.hide();
        
        // For PWA, use location.replace instead of href to avoid navigation issues
        if (window.location.pathname !== '/') {
          window.location.replace('/');
        } else {
          // If already on home, force a reload
          window.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Refresh error:', error);
      // Fallback: hide loading and try simple reload
      PersistentLoading.hide();
      setTimeout(() => {
        window.location.reload();
      }, 500);
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
    
    if (info.strategy === 'none') {
      alert('Notifications are not supported on mobile browsers. Please install the app to your home screen to receive notifications.');
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
          return;
        }
      }
      
      // Send test notification
      if (info.permission === 'granted' || success) {
        await unifiedNotifications.testNotification();
      }
      
      // Update info after permission change
      setNotificationInfo(unifiedNotifications.getEnvironmentInfo());
      
    } catch (error) {
      console.error('Test notification failed:', error);
      alert('Failed to send test notification. Please check your browser settings.');
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleNotificationToggle = (type: string, enabled: boolean) => {
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
                Manage your account & app settings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-36 px-6 space-y-6">
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
                  ? `Following system (currently ${effectiveTheme})`
                  : `Using ${theme} mode`
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
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
                  {notificationInfo.strategy === 'pwa' && <Smartphone className="w-4 h-4 text-green-600" />}
                  {notificationInfo.strategy === 'web' && <Monitor className="w-4 h-4 text-blue-600" />}
                  {notificationInfo.strategy === 'none' && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                  
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {notificationInfo.strategy === 'pwa' && 'PWA Mode - Push Notifications'}
                    {notificationInfo.strategy === 'web' && 'Browser Mode - Web Notifications'}
                    {notificationInfo.strategy === 'none' && 'Limited Support'}
                  </span>
                </div>
                
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {notificationInfo.strategy === 'pwa' && 'You can receive notifications even when the app is closed.'}
                  {notificationInfo.strategy === 'web' && 'You can receive notifications while using the browser.'}
                  {notificationInfo.strategy === 'none' && 'Install the app to your home screen to receive notifications.'}
                </p>
                
                {notificationInfo.permission === 'denied' && (
                  <p className="text-xs text-red-600 mt-1">
                    Notifications are blocked. Enable them in your browser settings.
                  </p>
                )}
              </div>
            )}

            {/* Master Toggle */}
            {notificationSettings && (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Enable Notifications
                    </span>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Master control for all notification types
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.enabled}
                    onCheckedChange={(checked) => handleNotificationToggle('enabled', checked)}
                    disabled={notificationInfo?.strategy === 'none'}
                  />
                </div>

                {/* Individual Type Controls */}
                {notificationSettings.enabled && (
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

                {/* Test Button */}
                <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <Button
                    onClick={handleTestNotification}
                    disabled={isTestingNotification || notificationInfo?.strategy === 'none' || !notificationSettings.enabled}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
                  >
                    {isTestingNotification ? "Sending..." : "Test Notifications"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}>
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
                  title={(user as any).id}
                >
                  {(user as any).id}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span style={{ color: 'var(--text-secondary)' }}>Member since</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {new Date((user as any).createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <div className="space-y-4">
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
                            onClick={handleUpdateHouseholdName}
                            disabled={
                              !editHouseholdName.trim() ||
                              updateHouseholdNameMutation.isPending
                            }
                            className="w-full bg-primary text-white py-3 rounded-xl font-semibold"
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
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
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
                <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Members</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {(household as any).members?.length || 0}
                  </span>
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
            </CardContent>
          </Card>
        )}

        {/* Household Members */}
        {(household as any)?.members && (
          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Household Members
              </h3>
              <div className="space-y-3">
                {(household as any).members.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3 last:border-b-0"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
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
                    {member.role && (
                      <span className="text-sm capitalize px-2 py-1 rounded flex-shrink-0" style={{
                        color: 'var(--text-secondary)',
                        background: 'var(--surface-secondary)'
                      }}>
                        {member.role}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <Button
                onClick={handleDeleteAllData}
                disabled={deleteAllDataMutation.isPending}
                className="mt-4 w-full bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={20} />
                <span>
                  {deleteAllDataMutation.isPending
                    ? "Deleting All Household Data..."
                    : "Delete All Household Data"}
                </span>
              </Button>
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
                disabled={isTestingNotification || notificationInfo?.strategy === 'none'}
                className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 bg-purple-600 hover:bg-purple-700"
              >
                <Bell size={20} className={isTestingNotification ? "animate-pulse" : ""} />
                <span>
                  {isTestingNotification
                    ? "Sending test notification..."
                    : "Test Notifications"}
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
                  <div>Permission: {notificationInfo?.environment?.permission || 'Unknown'}</div>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-2">
                  <Bell size={16} className="text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-800 dark:text-green-300">Background Notifications Active</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Real push notifications now work automatically for:
                </p>
                <ul className="text-xs text-green-700 dark:text-green-400 mt-1 ml-4 space-y-1">
                  <li>• New messages when app is closed</li>
                  <li>• Chore assignments and completions</li>
                  <li>• New expenses and calendar events</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}>
          <CardContent className="p-6">
            <div className="space-y-3">
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
      </div>
    </div>
  );
}
