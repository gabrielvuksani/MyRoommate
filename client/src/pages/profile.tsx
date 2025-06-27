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
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Edit3, Copy, UserMinus, RefreshCw, Moon, Sun, Check, Bell } from "lucide-react";
import { getProfileInitials } from "@/lib/nameUtils";
import { useTheme } from "@/lib/ThemeProvider";
import BackButton from "../components/back-button";
import LoadingOverlay from "../components/loading-overlay";
import { notificationService } from "@/lib/notificationService";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLeavingHousehold, setIsLeavingHousehold] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
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
    
    // Check notification permission
    setNotificationPermission(notificationService.getPermissionStatus());
    
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
      // Add a small delay to ensure loading state is visible
      const result = await apiRequest("POST", "/api/households/leave", {});
      // Keep loading state visible during cache clear
      await queryClient.clear();
      return result;
    },
    onSuccess: async () => {
      // Redirect happens after mutation completes
      window.location.href = "/";
    },
    onError: (error: any) => {
      console.error("Failed to leave household:", error);
      setIsLeavingHousehold(false);
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
    setIsRefreshing(true);
    // Invalidate queries and redirect immediately
    await queryClient.invalidateQueries();
    window.location.href = "/";
  };

  const handleTestNotification = async () => {
    setIsTestingNotification(true);
    try {
      const success = await notificationService.sendTestNotification();
      if (success) {
        setNotificationPermission(notificationService.getPermissionStatus());
        
        // Send additional demo notifications to showcase different types
        setTimeout(() => {
          notificationService.sendMessageNotification("Alex", "Hey! Are you free this weekend?");
        }, 2000);
        
        setTimeout(() => {
          notificationService.sendChoreNotification("Take out trash", "Sam");
        }, 4000);
        
        setTimeout(() => {
          notificationService.sendExpenseNotification("Groceries", 45.67, "Jordan");
        }, 6000);
      }
    } catch (error) {
      console.error('Test notification failed:', error);
    } finally {
      setIsTestingNotification(false);
    }
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
      {/* Loading overlay for leaving household */}
      {isLeavingHousehold && (
        <LoadingOverlay message="Leaving household..." />
      )}
      
      {/* Loading overlay for refreshing app */}
      {isRefreshing && (
        <LoadingOverlay message="Refreshing app data..." />
      )}
      
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
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {getProfileInitials((user as any).firstName, (user as any).lastName, (user as any).email)}
                  </span>
                </div>
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
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {member.user.firstName?.[0] ||
                            member.user.email?.[0] ||
                            "?"}
                        </span>
                      </div>
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
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Button
                onClick={handleTestNotification}
                disabled={isTestingNotification}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-purple-700 disabled:opacity-50"
              >
                <Bell size={20} className={isTestingNotification ? "animate-pulse" : ""} />
                <span>
                  {isTestingNotification
                    ? "Sending test notification..."
                    : notificationPermission === 'granted'
                    ? "Test Notifications"
                    : notificationPermission === 'denied'
                    ? "Notifications Blocked"
                    : "Enable Notifications"
                  }
                </span>
              </Button>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
                <span>
                  {isRefreshing 
                    ? "Refreshing data & returning home..." 
                    : "Refresh App & Data"
                  }
                </span>
              </Button>
              {(household as any) && (
                <Button
                  onClick={() => {
                    setIsLeavingHousehold(true);
                    leaveHouseholdMutation.mutate();
                  }}
                  disabled={isLeavingHousehold || leaveHouseholdMutation.isPending}
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
