import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/ThemeProvider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PersistentLoading } from "@/lib/persistentLoading";
import { unifiedNotifications } from "@/lib/unified-notifications";
import BackButton from "../components/back-button";

// Component imports
import ProfileHeader from "./profile/ProfileHeader";
import ThemePicker from "./profile/ThemePicker";
import AccountDetails from "./profile/AccountDetails";
import NotificationSettings from "./profile/NotificationSettings";
import HouseholdInfo from "./profile/HouseholdInfo";
import DeveloperTools from "./profile/DeveloperTools";

// Types
interface NotificationInfo {
  environment?: any;
  strategy?: string;
  permission?: string;
  requiresInstall?: boolean;
  canRequest?: boolean;
  supportLevel?: string;
}

export default function Profile() {
  // Auth and routing
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // UI State
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Edit dialogs state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState({ firstName: "", lastName: "" });
  const [isHouseholdEditOpen, setIsHouseholdEditOpen] = useState(false);
  const [editHouseholdName, setEditHouseholdName] = useState("");

  // Notification state
  const [notificationInfo, setNotificationInfo] = useState<NotificationInfo | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<any>(null);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [canShowNotifications, setCanShowNotifications] = useState(false);

  // Theme
  const { theme, effectiveTheme, setTheme } = useTheme();

  // Data queries
  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  // Check if current user is admin
  const isAdmin = (household as any)?.members?.find(
    (member: any) => member.userId === user?.id
  )?.role === 'admin';

  // Mutations
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

  const updateHouseholdMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return await apiRequest("PATCH", "/api/households/current", data);
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
      return await apiRequest("POST", "/api/households/leave");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/household-members"] });
      
      setTimeout(() => {
        PersistentLoading.hide();
        window.location.reload();
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Failed to leave household:", error);
      PersistentLoading.hide();
    },
  });

  const deleteAllDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/households/delete-all");
    },
    onError: (error: any) => {
      console.error("Failed to delete all data:", error);
    },
  });

  // Effects
  useEffect(() => {
    window.scrollTo(0, 0);

    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    checkNotificationCapability();
    
    // Listen for permission changes
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then(permissionStatus => {
          permissionStatus.onchange = () => {
            checkNotificationCapability();
          };
        })
        .catch(() => {});
    }
    
    const handleFocus = () => {
      checkNotificationCapability();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Notification helpers
  const checkNotificationCapability = () => {
    const info = unifiedNotifications.getEnvironmentInfo();
    const settings = unifiedNotifications.getSettings();
    
    const canShow = info.strategy !== 'none' || 
                   ('Notification' in window && Notification.permission !== 'denied');
    
    setNotificationInfo(info);
    setNotificationSettings(settings);
    setCanShowNotifications(canShow);
    
    return canShow;
  };

  // Event handlers
  const handleUpdateName = () => {
    if (editName.firstName.trim()) {
      updateNameMutation.mutate({
        firstName: editName.firstName.trim(),
        lastName: editName.lastName.trim(),
      });
    }
  };

  const handleUpdateHousehold = () => {
    if (editHouseholdName.trim()) {
      updateHouseholdMutation.mutate({ name: editHouseholdName.trim() });
    }
  };

  const handleLeaveHousehold = async () => {
    if (window.confirm("Are you sure you want to leave this household?")) {
      PersistentLoading.show("Leaving household...");
      leaveHouseholdMutation.mutate();
    }
  };

  const logout = () => {
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
      PersistentLoading.show("Refreshing app data...");
      
      await queryClient.clear();
      
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
      
      setTimeout(() => {
        PersistentLoading.hide();
        
        if (window.location.pathname !== '/') {
          window.location.replace('/');
        } else {
          window.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Refresh error:', error);
      PersistentLoading.hide();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleDeleteAllData = async () => {
    if (!window.confirm('Are you sure you want to delete all household data? This action cannot be undone and will remove all chores, expenses, messages, calendar events, and household members. Your roommate listings will be preserved.')) {
      return;
    }

    try {
      PersistentLoading.show("Deleting all data...");
      
      await deleteAllDataMutation.mutateAsync();
      
      setTimeout(() => {
        PersistentLoading.hide();
        window.location.replace('/');
      }, 1000);
      
    } catch (error) {
      console.error('Delete all data error:', error);
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
  };

  const handleNotificationToggle = async (type: string, enabled: boolean) => {
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
        <ProfileHeader
          user={user}
          isEditOpen={isEditOpen}
          setIsEditOpen={setIsEditOpen}
          editName={editName}
          setEditName={setEditName}
          handleUpdateName={handleUpdateName}
          updateNameMutation={updateNameMutation}
          theme={theme}
          effectiveTheme={effectiveTheme}
          setTheme={setTheme}
        />

        {user && (
          <AccountDetails user={user} />
        )}

        {canShowNotifications && (
          <NotificationSettings
            notificationInfo={notificationInfo}
            notificationSettings={notificationSettings}
            handleNotificationToggle={handleNotificationToggle}
          />
        )}

        {household && (
          <HouseholdInfo
            household={household}
            isAdmin={isAdmin}
            isCopied={isCopied}
            isHouseholdEditOpen={isHouseholdEditOpen}
            setIsHouseholdEditOpen={setIsHouseholdEditOpen}
            editHouseholdName={editHouseholdName}
            setEditHouseholdName={setEditHouseholdName}
            handleUpdateHousehold={handleUpdateHousehold}
            updateHouseholdMutation={updateHouseholdMutation}
            copyInviteCode={copyInviteCode}
            handleLeaveHousehold={handleLeaveHousehold}
            handleDeleteAllData={handleDeleteAllData}
            logout={logout}
          />
        )}

        <DeveloperTools
          handleRefresh={handleRefresh}
          handleTestNotification={handleTestNotification}
          isTestingNotification={isTestingNotification}
          notificationSettings={notificationSettings}
          notificationInfo={notificationInfo}
        />
      </div>
    </div>
  );
}